import os
import json # <--- ENSURED IMPORT
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import create_access_token, jwt_required, JWTManager, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS # Ensure CORS is imported
from decimal import Decimal # For trade/portfolio logic

# Initialize Flask App
app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('postgresql://trader_app_user:a_much_stronger_password@localhost:5432/trader_db', 'postgresql://trader_app_user:a_much_stronger_password@localhost/trader_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super-secret-dev-key')
app.config['ALPHA_VANTAGE_API_KEY'] = os.environ.get('ALPHA_VANTAGE_API_KEY', '672OTZDNKCMUIFDY')

# Initialize CORS - Placed after config and before other extensions
CORS(app, resources={r'/*': {'origins': ['http://localhost:3000', 'http://127.0.0.1:3000']}}, supports_credentials=True)

# Initialize Extensions
from models import db, User, EducationalContent, Asset, Trade, PortfolioHolding # Import all models
db.init_app(app)
jwt = JWTManager(app)

# Alpha Vantage specific imports (needed for price fetching helper)
from alpha_vantage.foreignexchange import ForeignExchange
from alpha_vantage.timeseries import TimeSeries
import requests


# --- Database Initialization Command (for development) ---
@app.cli.command("init-db")
def init_db_command():
    with app.app_context():
        db.create_all()
    print("Initialized the database. All tables created.")

# --- API Endpoints ---
@app.route('/')
def home():
    return jsonify(message="Welcome to the Trading Education Platform API!")

@app.route('/health')
def health_check():
    try:
        db.session.execute('SELECT 1') # Use text() for SQLAlchemy 2.0 if needed: db.session.execute(text('SELECT 1'))
        return jsonify(status='healthy', database_status='connected')
    except Exception as e:
        return jsonify(status='unhealthy', database_status='disconnected', error=str(e)), 500

# --- User Authentication Endpoints ---
@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data: return jsonify(message="Request body must be JSON"), 400
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
    if not data: return jsonify(message="Request body must be JSON"), 400
    username_or_email = data.get('username_or_email')
    password = data.get('password')

    if not username_or_email or not password:
        return jsonify(message="Username/email and password are required"), 400

    user_query = User.query.filter((User.username == username_or_email) | (User.email == username_or_email))
    user = user_query.first()

    if user and user.check_password(password):
        identity_data = {'id': user.id, 'username': user.username}
        access_token = create_access_token(identity=json.dumps(identity_data)) # CORRECTED
        return jsonify(access_token=access_token), 200
    else:
        return jsonify(message="Invalid username/email or password"), 401

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    raw_identity = get_jwt_identity()
    current_user_identity = json.loads(raw_identity) # CORRECTED
    return jsonify(logged_in_as=current_user_identity), 200

# --- Educational Content (CMS) Endpoints ---
@app.route('/content', methods=['POST'])
@jwt_required()
def create_content():
    data = request.get_json()
    if not data: return jsonify(message="Request body must be JSON"), 400
    title = data.get('title')
    content_type = data.get('content_type')
    body = data.get('body')
    video_url = data.get('video_url')
    
    raw_identity = get_jwt_identity()
    current_user_identity_dict = json.loads(raw_identity) # CORRECTED
    author_id = current_user_identity_dict['id']

    if not title or not content_type: return jsonify(message="Title and content_type are required"), 400
    if content_type not in ['article', 'video', 'tutorial']:
        return jsonify(message="Invalid content_type. Must be 'article', 'video', or 'tutorial'."), 400

    new_content = EducationalContent(title=title, content_type=content_type, body=body, video_url=video_url, author_id=author_id)
    try:
        db.session.add(new_content)
        db.session.commit()
    except Exception as e:
        db.session.rollback(); app.logger.error(f"Error creating content: {str(e)}"); return jsonify(message="Error creating content"), 500
    return jsonify(message="Content created successfully", content=new_content.to_dict()), 201

