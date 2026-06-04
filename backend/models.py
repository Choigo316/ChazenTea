from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Product(db.Model):
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String)
    category = db.Column(db.String)
    type = db.Column(db.String)
    price = db.Column(db.Float)
    stock = db.Column(db.Integer)
    maxStock = db.Column(db.Integer)
    description = db.Column(db.String)
    tag = db.Column(db.String)
    weight = db.Column(db.String)
    image = db.Column(db.Text)

class Order(db.Model):
    id = db.Column(db.String, primary_key=True)
    items = db.Column(db.JSON)
    total = db.Column(db.Float)
    subtotal = db.Column(db.Float)
    shipping = db.Column(db.Float)
    tax = db.Column(db.Float)
    customer = db.Column(db.JSON)
    status = db.Column(db.String)
    channel = db.Column(db.String)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
