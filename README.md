# 🧋 Chazen Tea Website & Inventory Management System 

A full-stack e-commerce and inventory management platform developed for a mock tea retailer, **Chazen Tea**. The system enables customers to browse products, manage accounts, place orders, and track purchases, while providing administrators with tools to manage inventory, process refunds, monitor orders, and export sales reports.

## Features

### Customer Features
- Product browsing and search
- Shopping cart management
- Customer account registration and login
- Checkout with autofill support
- Order history and reorder functionality
- Receipt generation and order tracking

### Administrative Features
- Hidden manager/admin portal with PIN authentication
- Product management (Create, Read, Update, Delete)
- Inventory tracking and stock management
- Order workflow management
- Refund processing with automatic inventory restoration
- CSV and PDF sales report exports

### Order Management Workflow
- Pending
- Preparing
- Picked Up
- Completed
- Refunded

Inventory levels are automatically updated during purchases and restored when refunds are processed.

---

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- HTML5
- CSS3

### Backend
- Python
- Flask
- REST API Architecture

### Database
- Supabase
- Cloud-hosted relational database

### Development Tools
- Git
- GitHub
- Visual Studio Code

---

## System Architecture

Frontend (React)
→ Flask REST API
→ Supabase Database
→ Persistent Product & Order Data

### Data Flow

1. Customer or administrator performs an action.
2. Frontend sends a request to the Flask API.
3. Backend validates data and applies business rules.
4. Supabase stores or retrieves data.
5. Updated information is returned to the frontend.

---

## Key Functionality

### Customer Account System
Customers can:
- Create an account
- Sign in
- Store checkout information
- Review previous orders
- Reorder past purchases

### Inventory Management
The system automatically:
- Deducts inventory when orders are placed
- Updates stock levels in real time
- Restores inventory when refunds occur

### Reporting
Managers can export:
- CSV reports
- PDF reports

for sales analysis and operational tracking.

---

## Project Structure

Frontend Components:
- App.jsx
- Storefront.jsx
- StoreModals.jsx
- AdminPanel.jsx

Backend:
- app.py

Database Tables:
- Products
- Orders

---

## Team Members

- Karrson Duong — Project Manager / Full-Stack Developer
- Margarita Cordova Rojas — Database Manager
- Caleb Choi — Quality Assurance Specialist
- Sagan Chowdhury — User Interface Specialist

---

## Testing

The application was tested across:
- Customer account workflows
- Shopping cart functionality
- Checkout processing
- Order lifecycle management
- Refund handling
- Inventory synchronization
- Administrative controls

Testing focused on ensuring accurate data persistence, reliable inventory updates, and consistent user experiences across customer and administrator interfaces.

---

## Lessons Learned

- Full-stack web application development
- REST API integration
- Database design and management
- Quality assurance testing
- Agile team collaboration
- Requirements analysis and system design

---

## Disclaimer

This project was developed as an academic software engineering project and is intended for educational purposes. Chazen Tea is a fictional company created to simulate a real-world e-commerce and inventory management environment.
