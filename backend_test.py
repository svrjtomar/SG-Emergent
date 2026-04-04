#!/usr/bin/env python3
"""
SevenGhost E-commerce Backend API Test Suite
Tests all backend endpoints for the SevenGhost fashion e-commerce application.
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Base URL from environment
BASE_URL = "https://sg-shop-demo.preview.emergentagent.com/api"

class SevenGhostAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_user_id = None
        self.test_product_id = None
        self.test_cart_item_id = None
        self.test_order_id = None
        self.admin_user_id = None
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }

    def log_result(self, test_name: str, success: bool, message: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        
        if success:
            self.results["passed"] += 1
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {message}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> tuple:
        """Make HTTP request and return response and success status"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == "GET":
                response = self.session.get(url)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url)
            else:
                return None, False, "Invalid HTTP method"
            
            return response, True, ""
        except Exception as e:
            return None, False, str(e)

    def test_health_check(self):
        """Test API health check endpoint"""
        print("\n=== Testing Health Check ===")
        
        response, success, error = self.make_request("GET", "/health")
        if not success:
            self.log_result("Health Check", False, f"Request failed: {error}")
            return
        
        if response.status_code == 200:
            data = response.json()
            if "status" in data and "timestamp" in data:
                self.log_result("Health Check", True, f"Status: {data['status']}")
            else:
                self.log_result("Health Check", False, "Missing required fields in response")
        else:
            self.log_result("Health Check", False, f"HTTP {response.status_code}: {response.text}")

    def test_database_seeding(self):
        """Test database seeding endpoint"""
        print("\n=== Testing Database Seeding ===")
        
        response, success, error = self.make_request("GET", "/seed")
        if not success:
            self.log_result("Database Seeding", False, f"Request failed: {error}")
            return
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "count" in data:
                self.log_result("Database Seeding", True, f"Message: {data['message']}, Count: {data['count']}")
            else:
                self.log_result("Database Seeding", False, "Missing required fields in response")
        else:
            self.log_result("Database Seeding", False, f"HTTP {response.status_code}: {response.text}")

    def test_products_api(self):
        """Test Products API endpoints"""
        print("\n=== Testing Products API ===")
        
        # Test GET /api/products - List all products
        response, success, error = self.make_request("GET", "/products")
        if not success:
            self.log_result("Products List", False, f"Request failed: {error}")
            return
        
        if response.status_code == 200:
            data = response.json()
            if "products" in data and isinstance(data["products"], list):
                products = data["products"]
                self.log_result("Products List", True, f"Found {len(products)} products")
                
                # Store first product ID for later tests
                if products:
                    self.test_product_id = products[0]["id"]
                    print(f"   Using product ID: {self.test_product_id}")
            else:
                self.log_result("Products List", False, "Invalid response format")
        else:
            self.log_result("Products List", False, f"HTTP {response.status_code}: {response.text}")
        
        # Test category filter
        response, success, error = self.make_request("GET", "/products?category=men")
        if success and response.status_code == 200:
            data = response.json()
            men_products = data.get("products", [])
            self.log_result("Products Filter by Category", True, f"Found {len(men_products)} men's products")
        else:
            self.log_result("Products Filter by Category", False, "Category filter failed")
        
        # Test type filter
        response, success, error = self.make_request("GET", "/products?type=plain")
        if success and response.status_code == 200:
            data = response.json()
            plain_products = data.get("products", [])
            self.log_result("Products Filter by Type", True, f"Found {len(plain_products)} plain products")
        else:
            self.log_result("Products Filter by Type", False, "Type filter failed")
        
        # Test featured filter
        response, success, error = self.make_request("GET", "/products?featured=true")
        if success and response.status_code == 200:
            data = response.json()
            featured_products = data.get("products", [])
            self.log_result("Products Filter by Featured", True, f"Found {len(featured_products)} featured products")
        else:
            self.log_result("Products Filter by Featured", False, "Featured filter failed")
        
        # Test single product by ID
        if self.test_product_id:
            response, success, error = self.make_request("GET", f"/products/{self.test_product_id}")
            if success and response.status_code == 200:
                data = response.json()
                if "product" in data:
                    product = data["product"]
                    self.log_result("Single Product by ID", True, f"Product: {product.get('name', 'Unknown')}")
                else:
                    self.log_result("Single Product by ID", False, "Product not found in response")
            else:
                self.log_result("Single Product by ID", False, "Failed to get single product")

    def test_authentication_api(self):
        """Test Authentication API endpoints"""
        print("\n=== Testing Authentication API ===")
        
        # Test regular user login/signup
        login_data = {
            "email": "test@example.com",
            "password": "test123"
        }
        
        response, success, error = self.make_request("POST", "/auth/login", login_data)
        if not success:
            self.log_result("User Authentication", False, f"Request failed: {error}")
            return
        
        if response.status_code == 200:
            data = response.json()
            if "user" in data and "token" in data:
                user = data["user"]
                self.test_user_id = user["id"]
                self.log_result("User Authentication", True, f"User: {user.get('email')}, Role: {user.get('role')}")
                print(f"   User ID: {self.test_user_id}")
            else:
                self.log_result("User Authentication", False, "Missing user or token in response")
        else:
            self.log_result("User Authentication", False, f"HTTP {response.status_code}: {response.text}")
        
        # Test admin login
        admin_login_data = {
            "email": "admin@sevenghost.com",
            "password": "admin"
        }
        
        response, success, error = self.make_request("POST", "/auth/login", admin_login_data)
        if success and response.status_code == 200:
            data = response.json()
            if "user" in data:
                admin_user = data["user"]
                self.admin_user_id = admin_user["id"]
                if admin_user.get("role") == "admin":
                    self.log_result("Admin Authentication", True, f"Admin user: {admin_user.get('email')}")
                    print(f"   Admin ID: {self.admin_user_id}")
                else:
                    self.log_result("Admin Authentication", False, "User role is not admin")
            else:
                self.log_result("Admin Authentication", False, "Missing user in response")
        else:
            self.log_result("Admin Authentication", False, "Admin login failed")

    def test_cart_api(self):
        """Test Cart API endpoints"""
        print("\n=== Testing Cart API ===")
        
        if not self.test_user_id or not self.test_product_id:
            self.log_result("Cart API", False, "Missing user ID or product ID for cart tests")
            return
        
        # Test add item to cart
        cart_add_data = {
            "userId": self.test_user_id,
            "productId": self.test_product_id,
            "size": "M",
            "quantity": 1
        }
        
        response, success, error = self.make_request("POST", "/cart/add", cart_add_data)
        if not success:
            self.log_result("Cart Add Item", False, f"Request failed: {error}")
            return
        
        if response.status_code == 200:
            data = response.json()
            if "cart" in data:
                cart = data["cart"]
                if cart["items"]:
                    self.test_cart_item_id = cart["items"][0]["id"]
                    self.log_result("Cart Add Item", True, f"Added item to cart, Total: ₹{cart.get('total', 0)}")
                    print(f"   Cart Item ID: {self.test_cart_item_id}")
                else:
                    self.log_result("Cart Add Item", False, "No items in cart after adding")
            else:
                self.log_result("Cart Add Item", False, "Missing cart in response")
        else:
            self.log_result("Cart Add Item", False, f"HTTP {response.status_code}: {response.text}")
        
        # Test get user's cart
        response, success, error = self.make_request("GET", f"/cart/{self.test_user_id}")
        if success and response.status_code == 200:
            data = response.json()
            if "cart" in data:
                cart = data["cart"]
                self.log_result("Cart Get", True, f"Cart has {len(cart.get('items', []))} items")
            else:
                self.log_result("Cart Get", False, "Missing cart in response")
        else:
            self.log_result("Cart Get", False, "Failed to get cart")
        
        # Test update cart item quantity
        if self.test_cart_item_id:
            cart_update_data = {
                "userId": self.test_user_id,
                "itemId": self.test_cart_item_id,
                "quantity": 2
            }
            
            response, success, error = self.make_request("PUT", "/cart/update", cart_update_data)
            if success and response.status_code == 200:
                data = response.json()
                if "cart" in data:
                    cart = data["cart"]
                    self.log_result("Cart Update Item", True, f"Updated quantity, Total: ₹{cart.get('total', 0)}")
                else:
                    self.log_result("Cart Update Item", False, "Missing cart in response")
            else:
                self.log_result("Cart Update Item", False, "Failed to update cart item")

    def test_wishlist_api(self):
        """Test Wishlist API endpoints"""
        print("\n=== Testing Wishlist API ===")
        
        if not self.test_user_id or not self.test_product_id:
            self.log_result("Wishlist API", False, "Missing user ID or product ID for wishlist tests")
            return
        
        # Test toggle wishlist item (add)
        wishlist_data = {
            "userId": self.test_user_id,
            "productId": self.test_product_id
        }
        
        response, success, error = self.make_request("POST", "/wishlist/toggle", wishlist_data)
        if not success:
            self.log_result("Wishlist Toggle Add", False, f"Request failed: {error}")
            return
        
        if response.status_code == 200:
            data = response.json()
            if "wishlist" in data:
                wishlist = data["wishlist"]
                self.log_result("Wishlist Toggle Add", True, f"Wishlist has {len(wishlist.get('items', []))} items")
            else:
                self.log_result("Wishlist Toggle Add", False, "Missing wishlist in response")
        else:
            self.log_result("Wishlist Toggle Add", False, f"HTTP {response.status_code}: {response.text}")
        
        # Test get user's wishlist
        response, success, error = self.make_request("GET", f"/wishlist/{self.test_user_id}")
        if success and response.status_code == 200:
            data = response.json()
            if "wishlist" in data:
                wishlist = data["wishlist"]
                self.log_result("Wishlist Get", True, f"Wishlist has {len(wishlist.get('items', []))} items")
            else:
                self.log_result("Wishlist Get", False, "Missing wishlist in response")
        else:
            self.log_result("Wishlist Get", False, "Failed to get wishlist")

    def test_orders_api(self):
        """Test Orders API endpoints"""
        print("\n=== Testing Orders API ===")
        
        if not self.test_user_id:
            self.log_result("Orders API", False, "Missing user ID for orders tests")
            return
        
        # Test create order
        order_data = {
            "userId": self.test_user_id,
            "items": [
                {
                    "productId": self.test_product_id,
                    "name": "Test Product",
                    "price": 1499,
                    "quantity": 1,
                    "size": "M"
                }
            ],
            "address": {
                "name": "John Doe",
                "phone": "9876543210",
                "street": "123 Test Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001"
            },
            "paymentMethod": "cod",
            "total": 1499
        }
        
        response, success, error = self.make_request("POST", "/orders/create", order_data)
        if not success:
            self.log_result("Orders Create", False, f"Request failed: {error}")
            return
        
        if response.status_code == 200:
            data = response.json()
            if "order" in data:
                order = data["order"]
                self.test_order_id = order["id"]
                self.log_result("Orders Create", True, f"Order created: {order.get('id')}, Total: ₹{order.get('total', 0)}")
                print(f"   Order ID: {self.test_order_id}")
            else:
                self.log_result("Orders Create", False, "Missing order in response")
        else:
            self.log_result("Orders Create", False, f"HTTP {response.status_code}: {response.text}")
        
        # Test get user's orders
        response, success, error = self.make_request("GET", f"/orders/{self.test_user_id}")
        if success and response.status_code == 200:
            data = response.json()
            if "orders" in data:
                orders = data["orders"]
                self.log_result("Orders Get", True, f"User has {len(orders)} orders")
            else:
                self.log_result("Orders Get", False, "Missing orders in response")
        else:
            self.log_result("Orders Get", False, "Failed to get orders")

    def test_admin_api(self):
        """Test Admin API endpoints"""
        print("\n=== Testing Admin API ===")
        
        # Test admin stats
        response, success, error = self.make_request("GET", "/admin/stats")
        if not success:
            self.log_result("Admin Stats", False, f"Request failed: {error}")
            return
        
        if response.status_code == 200:
            data = response.json()
            if "stats" in data:
                stats = data["stats"]
                self.log_result("Admin Stats", True, 
                    f"Orders: {stats.get('totalOrders', 0)}, Products: {stats.get('totalProducts', 0)}, Revenue: ₹{stats.get('totalRevenue', 0)}")
            else:
                self.log_result("Admin Stats", False, "Missing stats in response")
        else:
            self.log_result("Admin Stats", False, f"HTTP {response.status_code}: {response.text}")
        
        # Test admin orders list
        response, success, error = self.make_request("GET", "/admin/orders")
        if success and response.status_code == 200:
            data = response.json()
            if "orders" in data:
                orders = data["orders"]
                self.log_result("Admin Orders List", True, f"Found {len(orders)} orders")
            else:
                self.log_result("Admin Orders List", False, "Missing orders in response")
        else:
            self.log_result("Admin Orders List", False, "Failed to get admin orders")
        
        # Test add product (admin)
        new_product_data = {
            "name": "Test Product",
            "category": "men",
            "type": "plain",
            "price": 1999,
            "originalPrice": 2499,
            "images": ["https://example.com/test.jpg"],
            "sizes": ["S", "M", "L"],
            "stock": 10,
            "description": "Test product for API testing"
        }
        
        response, success, error = self.make_request("POST", "/admin/products", new_product_data)
        if success and response.status_code == 200:
            data = response.json()
            if "product" in data:
                product = data["product"]
                test_admin_product_id = product["id"]
                self.log_result("Admin Add Product", True, f"Added product: {product.get('name')}")
                print(f"   New Product ID: {test_admin_product_id}")
                
                # Test delete product (admin)
                response, success, error = self.make_request("DELETE", f"/admin/products/{test_admin_product_id}")
                if success and response.status_code == 200:
                    self.log_result("Admin Delete Product", True, "Product deleted successfully")
                else:
                    self.log_result("Admin Delete Product", False, "Failed to delete product")
            else:
                self.log_result("Admin Add Product", False, "Missing product in response")
        else:
            self.log_result("Admin Add Product", False, "Failed to add product")
        
        # Test update order status (admin)
        if self.test_order_id:
            order_update_data = {
                "status": "shipped",
                "paymentStatus": "completed"
            }
            
            response, success, error = self.make_request("PUT", f"/admin/orders/{self.test_order_id}", order_update_data)
            if success and response.status_code == 200:
                data = response.json()
                if "order" in data:
                    order = data["order"]
                    self.log_result("Admin Update Order", True, f"Order status: {order.get('status')}")
                else:
                    self.log_result("Admin Update Order", False, "Missing order in response")
            else:
                self.log_result("Admin Update Order", False, "Failed to update order")

    def test_payment_api(self):
        """Test Mock Payment API endpoints"""
        print("\n=== Testing Mock Payment API ===")
        
        # Test create payment order
        payment_data = {
            "amount": 1499,
            "currency": "INR"
        }
        
        response, success, error = self.make_request("POST", "/payment/create", payment_data)
        if not success:
            self.log_result("Payment Create", False, f"Request failed: {error}")
            return
        
        if response.status_code == 200:
            data = response.json()
            if "order" in data:
                order = data["order"]
                razorpay_order_id = order["id"]
                self.log_result("Payment Create", True, f"Payment order created: {razorpay_order_id}")
                
                # Test payment verification
                verify_data = {
                    "razorpay_order_id": razorpay_order_id,
                    "razorpay_payment_id": "pay_test123",
                    "razorpay_signature": "test_signature"
                }
                
                response, success, error = self.make_request("POST", "/payment/verify", verify_data)
                if success and response.status_code == 200:
                    data = response.json()
                    if data.get("verified"):
                        self.log_result("Payment Verify", True, f"Payment verified: {data.get('message')}")
                    else:
                        self.log_result("Payment Verify", False, "Payment verification failed")
                else:
                    self.log_result("Payment Verify", False, "Failed to verify payment")
            else:
                self.log_result("Payment Create", False, "Missing order in response")
        else:
            self.log_result("Payment Create", False, f"HTTP {response.status_code}: {response.text}")

    def test_cart_remove_item(self):
        """Test removing item from cart"""
        print("\n=== Testing Cart Remove Item ===")
        
        if not self.test_user_id or not self.test_cart_item_id:
            self.log_result("Cart Remove Item", False, "Missing user ID or cart item ID")
            return
        
        cart_remove_data = {
            "userId": self.test_user_id,
            "itemId": self.test_cart_item_id
        }
        
        response, success, error = self.make_request("POST", "/cart/remove", cart_remove_data)
        if success and response.status_code == 200:
            data = response.json()
            if "cart" in data:
                cart = data["cart"]
                self.log_result("Cart Remove Item", True, f"Item removed, Cart has {len(cart.get('items', []))} items")
            else:
                self.log_result("Cart Remove Item", False, "Missing cart in response")
        else:
            self.log_result("Cart Remove Item", False, "Failed to remove cart item")

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting SevenGhost Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        try:
            # Test in logical order
            self.test_health_check()
            self.test_database_seeding()
            self.test_products_api()
            self.test_authentication_api()
            self.test_cart_api()
            self.test_wishlist_api()
            self.test_orders_api()
            self.test_admin_api()
            self.test_payment_api()
            self.test_cart_remove_item()
            
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR: {str(e)}")
            self.results["failed"] += 1
            self.results["errors"].append(f"Critical error: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📊 Total: {self.results['passed'] + self.results['failed']}")
        
        if self.results["errors"]:
            print("\n🔍 FAILED TESTS:")
            for error in self.results["errors"]:
                print(f"   • {error}")
        
        success_rate = (self.results['passed'] / (self.results['passed'] + self.results['failed'])) * 100 if (self.results['passed'] + self.results['failed']) > 0 else 0
        print(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        return self.results['failed'] == 0

if __name__ == "__main__":
    tester = SevenGhostAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)