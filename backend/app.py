import os
from decimal import Decimal, ROUND_HALF_UP
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import create_access_token, jwt_required, JWTManager, get_jwt_identity
from flask_cors import CORS
from alpha_vantage.foreignexchange import ForeignExchange
from alpha_vantage.timeseries import TimeSeries
import requests # for potential error handling

# Initialize Flask App
app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('postgresql://trader_app_user:a_much_stronger_password@localhost:5432/trader_db', 'postgresql://trader_app_user:a_much_stronger_password@localhost/trader_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super-secret-dev-key')
app.config['ALPHA_VANTAGE_API_KEY'] = os.environ.get('ALPHA_VANTAGE_API_KEY', '2BTZISOXKVH6KT2T') # Get your free key!

# Initialize Extensions
from models import db, User, EducationalContent, Asset, Trade, PortfolioHolding
db.init_app(app)
CORS(app, resources={r'/*': {'origins': ['http://localhost:3000', 'http://127.0.0.1:3000']}}, supports_credentials=True)
jwt = JWTManager(app)

# --- Database Initialization Command (for development) ---
@app.cli.command("init-db")
def init_db_command():
    with app.app_context():
        db.create_all()
    print("Initialized the database.")

# --- API Endpoints ---
@app.route('/')
def home():
    return jsonify(message="Welcome to the Trading Education Platform API!")

@app.route('/health')
def health_check():
    try:
        db.session.execute('SELECT 1')
        return jsonify(status='healthy', database_status='connected')
    except Exception as e:
        return jsonify(status='unhealthy', database_status='disconnected', error=str(e)), 500

# --- User Authentication Endpoints ---
@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify(message="Request body must be JSON"), 400

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify(message="Username, email, and password are required"), 400

    if not isinstance(username, str) or not isinstance(email, str) or not isinstance(password, str):
        return jsonify(message="Username, email, and password must be strings"), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify(message="Username or email already exists"), 409

    new_user = User(username=username, email=email)
    new_user.set_password(password)

    try:
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error registering user {username}: {str(e)}")
        return jsonify(message="Error creating user on the server"), 500

    return jsonify(message="User registered successfully", user={'id': new_user.id, 'username': new_user.username, 'email': new_user.email}), 201

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify(message="Request body must be JSON"), 400

    username_or_email = data.get('username_or_email')
    password = data.get('password')

    if not username_or_email or not password:
        return jsonify(message="Username/email and password are required"), 400

    if '@' in username_or_email:
        user = User.query.filter_by(email=username_or_email).first()
    else:
        user = User.query.filter_by(username=username_or_email).first()

    if user and user.check_password(password):
        access_token = create_access_token(identity={'id': user.id, 'username': user.username})
        return jsonify(access_token=access_token), 200
    else:
        return jsonify(message="Invalid username/email or password"), 401

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user_identity = get_jwt_identity()
    return jsonify(logged_in_as=current_user_identity), 200


# --- Educational Content (CMS) Endpoints ---

@app.route('/content', methods=['POST'])
@jwt_required()
def create_content():
    data = request.get_json()
    if not data:
        return jsonify(message="Request body must be JSON"), 400

    title = data.get('title')
    content_type = data.get('content_type')
    body = data.get('body')
    video_url = data.get('video_url')
    current_user_identity = get_jwt_identity() # { 'id': user.id, 'username': user.username }
    author_id = current_user_identity['id']

    if not title or not content_type:
        return jsonify(message="Title and content_type are required"), 400

    if content_type not in ['article', 'video', 'tutorial']:
        return jsonify(message="Invalid content_type. Must be 'article', 'video', or 'tutorial'."), 400

    new_content = EducationalContent(
        title=title,
        content_type=content_type,
        body=body,
        video_url=video_url,
        author_id=author_id
    )

    try:
        db.session.add(new_content)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error creating content: {str(e)}")
        return jsonify(message="Error creating content on the server"), 500

    return jsonify(message="Content created successfully", content=new_content.to_dict()), 201

