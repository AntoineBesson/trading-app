import os
import json
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import create_access_token, jwt_required, JWTManager, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from decimal import Decimal
from datetime import timedelta # Ensure timedelta is imported for explicit token expiry
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Flask App
app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 
    os.environ.get('postgresql://trader_app_user:a_much_stronger_password@localhost:5432/trader_db', 'postgresql://trader_app_user:a_much_stronger_password@localhost/trader_db')
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super-secret-dev-key-make-sure-to-change-this') # Added a more explicit warning in default
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=15) # Explicitly setting default, can be configured via ENV if needed
app.config['ALPHA_VANTAGE_API_KEY'] = os.environ.get('ALPHA_VANTAGE_API_KEY', 'YOUR_ALPHA_VANTAGE_API_KEY_PLEASE_SET') # Added a more explicit warning

# Initialize CORS
# Allow all origins specified in FRONTEND_URL or default to localhost
frontend_urls = [url.strip() for url in os.environ.get('FRONTEND_URL', 'http://localhost:3000,http://127.0.0.1:3000').split(',') if url.strip()]
if not frontend_urls: # Fallback if FRONTEND_URL is empty string
    frontend_urls = ['http://localhost:3000', 'http://127.0.0.1:3000']

CORS(app, resources={r'/*': {'origins': frontend_urls}}, supports_credentials=True)


# Initialize Extensions
# Ensure models.py is correctly structured and in the same directory or accessible via PYTHONPATH
from models import db, User, EducationalContent, Asset, Trade, PortfolioHolding
db.init_app(app)
jwt = JWTManager(app)

# Alpha Vantage specific imports
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
        db.session.execute(db.text('SELECT 1'))
        return jsonify(status='healthy', database_status='connected')
    except Exception as e:
        app.logger.error(f"Health check DB error: {str(e)}")
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
        access_token = create_access_token(identity=json.dumps(identity_data))
        return jsonify(access_token=access_token), 200
    else:
        return jsonify(message="Invalid username/email or password"), 401

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    raw_identity = get_jwt_identity()
    current_user_identity = json.loads(raw_identity)
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
    current_user_identity_dict = json.loads(raw_identity)
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
    current_user_identity_dict = json.loads(raw_identity)
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
    current_user_identity_dict = json.loads(raw_identity)
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
    try:
        assets = Asset.query.all()
        return jsonify(assets=[asset.to_dict() for asset in assets]), 200
    except Exception as e:
        app.logger.error(f"Error fetching assets: {str(e)}")
        return jsonify(message="Error fetching assets from database"), 500

# --- Helper function to get current price ---
def get_current_price_for_asset(asset_db_object):
    if os.environ.get('MOCK_ASSET_PRICES') == 'true':
        app.logger.info(f"MOCK PRICE: Returning mock price for {asset_db_object.symbol}")
        if asset_db_object.asset_type.lower() == 'stock':
            return Decimal('150.75')
        elif asset_db_object.asset_type.lower() == 'crypto':
            return Decimal('2500.50')
        else:
            return Decimal('100.00')

    api_key = app.config.get('ALPHA_VANTAGE_API_KEY')
    if not api_key or api_key == 'YOUR_ALPHA_VANTAGE_API_KEY_PLEASE_SET' or api_key == 'YOUR_ALPHA_VANTAGE_API_KEY': # check against both common placeholder values
        app.logger.error("Alpha Vantage API Key not configured or is placeholder.")
        return None

    price_str = None
    data_from_av = None
    try:
        if asset_db_object.asset_type.lower() == 'stock':
            ts = TimeSeries(key=api_key, output_format='json')
            data_from_av, _ = ts.get_quote_endpoint(symbol=asset_db_object.symbol)
            price_str = data_from_av.get('05. price') if data_from_av else None
        elif asset_db_object.asset_type.lower() == 'crypto':
            if len(asset_db_object.symbol) > 3 and asset_db_object.symbol.endswith('USD'):
                from_currency = asset_db_object.symbol[:-3]
                to_currency = 'USD'
                fe = ForeignExchange(key=api_key, output_format='json')
                data_from_av, _ = fe.get_currency_exchange_rate(from_currency_code=from_currency, to_currency_code=to_currency)
                price_str = data_from_av.get('Realtime Currency Exchange Rate', {}).get('5. Exchange Rate') if data_from_av else None
            else:
                app.logger.warning(f"Unsupported crypto symbol format for price fetching: {asset_db_object.symbol}")
                return None

        if price_str:
            return Decimal(price_str)
        
        app.logger.warning(f"Price not found for {asset_db_object.symbol} via Alpha Vantage. AV Data: {data_from_av}")
        return None
    
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Network error fetching price for {asset_db_object.symbol}: {str(e)}")
        return None
    except ValueError as e: 
        app.logger.error(f"Alpha Vantage API or data error for {asset_db_object.symbol}: {str(e)}. AV Data: {data_from_av}")
        return None
    except Exception as e: 
        app.logger.error(f"Unexpected error fetching price for {asset_db_object.symbol}: {str(e)}")
        return None

