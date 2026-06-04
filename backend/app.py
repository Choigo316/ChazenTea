from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from supabase import create_client
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from flask import abort
load_dotenv()
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024
CORS(app)

API_KEY = os.getenv("API_KEY")

REFUNDABLE_STATUSES = {"Pending", "Preparing", "Picked Up", "Fulfilled", "Completed"}

def require_api_key():
    if request.headers.get("x-api-key") != API_KEY:
        abort(403, description="Unauthorized")

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        res = supabase.table("products").select("*").execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# GET single product
@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    try:
        res = supabase.table("products").select("*").eq("id", product_id).execute()
        if res.data:
            return jsonify(res.data[0])
        return jsonify({"error": "Not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ADD product
@app.route('/api/products', methods=['POST'])
def add_product():
    require_api_key()
    try:
        data = request.json
        print("INCOMING PRODUCT:", data)

        clean = {
            "id": data.get("id"),
            "name": data.get("name"),
            "price": float(data.get("price", 0)),
            "stock": int(data.get("stock", 0)),
            "maxStock": int(data.get("maxStock", 0)),
            "description": data.get("description"),
            "category": data.get("category"),
            "type": data.get("type"),
            "weight": data.get("weight"),
            "tag": data.get("tag"),
            "image": None
        }

        res = supabase.table("products").insert(clean).execute()
        return jsonify(res.data)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# DELETE product
@app.route('/api/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    require_api_key()
    try:
        supabase.table("products").delete().eq("id", product_id).execute()
        return jsonify({"message": "Deleted"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ======================
# ORDERS ROUTES
# ======================

# GET all orders
@app.route('/api/orders', methods=['GET'])
def get_orders():
    try:
        res = supabase.table("orders").select("*").order("created_at", desc=True).execute()
        return jsonify(res.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ADD order
@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        data = request.json
        print("INCOMING ORDER:", data)

        if not data:
            return jsonify({"error": "No data provided"}), 400

        data.pop("id", None)

        # fix timestamp
        if "createdAt" in data:
            data["created_at"] = data.pop("createdAt")

        items = data.get("items") or []
        clean_items = []

        # ======================
        # CLEAN ITEMS
        # ======================
        for item in items:
            if not isinstance(item, dict):
                continue

            qty = item.get("quantity") or item.get("qty") or 1

            clean_items.append({
                "id": item.get("id"),
                "name": item.get("name"),
                "price": float(item.get("price", 0)),
                "quantity": int(qty),
                "category": item.get("category"),
                "type": item.get("type")
            })

        data["items"] = clean_items
        data["customer"] = data.get("customer") or {}

        print("CLEANED ORDER:", data)

        # ======================
        # SAVE ORDER FIRST
        # ======================
        res = supabase.table("orders").insert(data).execute()

        print("SUPABASE RESPONSE:", res)

        saved_order = res.data[0] if res.data else None
        if not saved_order:
            return jsonify({"error": "Order insert returned no data"}), 500

        # ======================
        # UPDATE STOCK AFTER SAVE
        # ======================
        for item in clean_items:
            product_id = item.get("id")
            qty = int(item.get("quantity", 1))

            if not product_id:
                continue

            # get current stock
            product_res = supabase.table("products") \
                .select("stock") \
                .eq("id", product_id) \
                .execute()

            if not product_res.data:
                print(f"Product not found: {product_id}")
                continue

            current_stock = int(product_res.data[0]["stock"])
            new_stock = max(current_stock - qty, 0)

            print(f"Updating {product_id}: {current_stock} -> {new_stock}")

            # update stock
            supabase.table("products") \
                .update({"stock": new_stock}) \
                .eq("id", product_id) \
                .execute()

        return jsonify(saved_order), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/orders/<order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    try:
        data = request.json or {}
        new_status = (data.get("status") or "").strip()
        if not new_status:
            return jsonify({"error": "Status is required"}), 400

        order_res = supabase.table("orders").select("*").eq("id", order_id).execute()
        existing_order = order_res.data[0] if order_res.data else None
        if not existing_order:
            return jsonify({"error": "Order not found"}), 404

        previous_status = existing_order.get("status")
        update_payload = {"status": new_status}

        res = supabase.table("orders").update(update_payload).eq("id", order_id).execute()
        updated_order = res.data[0] if res.data else {**existing_order, **update_payload}

        if new_status == "Refunded" and previous_status in REFUNDABLE_STATUSES:
            for item in existing_order.get("items") or []:
                if not isinstance(item, dict):
                    continue
                if item.get("type") == "Drink/Snack":
                    continue

                product_id = item.get("id")
                qty = int(item.get("quantity") or item.get("qty") or 1)
                if not product_id:
                    continue

                product_res = supabase.table("products").select("stock").eq("id", product_id).execute()
                if not product_res.data:
                    continue

                current_stock = int(product_res.data[0].get("stock", 0))
                supabase.table("products").update({"stock": current_stock + qty}).eq("id", product_id).execute()

        return jsonify(updated_order), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.json

        clean = {
            "name": data.get("name"),
            "price": float(data.get("price", 0)),
            "stock": int(data.get("stock", 0)),
            "maxStock": int(data.get("maxStock", 0)),
            "description": data.get("description"),
            "category": data.get("category"),
            "type": data.get("type"),
            "weight": data.get("weight"),
            "tag": data.get("tag"),
            "active": data.get("active", True)
        }

        # only include image if exists
        if data.get("image"):
            clean["image"] = data["image"]

        print("UPDATE CLEAN:", clean)

        res = supabase.table("products") \
            .update(clean) \
            .eq("id", product_id) \
            .execute()

        print("SUPABASE RESPONSE:", res)

        return jsonify(res.data)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/store-settings/homepage-posters', methods=['GET'])
def get_homepage_posters():
    try:
        res = supabase.table("store_settings").select("value").eq("key", "homepage_posters").execute()
        if res.data:
            return jsonify(res.data[0]["value"])
        return jsonify({"enabled": True, "intervalMs": 5000, "items": []})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/store-settings/homepage-posters', methods=['PUT'])
def update_homepage_posters():
    try:
        data = request.json or {}
        supabase.table("store_settings").upsert({
            "key": "homepage_posters",
            "value": data
        }).execute()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ======================
# IMAGE UPLOAD ROUTE
# ======================
@app.route('/upload', methods=['POST'])
def upload_image():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        return jsonify({
            "message": "Image saved successfully",
            "path": filepath
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