@app.route('/content', methods=['GET'])
def list_content():
    # Basic pagination could be added here (e.g., using request.args.get('page', 1, type=int))
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    contents_pagination = EducationalContent.query.order_by(EducationalContent.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False) # Corrected paginate call
    contents = contents_pagination.items

    return jsonify(
        contents=[content.to_dict() for content in contents],
        total=contents_pagination.total,
        pages=contents_pagination.pages,
        current_page=contents_pagination.page
    ), 200

@app.route('/content/<int:content_id>', methods=['GET'])
def get_content(content_id):
    content = EducationalContent.query.get(content_id)
    if not content:
        return jsonify(message="Content not found"), 404
    return jsonify(content.to_dict()), 200

@app.route('/content/<int:content_id>', methods=['PUT'])
@jwt_required()
def update_content(content_id):
    content = EducationalContent.query.get(content_id)
    if not content:
        return jsonify(message="Content not found"), 404

    # Basic authorization: only author can update (or admin in future)
    current_user_identity = get_jwt_identity()
    if content.author_id != current_user_identity['id']:
        # In a real app, you might also allow admins
        return jsonify(message="Forbidden: You can only update your own content"), 403

    data = request.get_json()
    if not data:
        return jsonify(message="Request body must be JSON"), 400

    content.title = data.get('title', content.title)
    content.content_type = data.get('content_type', content.content_type)
    content.body = data.get('body', content.body)
    content.video_url = data.get('video_url', content.video_url)
    # author_id should not be changed via this endpoint typically
    # updated_at is handled by the model/database

    if content.content_type not in ['article', 'video', 'tutorial']:
        return jsonify(message="Invalid content_type. Must be 'article', 'video', or 'tutorial'."), 400

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating content {content_id}: {str(e)}")
        return jsonify(message="Error updating content on the server"), 500

    return jsonify(message="Content updated successfully", content=content.to_dict()), 200

@app.route('/content/<int:content_id>', methods=['DELETE'])
@jwt_required()
def delete_content(content_id):
    content = EducationalContent.query.get(content_id)
    if not content:
        return jsonify(message="Content not found"), 404

    current_user_identity = get_jwt_identity()
    if content.author_id != current_user_identity['id']:
        # Extend with admin role check later
        return jsonify(message="Forbidden: You can only delete your own content"), 403

    try:
        db.session.delete(content)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting content {content_id}: {str(e)}")
        return jsonify(message="Error deleting content on the server"), 500

    return jsonify(message="Content deleted successfully"), 200


# --- Asset and Price Data Endpoints ---

@app.route('/assets', methods=['GET'])
@jwt_required() # Require login to see assets, can be removed if assets are public
def list_assets():
    try:
        assets = Asset.query.all()
        return jsonify(assets=[asset.to_dict() for asset in assets]), 200
    except Exception as e:
        app.logger.error(f"Error fetching assets: {str(e)}")
        return jsonify(message="Error fetching assets from database"), 500

