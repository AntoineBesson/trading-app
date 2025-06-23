from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from decimal import Decimal # Added import

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    cash_balance = db.Column(db.Numeric(precision=18, scale=2), nullable=False, default=Decimal('10000.00'))
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now())
    # Add education progress and quiz state as JSON columns
    education_progress = db.Column(db.JSON, nullable=True)
    education_quiz = db.Column(db.JSON, nullable=True)
    is_admin = db.Column(db.Boolean, default=False, nullable=False) # Admin rights

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class EducationalContent(db.Model):
    __tablename__ = 'educational_content'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    # 'article', 'video', 'tutorial'
    content_type = db.Column(db.String(50), nullable=False)
    body = db.Column(db.Text, nullable=True) # Nullable if it's a video link for example
    video_url = db.Column(db.String(255), nullable=True)
    # Optional: link to a user who authored it. If user is deleted, set author_id to NULL.
    author_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now(), onupdate=db.func.now())
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id', ondelete='SET NULL'), nullable=True)
    order = db.Column(db.Integer, nullable=True)

    author = db.relationship('User', backref=db.backref('educational_contents', lazy=True))
    module = db.relationship('Module', back_populates='lessons')

    def __repr__(self):
        return f'<EducationalContent {self.id}: {self.title[:30]}...>'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content_type': self.content_type,
            'body': self.body,
            'video_url': self.video_url,
            'author_id': self.author_id,
            'author_username': self.author.username if self.author else None, # Include author's username
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'module_id': self.module_id,
            'order': self.order
        }

class Asset(db.Model):
    __tablename__ = 'assets'

    id = db.Column(db.Integer, primary_key=True)
    # e.g., AAPL, BTCUSD
    symbol = db.Column(db.String(10), unique=True, nullable=False)
    # e.g., Apple Inc., Bitcoin
    name = db.Column(db.String(100), nullable=False)
    # 'stock', 'crypto'
    asset_type = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return f'<Asset {self.symbol} ({self.name})>'

    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'name': self.name,
            'asset_type': self.asset_type
        }

class Trade(db.Model):
    __tablename__ = 'trades'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id', ondelete='RESTRICT'), nullable=False)
    # 'market_buy', 'market_sell', potentially 'limit_buy', 'limit_sell' in future
    order_type = db.Column(db.String(20), nullable=False)
    # Using Numeric for precision, especially with crypto
    quantity = db.Column(db.Numeric(18, 8), nullable=False)
    price_at_execution = db.Column(db.Numeric(18, 8), nullable=False)
    timestamp = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now())

    user = db.relationship('User', backref=db.backref('trades', lazy='dynamic'))
    asset = db.relationship('Asset', backref=db.backref('trades', lazy='dynamic'))

    def __repr__(self):
        return f'<Trade {self.id}: {self.order_type} {self.quantity} of asset_id {self.asset_id} by user_id {self.user_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'asset_id': self.asset_id,
            'asset_symbol': self.asset.symbol if self.asset else None,
            'order_type': self.order_type,
            'quantity': str(self.quantity), # Convert Decimal to string for JSON
            'price_at_execution': str(self.price_at_execution), # Convert Decimal to string
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class PortfolioHolding(db.Model):
    __tablename__ = 'portfolio_holdings'

    # Composite primary key defined by (user_id, asset_id)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id', ondelete='RESTRICT'), primary_key=True)

    quantity = db.Column(db.Numeric(18, 8), nullable=False)
    average_purchase_price = db.Column(db.Numeric(18, 8), nullable=False)

    user = db.relationship('User', backref=db.backref('portfolio_holdings', lazy='dynamic'))
    asset = db.relationship('Asset', backref=db.backref('portfolio_holdings', lazy='dynamic'))

    def __repr__(self):
        return f'<PortfolioHolding: User {self.user_id} owns {self.quantity} of Asset {self.asset_id}>'

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'asset_id': self.asset_id,
            'asset_symbol': self.asset.symbol if self.asset else None,
            'asset_name': self.asset.name if self.asset else None,
            'quantity': str(self.quantity), # Convert Decimal to string
            'average_purchase_price': str(self.average_purchase_price) # Convert Decimal
        }

class News(db.Model):
    __tablename__ = 'news'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    preview = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'preview': self.preview,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('educational_content.id', ondelete='CASCADE'), nullable=True)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now(), onupdate=db.func.now())

    lesson = db.relationship('EducationalContent', backref=db.backref('quizzes', lazy=True))
    questions = db.relationship('QuizQuestion', backref='quiz', cascade='all, delete-orphan', lazy=True)

    def to_dict(self, include_questions=False):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'lesson_id': self.lesson_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_questions:
            data['questions'] = [q.to_dict() for q in self.questions]
        return data

class QuizQuestion(db.Model):
    __tablename__ = 'quiz_questions'
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id', ondelete='CASCADE'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    choices = db.Column(db.JSON, nullable=False)  # List of choices
    correct_answer = db.Column(db.String(255), nullable=False)  # Could be index or value
    explanation = db.Column(db.Text, nullable=True)
    order = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'question_text': self.question_text,
            'choices': self.choices,
            'correct_answer': self.correct_answer,
            'explanation': self.explanation,
            'order': self.order,
        }

class Module(db.Model):
    __tablename__ = 'modules'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    order = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now(), onupdate=db.func.now())

    lessons = db.relationship('EducationalContent', back_populates='module', lazy=True)

    def to_dict(self, include_lessons=False):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'order': self.order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_lessons:
            data['lessons'] = [l.to_dict() for l in self.lessons]
        return data