@app.route('/assets/<string:symbol>/price', methods=['GET'])
@jwt_required()
def get_asset_price(symbol):
    asset_from_db = Asset.query.filter_by(symbol=symbol.upper()).first()
    if not asset_from_db: return jsonify(message=f"Asset {symbol} not found."), 404
    current_price = get_current_price_for_asset(asset_from_db)
    if current_price is not None:
        return jsonify(symbol=asset_from_db.symbol, price=str(current_price), asset_type=asset_from_db.asset_type), 200
    else:
        return jsonify(message=f"Could not get price for {symbol}."), 503

@app.route('/assets/<string:symbol>/history', methods=['GET'])
@jwt_required()
def get_asset_history(symbol):
    """
    Returns historical price data for the given asset symbol and range.
    Query param: range = '1d', '1m', '6m', 'ytd', '1y', '3y'
    Output: [{"date": "2024-06-01", "price": 123.45}, ...]
    """
    asset_from_db = Asset.query.filter_by(symbol=symbol.upper()).first()
    if not asset_from_db:
        return jsonify(message=f"Asset {symbol} not found."), 404

    range_param = request.args.get('range', '1d')
    # Map range to Alpha Vantage function and outputsize
    av_function = None
    av_interval = None
    av_outputsize = 'compact'
    mock_points = 30
    if range_param == '1d':
        av_function = 'TIME_SERIES_INTRADAY'
        av_interval = '30min'
        mock_points = 24
    elif range_param == '1m':
        av_function = 'TIME_SERIES_DAILY'
        av_outputsize = 'compact'
        mock_points = 22
    elif range_param == '6m':
        av_function = 'TIME_SERIES_DAILY'
        av_outputsize = 'full'
        mock_points = 132
    elif range_param == 'ytd' or range_param == '1y':
        av_function = 'TIME_SERIES_DAILY'
        av_outputsize = 'full'
        mock_points = 252
    elif range_param == '3y':
        av_function = 'TIME_SERIES_WEEKLY'
        mock_points = 156
    else:
        return jsonify(message="Invalid range parameter."), 400

    # MOCK mode: return generated data
    if os.environ.get('MOCK_ASSET_PRICES') == 'true':
        import random
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        history = []
        base_price = float(get_current_price_for_asset(asset_from_db) or 100)
        for i in range(mock_points):
            if range_param == '1d':
                dt = now - timedelta(hours=mock_points - i)
                label = dt.strftime('%H:%M')
            elif range_param in ['1m', '6m', 'ytd', '1y']:
                dt = now - timedelta(days=mock_points - i)
                label = dt.strftime('%Y-%m-%d')
            else:
                dt = now - timedelta(weeks=mock_points - i)
                label = dt.strftime('%Y-%m-%d')
            price = round(base_price * (1 + random.uniform(-0.05, 0.05)), 2)
            history.append({"date": label, "price": price})
        return jsonify(history=history), 200

    # Alpha Vantage mode
    api_key = app.config.get('ALPHA_VANTAGE_API_KEY')
    if not api_key or api_key.startswith('YOUR_ALPHA_VANTAGE_API_KEY'):
        return jsonify(message="Alpha Vantage API Key not configured."), 503
    try:
        if asset_from_db.asset_type.lower() == 'stock':
            ts = TimeSeries(key=api_key, output_format='json')
            if av_function == 'TIME_SERIES_INTRADAY':
                data, _ = ts.get_intraday(symbol=asset_from_db.symbol, interval=av_interval, outputsize='compact')
                series = data.get(f'Time Series ({av_interval})', {})
            elif av_function == 'TIME_SERIES_DAILY':
                data, _ = ts.get_daily(symbol=asset_from_db.symbol, outputsize=av_outputsize)
                series = data.get('Time Series (Daily)', {})
            elif av_function == 'TIME_SERIES_WEEKLY':
                data, _ = ts.get_weekly(symbol=asset_from_db.symbol)
                series = data.get('Weekly Time Series', {})
            else:
                return jsonify(message="Unsupported function for stocks."), 400
            # Format: [{date, price}]
            history = []
            for date_str, values in list(series.items())[:mock_points][::-1]:
                price = float(values.get('4. close', 0))
                history.append({"date": date_str, "price": price})
            return jsonify(history=history), 200
        elif asset_from_db.asset_type.lower() == 'crypto':
            # Only support daily for crypto for simplicity
            fe = ForeignExchange(key=api_key, output_format='json')
            from_currency = asset_from_db.symbol[:-3] if asset_from_db.symbol.endswith('USD') else asset_from_db.symbol
            to_currency = 'USD'
            data, _ = fe.get_digital_currency_daily(symbol=from_currency, market=to_currency)
            series = data.get('Time Series (Digital Currency Daily)', {})
            history = []
            for date_str, values in list(series.items())[:mock_points][::-1]:
                price = float(values.get('4a. close (USD)', 0))
                history.append({"date": date_str, "price": price})
            return jsonify(history=history), 200
        else:
            return jsonify(message="Unsupported asset type for history."), 400
    except Exception as e:
        app.logger.error(f"Error fetching history for {symbol}: {str(e)}")
        return jsonify(message=f"Error fetching history for {symbol}: {str(e)}"), 500

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
    current_user_identity_dict = json.loads(raw_identity)
    user_id = current_user_identity_dict['id']
    
    asset = Asset.query.filter_by(symbol=asset_symbol.upper()).first()
    if not asset: return jsonify(message=f"Asset '{asset_symbol}' not found."), 404

    current_price = get_current_price_for_asset(asset)
    if current_price is None: return jsonify(message=f"Could not get price for {asset_symbol}"), 503

    # Fetch the user object to access cash_balance
    user = User.query.get(user_id)
    if not user:
        # This case should ideally not be reached if JWT identity is valid
        return jsonify(message="User not found for ID in token"), 404 

    holding = PortfolioHolding.query.filter_by(user_id=user_id, asset_id=asset.id).first()

    if order_type == 'market_sell':
        if not holding or holding.quantity < quantity:
            return jsonify(message="Insufficient holdings to sell"), 400
        
        total_proceeds = quantity * current_price
        user.cash_balance += total_proceeds  # Add cash to user
        
        holding.quantity -= quantity
        if holding.quantity == Decimal(0):
            db.session.delete(holding)

    elif order_type == 'market_buy':
        total_cost = quantity * current_price
        if user.cash_balance < total_cost:
            return jsonify(message="Insufficient funds to complete this purchase."), 400
        
        user.cash_balance -= total_cost # Deduct cash from user

        if holding:
            avg_price = Decimal(holding.average_purchase_price)
            current_qty = Decimal(holding.quantity)
            new_total_value_of_holding = (avg_price * current_qty) + total_cost # Cost of old + cost of new
            holding.quantity = current_qty + quantity
            holding.average_purchase_price = new_total_value_of_holding / holding.quantity
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
    # User object (for cash_balance) is already part of the session if fetched, 
    # SQLAlchemy tracks changes to it.

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error in trade order execution or commit: {str(e)}")
        return jsonify(message="Error processing order on the server."), 500
    
    holding_updated_dict = None
    if order_type == 'market_buy': 
        # if it was a buy, holding is guaranteed to exist (either pre-existing or newly created)
        # Re-fetch to ensure data is fresh from DB after commit, especially if new.
        holding_updated_dict = PortfolioHolding.query.get({'user_id': user_id, 'asset_id': asset.id}).to_dict()
    elif order_type == 'market_sell':
        updated_holding_after_sell = PortfolioHolding.query.get({'user_id': user_id, 'asset_id': asset.id})
        if updated_holding_after_sell: # If it still exists (quantity > 0)
            holding_updated_dict = updated_holding_after_sell.to_dict()
        # If it doesn't exist (quantity became 0 and was deleted), holding_updated_dict remains None

    return jsonify(
        message="Order placed", 
        trade=new_trade.to_dict(), 
        holding_updated=holding_updated_dict
    ), 201