@app.route('/assets/<string:symbol>/price', methods=['GET'])
@jwt_required() # Require login to see prices
def get_asset_price(symbol):
    asset = Asset.query.filter_by(symbol=symbol.upper()).first()
    if not asset:
        return jsonify(message=f"Asset with symbol {symbol} not found in our database."), 404

    api_key = app.config.get('ALPHA_VANTAGE_API_KEY')
    if not api_key or api_key == 'YOUR_ALPHA_VANTAGE_API_KEY':
        app.logger.error("Alpha Vantage API Key not configured.")
        return jsonify(message="Price service is temporarily unavailable. API key missing."), 503 # Service Unavailable

    price = None
    data_from_av = None # To store data from AV for logging
    try:
        if asset.asset_type.lower() == 'stock':
            ts = TimeSeries(key=api_key, output_format='json')
            data_from_av, meta_data = ts.get_quote_endpoint(symbol=asset.symbol)
            price = data_from_av.get('05. price') if data_from_av else None
        elif asset.asset_type.lower() == 'crypto':
            if len(asset.symbol) > 3 and asset.symbol.endswith('USD'):
                from_currency = asset.symbol[:-3]
                to_currency = 'USD'
                fe = ForeignExchange(key=api_key, output_format='json')
                data_from_av, _ = fe.get_currency_exchange_rate(from_currency_code=from_currency, to_currency_code=to_currency)
                price = data_from_av.get('Realtime Currency Exchange Rate', {}).get('5. Exchange Rate') if data_from_av else None
            else:
                return jsonify(message=f"Crypto symbol format {asset.symbol} not directly supported for pricing. Expected format like 'BTCUSD'."), 400
        else:
            return jsonify(message=f"Asset type '{asset.asset_type}' not supported for live pricing."), 400

        if price:
            return jsonify(symbol=asset.symbol, price=price, asset_type=asset.asset_type), 200
        else:
            app.logger.warning(f"Could not retrieve price for {symbol} from Alpha Vantage. Data: {data_from_av}")
            return jsonify(message=f"Could not retrieve price for {symbol} at this moment."), 503

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Network error fetching price for {symbol} from Alpha Vantage: {str(e)}")
        return jsonify(message=f"Network error while fetching price for {symbol}."), 504
    except ValueError as e:
         app.logger.error(f"Alpha Vantage API error for {symbol}: {str(e)}")
         if "call frequency" in str(e).lower():
             return jsonify(message="API call frequency limit reached. Please try again later."), 429
         return jsonify(message=f"Error processing price data for {symbol}."), 500
    except Exception as e:
        app.logger.error(f"Unexpected error fetching price for {symbol} from Alpha Vantage: {str(e)}")
        return jsonify(message=f"An unexpected error occurred while fetching price for {symbol}."), 500

# --- Helper function to get current price (refactored for reuse) ---
# This function abstracts the price fetching logic used in previous step and for portfolio valuation
def get_current_price_for_asset(asset_symbol_db):
    # asset_symbol_db is an Asset object from DB
    api_key = app.config.get('ALPHA_VANTAGE_API_KEY')
    if not api_key or api_key == 'YOUR_ALPHA_VANTAGE_API_KEY':
        app.logger.error("Alpha Vantage API Key not configured for price fetching helper.")
        return None # Or raise an exception

    price_str = None
    data_from_av = None # For logging
    try:
        if asset_symbol_db.asset_type.lower() == 'stock':
            ts = TimeSeries(key=api_key, output_format='json')
            data_from_av, _ = ts.get_quote_endpoint(symbol=asset_symbol_db.symbol)
            price_str = data_from_av.get('05. price') if data_from_av else None
        elif asset_symbol_db.asset_type.lower() == 'crypto':
            if len(asset_symbol_db.symbol) > 3 and asset_symbol_db.symbol.endswith('USD'):
                from_currency = asset_symbol_db.symbol[:-3]
                to_currency = 'USD'
                fe = ForeignExchange(key=api_key, output_format='json')
                data_from_av, _ = fe.get_currency_exchange_rate(from_currency_code=from_currency, to_currency_code=to_currency)
                price_str = data_from_av.get('Realtime Currency Exchange Rate', {}).get('5. Exchange Rate') if data_from_av else None
            else:
                app.logger.warning(f"Unsupported crypto symbol format for pricing: {asset_symbol_db.symbol}")
                return None

        if price_str:
            return Decimal(price_str)
        app.logger.warning(f"Price string not found for {asset_symbol_db.symbol}. Data from AV: {data_from_av}")
        return None
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Network error fetching price for {asset_symbol_db.symbol} in helper: {str(e)}")
        return None
    except ValueError as e:
        app.logger.error(f"Alpha Vantage API error for {asset_symbol_db.symbol} in helper: {str(e)}")
        return None
    except Exception as e:
        app.logger.error(f"Unexpected error fetching price for {asset_symbol_db.symbol} in helper: {str(e)}")
        return None