@app.route('/content', methods=['GET'])
def list_content():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    contents_pagination = EducationalContent.query.order_by(EducationalContent.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    contents = contents_pagination.items
    return jsonify(contents=[content.to_dict() for content in contents], total=contents_pagination.total, pages=contents_pagination.pages, current_page=contents_pagination.page), 200

@app.route('/content/<int:content_id>', methods=['GET'])
def get_content(content_id):
    content = EducationalContent.query.get(content_id)
    if not content: return jsonify(message="Content not found"), 404
    return jsonify(content.to_dict()), 200

@app.route('/content/<int:content_id>', methods=['PUT'])
@jwt_required()
def update_content(content_id):
    content = EducationalContent.query.get(content_id)
    if not content: return jsonify(message="Content not found"), 404
    
    raw_identity = get_jwt_identity()
    current_user_identity_dict = json.loads(raw_identity) # CORRECTED
    if content.author_id != current_user_identity_dict['id']: return jsonify(message="Forbidden: You can only update your own content"), 403

    data = request.get_json();
    if not data: return jsonify(message="Request body must be JSON"), 400
    content.title = data.get('title', content.title)
    content.content_type = data.get('content_type', content.content_type)
    content.body = data.get('body', content.body)
    content.video_url = data.get('video_url', content.video_url)
    if content.content_type not in ['article', 'video', 'tutorial']: return jsonify(message="Invalid content_type"), 400
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback(); app.logger.error(f"Error updating content: {str(e)}"); return jsonify(message="Error updating content"), 500
    return jsonify(message="Content updated successfully", content=content.to_dict()), 200

@app.route('/content/<int:content_id>', methods=['DELETE'])
@jwt_required()
def delete_content(content_id):
    content = EducationalContent.query.get(content_id)
    if not content: return jsonify(message="Content not found"), 404

    raw_identity = get_jwt_identity()
    current_user_identity_dict = json.loads(raw_identity) # CORRECTED
    if content.author_id != current_user_identity_dict['id']: return jsonify(message="Forbidden: You can only delete your own content"), 403
    
    try:
        db.session.delete(content)
        db.session.commit()
    except Exception as e:
        db.session.rollback(); app.logger.error(f"Error deleting content: {str(e)}"); return jsonify(message="Error deleting content"), 500
    return jsonify(message="Content deleted successfully"), 200

# --- Asset and Price Data Endpoints ---
@app.route('/assets', methods=['GET'])
@jwt_required() 
def list_assets():
    # @jwt_required handles token verification; identity is string if properly set by login
    # No direct get_jwt_identity() call here, but it's used by @jwt_required
    try:
        assets = Asset.query.all()
        return jsonify(assets=[asset.to_dict() for asset in assets]), 200
    except Exception as e:
        app.logger.error(f"Error fetching assets: {str(e)}")
        return jsonify(message="Error fetching assets from database"), 500

# --- Helper function to get current price ---
def get_current_price_for_asset(asset_db_object): 
    api_key = app.config.get('ALPHA_VANTAGE_API_KEY')
    if not api_key or api_key == 'YOUR_ALPHA_VANTAGE_API_KEY':
        app.logger.error("Alpha Vantage API Key not configured.")
        return None

    price_str = None; data_from_av = None
    try:
        if asset_db_object.asset_type.lower() == 'stock':
            ts = TimeSeries(key=api_key, output_format='json')
            data_from_av, _ = ts.get_quote_endpoint(symbol=asset_db_object.symbol)
            price_str = data_from_av.get('05. price') if data_from_av else None
        elif asset_db_object.asset_type.lower() == 'crypto':
            if len(asset_db_object.symbol) > 3 and asset_db_object.symbol.endswith('USD'):
                from_currency = asset_db_object.symbol[:-3]; to_currency = 'USD'
                fe = ForeignExchange(key=api_key, output_format='json')
                data_from_av, _ = fe.get_currency_exchange_rate(from_currency_code=from_currency, to_currency_code=to_currency)
                price_str = data_from_av.get('Realtime Currency Exchange Rate', {}).get('5. Exchange Rate') if data_from_av else None
            else:
                app.logger.warning(f"Unsupported crypto symbol format: {asset_db_object.symbol}")
                return None
        if price_str: return Decimal(price_str)
        app.logger.warning(f"Price not found for {asset_db_object.symbol}. AV Data: {data_from_av}")
        return None
    except requests.exceptions.RequestException as e: app.logger.error(f"Network error for {asset_db_object.symbol}: {str(e)}"); return None
    except ValueError as e: app.logger.error(f"AV API error for {asset_db_object.symbol}: {str(e)}"); return None
    except Exception as e: app.logger.error(f"Unexpected error for {asset_db_object.symbol}: {str(e)}"); return None

@app.route('/assets/<string:symbol>/price', methods=['GET'])
@jwt_required()
def get_asset_price(symbol):
    # @jwt_required handles token verification
    asset_from_db = Asset.query.filter_by(symbol=symbol.upper()).first()
    if not asset_from_db: return jsonify(message=f"Asset {symbol} not found."), 404
    current_price = get_current_price_for_asset(asset_from_db)
    if current_price is not None:
        return jsonify(symbol=asset_from_db.symbol, price=str(current_price), asset_type=asset_from_db.asset_type), 200
    else:
        return jsonify(message=f"Could not get price for {symbol}."), 503

# --- Trading Simulator Endpoints ---
@app.route('/trades/order', methods=['POST'])
@jwt_required()
def place_trade_order():
    data = request.get_json()
    if not data: return jsonify(message="Request body must be JSON"), 400
    asset_symbol = data.get('asset_symbol'); order_type = data.get('order_type')
    try:
        quantity_str = data.get('quantity'); quantity = Decimal(quantity_str)
        if quantity <= Decimal(0): raise ValueError("Quantity must be positive.")
    except (ValueError, TypeError) as e: return jsonify(message=f"Invalid quantity: {str(e)}"), 400

    if not asset_symbol or not order_type: return jsonify(message="All fields required"), 400
    if order_type not in ['market_buy', 'market_sell']: return jsonify(message="Invalid order_type"), 400

    raw_identity = get_jwt_identity()
    current_user_identity_dict = json.loads(raw_identity) # CORRECTED
    user_id = current_user_identity_dict['id']
    
    asset = Asset.query.filter_by(symbol=asset_symbol.upper()).first()
    if not asset: return jsonify(message=f"Asset '{asset_symbol}' not found."), 404

    current_price = get_current_price_for_asset(asset)
    if current_price is None: return jsonify(message=f"Could not get price for {asset_symbol}"), 503

    holding = PortfolioHolding.query.filter_by(user_id=user_id, asset_id=asset.id).first()
    if order_type == 'market_sell':
        if not holding or holding.quantity < quantity: return jsonify(message="Insufficient holdings"), 400
        holding.quantity -= quantity
        if holding.quantity == Decimal(0): db.session.delete(holding)
    elif order_type == 'market_buy':
        if holding:
            avg_price = Decimal(holding.average_purchase_price) # Ensure Decimal
            current_qty = Decimal(holding.quantity)      # Ensure Decimal
            new_total_cost = (avg_price * current_qty) + (current_price * quantity)
            holding.quantity = current_qty + quantity
            holding.average_purchase_price = new_total_cost / holding.quantity
        else:
            holding = PortfolioHolding(user_id=user_id, asset_id=asset.id, quantity=quantity, average_purchase_price=current_price)
            db.session.add(holding)

    new_trade = Trade(user_id=user_id, asset_id=asset.id, order_type=order_type, quantity=quantity, price_at_execution=current_price)
    db.session.add(new_trade)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback(); app.logger.error(f"Error in trade order: {str(e)}"); return jsonify(message="Error processing order"), 500
    return jsonify(message="Order placed", trade=new_trade.to_dict(), holding_updated=(holding.to_dict() if holding and holding.quantity > 0 else None)), 201

@app.route('/portfolio', methods=['GET'])
@jwt_required()
def get_portfolio():
    raw_identity = get_jwt_identity()
    current_user_identity_dict = json.loads(raw_identity) # CORRECTED
    user_id = current_user_identity_dict['id']

    holdings = PortfolioHolding.query.filter_by(user_id=user_id).all()
    portfolio_data = []; total_portfolio_value = Decimal(0); total_portfolio_cost = Decimal(0)

    for holding_item in holdings: 
        current_holding_qty = Decimal(holding_item.quantity) # Ensure Decimal
        if current_holding_qty <= Decimal(0): continue
        asset_item = Asset.query.get(holding_item.asset_id) 
        if not asset_item: continue 

        current_price = get_current_price_for_asset(asset_item)
        current_value_str, profit_loss_str, profit_loss_percent_str = "N/A", "N/A", "N/A"
        
        avg_purchase_price = Decimal(holding_item.average_purchase_price) # Ensure Decimal
        holding_cost = avg_purchase_price * current_holding_qty
        total_portfolio_cost += holding_cost

        if current_price is not None:
            current_value = current_price * current_holding_qty
            total_portfolio_value += current_value
            profit_loss = current_value - holding_cost
            current_value_str = f"{current_value:.2f}"; profit_loss_str = f"{profit_loss:.2f}"
            if holding_cost != Decimal(0): profit_loss_percent_str = f"{(profit_loss / holding_cost) * Decimal(100):.2f}%"
            else: profit_loss_percent_str = "N/A" if profit_loss == Decimal(0) else ("+Inf%" if profit_loss > Decimal(0) else "-Inf%")
        
        portfolio_data.append({
            'asset_id': holding_item.asset_id, 'symbol': asset_item.symbol, 'name': asset_item.name,
            'quantity': str(current_holding_qty), 'average_purchase_price': f"{avg_purchase_price:.2f}",
            'current_price': f"{current_price:.2f}" if current_price is not None else "N/A",
            'current_value': current_value_str, 'holding_cost': f"{holding_cost:.2f}",
            'profit_loss': profit_loss_str, 'profit_loss_percent': profit_loss_percent_str
        })
    overall_profit_loss = total_portfolio_value - total_portfolio_cost
    overall_profit_loss_percent_str = "N/A"
    if total_portfolio_cost != Decimal(0): overall_profit_loss_percent_str = f"{(overall_profit_loss / total_portfolio_cost) * Decimal(100):.2f}%"
    elif total_portfolio_value > Decimal(0) and total_portfolio_cost == Decimal(0) : overall_profit_loss_percent_str = "+Inf%"
    elif total_portfolio_value == Decimal(0) and total_portfolio_cost == Decimal(0): overall_profit_loss_percent_str = "0.00%"


    return jsonify(holdings=portfolio_data, summary={'total_portfolio_value': f"{total_portfolio_value:.2f}", 'total_portfolio_cost': f"{total_portfolio_cost:.2f}", 'overall_profit_loss': f"{overall_profit_loss:.2f}", 'overall_profit_loss_percent': overall_profit_loss_percent_str}), 200

if __name__ == '__main__':
    with app.app_context():
        # db.drop_all() # Optional: for clean slate during dev, use with caution
        db.create_all() 
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