@app.route('/portfolio', methods=['GET'])
@jwt_required()
def get_portfolio():
    raw_identity = get_jwt_identity()
    current_user_identity_dict = json.loads(raw_identity)
    user_id = current_user_identity_dict['id']

    # Fetch the user object to access cash_balance
    user = User.query.get(user_id)
    if not user:
        # This case should ideally not be reached if JWT identity is valid
        return jsonify(message="User not found for ID in token"), 404

    holdings = PortfolioHolding.query.filter_by(user_id=user_id).all()
    portfolio_data = []
    total_portfolio_value = Decimal(0)
    total_portfolio_cost = Decimal(0)

    for holding_item in holdings: 
        current_holding_qty = Decimal(holding_item.quantity)
        if current_holding_qty <= Decimal(0): continue # Skip if quantity is zero or less
        
        asset_item = Asset.query.get(holding_item.asset_id) 
        if not asset_item: 
            app.logger.warning(f"Asset with ID {holding_item.asset_id} not found for holding of user {user_id}.")
            continue 

        current_price = get_current_price_for_asset(asset_item)
        current_value_str, profit_loss_str, profit_loss_percent_str = "N/A", "N/A", "N/A"
        
        avg_purchase_price = Decimal(holding_item.average_purchase_price)
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
    if total_portfolio_cost != Decimal(0): 
        overall_profit_loss_percent_str = f"{(overall_profit_loss / total_portfolio_cost) * Decimal(100):.2f}%"
    elif total_portfolio_value > Decimal(0) and total_portfolio_cost == Decimal(0) : 
        overall_profit_loss_percent_str = "+Inf%" # E.g. free shares that gained value
    elif total_portfolio_value == Decimal(0) and total_portfolio_cost == Decimal(0) and not portfolio_data : # No holdings, no cost, no value
        overall_profit_loss_percent_str = "0.00%"
    # If portfolio_data exists but total_portfolio_cost is 0 (e.g. all free shares, no current price) then it remains N/A unless value exists.

    # Add user's cash balance to the summary
    summary_data = {
        'total_portfolio_value': f"{total_portfolio_value:.2f}", 
        'total_portfolio_cost': f"{total_portfolio_cost:.2f}", 
        'overall_profit_loss': f"{overall_profit_loss:.2f}", 
        'overall_profit_loss_percent': overall_profit_loss_percent_str,
        'user_cash_balance': f"{user.cash_balance:.2f}" # Added cash balance
    }

    return jsonify(holdings=portfolio_data, summary=summary_data), 200

@app.route('/education/progress', methods=['GET', 'POST'])
@jwt_required()
def education_progress():
    raw_identity = get_jwt_identity()
    user_id = json.loads(raw_identity)['id']
    user = User.query.get(user_id)
    if not user:
        return jsonify(message='User not found'), 404

    if request.method == 'GET':
        return jsonify(progress=user.education_progress or {}, quiz=user.education_quiz or {})

    if request.method == 'POST':
        data = request.get_json()
        user.education_progress = data.get('progress')
        user.education_quiz = data.get('quiz')
        db.session.commit()
        return jsonify(message='Progress updated'), 200

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