# --- Trading Simulator Endpoints (Orders & Portfolio) ---

@app.route('/trades/order', methods=['POST'])
@jwt_required()
def place_trade_order():
    data = request.get_json()
    if not data:
        return jsonify(message="Request body must be JSON"), 400

    asset_symbol = data.get('asset_symbol')
    order_type = data.get('order_type')
    try:
        quantity_str = data.get('quantity')
        if quantity_str is None:
            raise ValueError("Quantity is required.")
        quantity = Decimal(quantity_str)
        if quantity <= Decimal(0):
            raise ValueError("Quantity must be positive.")
    except (ValueError, TypeError) as e: # Catching TypeError as well for robustness
        return jsonify(message=f"Invalid quantity: {str(e)}"), 400

    if not asset_symbol or not order_type:
        return jsonify(message="asset_symbol, order_type, and quantity are required"), 400

    if order_type not in ['market_buy', 'market_sell']:
        return jsonify(message="Invalid order_type. Must be 'market_buy' or 'market_sell'."), 400

    current_user_identity = get_jwt_identity()
    user_id = current_user_identity['id']

    asset = Asset.query.filter_by(symbol=asset_symbol.upper()).first()
    if not asset:
        return jsonify(message=f"Asset '{asset_symbol}' not found."), 404

    current_price = get_current_price_for_asset(asset)
    if current_price is None:
        return jsonify(message=f"Could not retrieve current price for {asset_symbol}. Order cannot be placed."), 503

    holding = PortfolioHolding.query.filter_by(user_id=user_id, asset_id=asset.id).first()

    if order_type == 'market_sell':
        if not holding or holding.quantity < quantity:
            return jsonify(message=f"Insufficient holdings to sell {quantity} of {asset_symbol}."), 400

        holding.quantity -= quantity
        if holding.quantity == Decimal(0):
            db.session.delete(holding)

    elif order_type == 'market_buy':
        if holding:
            # Ensure holding.average_purchase_price and holding.quantity are Decimals
            avg_price_decimal = Decimal(holding.average_purchase_price) if not isinstance(holding.average_purchase_price, Decimal) else holding.average_purchase_price
            quantity_decimal = Decimal(holding.quantity) if not isinstance(holding.quantity, Decimal) else holding.quantity

            new_total_value = (avg_price_decimal * quantity_decimal) + (current_price * quantity)
            holding.quantity = quantity_decimal + quantity # Ensure Decimal arithmetic
            if holding.quantity > Decimal(0):
                 holding.average_purchase_price = new_total_value / holding.quantity
            else:
                 holding.average_purchase_price = Decimal(0)
        else:
            holding = PortfolioHolding(
                user_id=user_id,
                asset_id=asset.id,
                quantity=quantity,
                average_purchase_price=current_price
            )
            db.session.add(holding)

    new_trade = Trade(
        user_id=user_id,
        asset_id=asset.id,
        order_type=order_type,
        quantity=quantity,
        price_at_execution=current_price
    )
    db.session.add(new_trade)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error processing trade order for user {user_id}, asset {asset_symbol}: {str(e)}")
        return jsonify(message="Error processing trade order on the server."), 500

    return jsonify(message=f"Order to {order_type} {quantity} of {asset_symbol} at {current_price:.2f} placed successfully.",
                   trade=new_trade.to_dict(),
                   holding_updated=(holding.to_dict() if holding and (holding.quantity > Decimal(0) if hasattr(holding, 'quantity') else True) else None)), 201


@app.route('/portfolio', methods=['GET'])
@jwt_required()
def get_portfolio():
    current_user_identity = get_jwt_identity()
    user_id = current_user_identity['id']

    holdings = PortfolioHolding.query.filter_by(user_id=user_id).all()

    portfolio_data = []
    total_portfolio_value = Decimal(0)
    total_portfolio_cost = Decimal(0)

    for holding in holdings:
        # Ensure holding.quantity is treated as Decimal and skip if zero or less
        current_holding_quantity = Decimal(holding.quantity) if not isinstance(holding.quantity, Decimal) else holding.quantity
        if current_holding_quantity <= Decimal(0):
            if current_holding_quantity < Decimal(0): # Log negative quantity as an anomaly
                 app.logger.warning(f"User {user_id} has asset {holding.asset_id} with non-positive quantity {current_holding_quantity}. Skipping.")
            continue # Skip zero or negative holdings from display

        asset = Asset.query.get(holding.asset_id)
        if not asset:
            app.logger.error(f"Asset with id {holding.asset_id} not found for user {user_id}'s portfolio. Skipping.")
            continue

        current_price = get_current_price_for_asset(asset)
        current_value_str = "N/A"
        profit_loss_str = "N/A"
        profit_loss_percent_str = "N/A"

        avg_purchase_price_decimal = Decimal(holding.average_purchase_price) if not isinstance(holding.average_purchase_price, Decimal) else holding.average_purchase_price
        holding_cost = avg_purchase_price_decimal * current_holding_quantity
        total_portfolio_cost += holding_cost

        if current_price is not None:
            current_value = current_price * current_holding_quantity
            total_portfolio_value += current_value
            profit_loss = current_value - holding_cost

            current_value_str = f"{current_value:.2f}"
            profit_loss_str = f"{profit_loss:.2f}"
            if holding_cost != Decimal(0): # Avoid division by zero
                profit_loss_percent = (profit_loss / holding_cost) * Decimal(100)
                profit_loss_percent_str = f"{profit_loss_percent:.2f}%"
            else: # Cost is zero
                profit_loss_percent_str = "N/A" if profit_loss == Decimal(0) else ("+Inf%" if profit_loss > Decimal(0) else "-Inf%")
        else:
            app.logger.warning(f"Could not fetch current price for {asset.symbol} for portfolio of user {user_id}.")

        portfolio_data.append({
            'asset_id': holding.asset_id,
            'symbol': asset.symbol,
            'name': asset.name,
            'quantity': str(current_holding_quantity),
            'average_purchase_price': f"{avg_purchase_price_decimal:.2f}",
            'current_price': f"{current_price:.2f}" if current_price is not None else "N/A",
            'current_value': current_value_str,
            'holding_cost': f"{holding_cost:.2f}",
            'profit_loss': profit_loss_str,
            'profit_loss_percent': profit_loss_percent_str
        })

    overall_profit_loss = total_portfolio_value - total_portfolio_cost
    overall_profit_loss_percent_str = "N/A"
    if total_portfolio_cost != Decimal(0):
        overall_profit_loss_percent = (overall_profit_loss / total_portfolio_cost) * Decimal(100)
        overall_profit_loss_percent_str = f"{overall_profit_loss_percent:.2f}%"
    elif total_portfolio_value > Decimal(0) and total_portfolio_cost == Decimal(0) :
        overall_profit_loss_percent_str = "+Inf%"
    elif total_portfolio_value == Decimal(0) and total_portfolio_cost == Decimal(0):
        overall_profit_loss_percent_str = "0.00%"


    return jsonify(
        holdings=portfolio_data,
        summary={
            'total_portfolio_value': f"{total_portfolio_value:.2f}",
            'total_portfolio_cost': f"{total_portfolio_cost:.2f}",
            'overall_profit_loss': f"{overall_profit_loss:.2f}",
            'overall_profit_loss_percent': overall_profit_loss_percent_str
        }
    ), 200
# Ensure this block is added BEFORE the if __name__ == '__main__': line
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
