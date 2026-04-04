#!/usr/bin/env python3
"""
SevenGhost Admin Panel Backend API Test Suite
Tests specific admin panel endpoints for the SevenGhost fashion e-commerce application.
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Base URL from environment
BASE_URL = "https://sg-shop-demo.preview.emergentagent.com/api"

class SevenGhostAdminAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_product_id = None
        self.test_order_id = None
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

    def test_admin_stats(self):
        """Test GET /api/admin/stats endpoint"""
        print("\n=== Testing Admin Stats API ===")
        
        response, success, error = self.make_request("GET", "/admin/stats")
        if not success:
            self.log_result("Admin Stats", False, f"Request failed: {error}")
            return
        
        if response.status_code == 200:
            data = response.json()
            if "stats" in data:
                stats = data["stats"]
                required_fields = ["totalOrders", "totalProducts", "totalUsers", "totalRevenue", "chartData"]
                missing_fields = [field for field in required_fields if field not in stats]
                
                if not missing_fields:
                    self.log_result("Admin Stats", True, 
                        f"Orders: {stats.get('totalOrders', 0)}, Products: {stats.get('totalProducts', 0)}, "
                        f"Users: {stats.get('totalUsers', 0)}, Revenue: ₹{stats.get('totalRevenue', 0)}, "
                        f"Chart Data Points: {len(stats.get('chartData', []))}")
                else:
                    self.log_result("Admin Stats", False, f"Missing required fields: {missing_fields}")
            else:
                self.log_result("Admin Stats", False, "Missing 'stats' in response")
        else:
            self.log_result("Admin Stats", False, f"HTTP {response.status_code}: {response.text}")

    def test_admin_users(self):
        """Test GET /api/admin/users endpoint"""
        print("\n=== Testing Admin Users API ===")
        
        response, success, error = self.make_request("GET", "/admin/users")
        if not success:
            self.log_result("Admin Users", False, f"Request failed: {error}")
            return
        
        if response.status_code == 200:
            data = response.json()
            if "users" in data:
                users = data["users"]
                if isinstance(users, list):
                    # Check if users have orderCount and totalSpent
                    if users:
                        first_user = users[0]
                        required_fields = ["orderCount", "totalSpent"]
                        missing_fields = [field for field in required_fields if field not in first_user]
                        
                        if not missing_fields:
                            self.log_result("Admin Users", True, 
                                f"Found {len(users)} users with order statistics")
                        else:
                            self.log_result("Admin Users", False, 
                                f"Users missing required fields: {missing_fields}")
                    else:
                        self.log_result("Admin Users", True, "No users found (empty list)")
                else:
                    self.log_result("Admin Users", False, "Users field is not a list")
            else:
                self.log_result("Admin Users", False, "Missing 'users' in response")
        else:
            self.log_result("Admin Users", False, f"HTTP {response.status_code}: {response.text}")

    def test_admin_settings_get(self):
        """Test GET /api/admin/settings endpoint"""
        print("\n=== Testing Admin Settings GET API ===")
        
        response, success, error = self.make_request("GET", "/admin/settings")
        if not success:
            self.log_result("Admin Settings GET", False, f"Request failed: {error}")
            return
        
        if response.status_code == 200:
            data = response.json()
            if "settings" in data:
                settings = data["settings"]
                required_configs = ["supabase", "razorpay", "payment", "store"]
                missing_configs = [config for config in required_configs if config not in settings]
                
                if not missing_configs:
                    self.log_result("Admin Settings GET", True, 
                        f"Settings loaded with configs: {', '.join(required_configs)}")
                    
                    # Verify sensitive data is masked
                    supabase = settings.get("supabase", {})
                    razorpay = settings.get("razorpay", {})
                    
                    anonKey = supabase.get("anonKey", "")
                    keySecret = razorpay.get("keySecret", "")
                    
                    if anonKey and "••••••••" in anonKey:
                        self.log_result("Admin Settings Masking", True, "Sensitive data properly masked")
                    elif not anonKey:
                        self.log_result("Admin Settings Masking", True, "No sensitive data to mask")
                    else:
                        self.log_result("Admin Settings Masking", False, "Sensitive data not properly masked")
                else:
                    self.log_result("Admin Settings GET", False, f"Missing required configs: {missing_configs}")
            else:
                self.log_result("Admin Settings GET", False, "Missing 'settings' in response")
        else:
            self.log_result("Admin Settings GET", False, f"HTTP {response.status_code}: {response.text}")

    def test_admin_settings_update(self):
        """Test POST /api/admin/settings endpoint"""
        print("\n=== Testing Admin Settings UPDATE API ===")
        
        # Test 1: Update Supabase settings
        supabase_data = {
            "supabase": {
                "url": "https://test.supabase.co",
                "anonKey": "test-key-12345678"
            }
        }
        
        response, success, error = self.make_request("POST", "/admin/settings", supabase_data)
        if success and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_result("Admin Settings Update Supabase", True, "Supabase settings updated")
            else:
                self.log_result("Admin Settings Update Supabase", False, "Update failed")
        else:
            self.log_result("Admin Settings Update Supabase", False, 
                f"HTTP {response.status_code if response else 'N/A'}: {response.text if response else error}")
        
        # Test 2: Update Razorpay settings
        razorpay_data = {
            "razorpay": {
                "keyId": "rzp_test_123456789",
                "keySecret": "secret123456789"
            }
        }
        
        response, success, error = self.make_request("POST", "/admin/settings", razorpay_data)
        if success and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_result("Admin Settings Update Razorpay", True, "Razorpay settings updated")
            else:
                self.log_result("Admin Settings Update Razorpay", False, "Update failed")
        else:
            self.log_result("Admin Settings Update Razorpay", False, 
                f"HTTP {response.status_code if response else 'N/A'}: {response.text if response else error}")
        
        # Test 3: Update Payment settings
        payment_data = {
            "payment": {
                "mode": "mock",
                "codEnabled": True
            }
        }
        
        response, success, error = self.make_request("POST", "/admin/settings", payment_data)
        if success and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.log_result("Admin Settings Update Payment", True, "Payment settings updated")
            else:
                self.log_result("Admin Settings Update Payment", False, "Update failed")
        else:
            self.log_result("Admin Settings Update Payment", False, 
                f"HTTP {response.status_code if response else 'N/A'}: {response.text if response else error}")

    def test_admin_product_crud(self):
        """Test Admin Product CRUD operations"""
        print("\n=== Testing Admin Product CRUD API ===")
        
        # Test 1: Create Product (POST /api/admin/products)
        new_product_data = {
            "name": "Admin Test T-Shirt",
            "category": "men",
            "type": "plain",
            "price": 1299,
            "originalPrice": 1599,
            "images": ["https://example.com/test-tshirt.jpg"],
            "sizes": ["S", "M", "L", "XL"],
            "stock": 25,
            "description": "Test product created via admin API",
            "featured": False
        }
        
        response, success, error = self.make_request("POST", "/admin/products", new_product_data)
        if not success:
            self.log_result("Admin Product CREATE", False, f"Request failed: {error}")
            return
        
        if response.status_code == 200:
            data = response.json()
            if "product" in data:
                product = data["product"]
                self.test_product_id = product["id"]
                self.log_result("Admin Product CREATE", True, 
                    f"Product created: {product.get('name')} (ID: {self.test_product_id})")
            else:
                self.log_result("Admin Product CREATE", False, "Missing 'product' in response")
                return
        else:
            self.log_result("Admin Product CREATE", False, f"HTTP {response.status_code}: {response.text}")
            return
        
        # Test 2: Update Product (PUT /api/admin/products/:id)
        if self.test_product_id:
            update_data = {
                "name": "Updated Admin Test T-Shirt",
                "price": 1399,
                "stock": 30,
                "featured": True
            }
            
            response, success, error = self.make_request("PUT", f"/admin/products/{self.test_product_id}", update_data)
            if success and response.status_code == 200:
                data = response.json()
                if "product" in data:
                    updated_product = data["product"]
                    self.log_result("Admin Product UPDATE", True, 
                        f"Product updated: {updated_product.get('name')}, Price: ₹{updated_product.get('price')}")
                else:
                    self.log_result("Admin Product UPDATE", False, "Missing 'product' in response")
            else:
                self.log_result("Admin Product UPDATE", False, 
                    f"HTTP {response.status_code if response else 'N/A'}: {response.text if response else error}")
        
        # Test 3: Delete Product (DELETE /api/admin/products/:id)
        if self.test_product_id:
            response, success, error = self.make_request("DELETE", f"/admin/products/{self.test_product_id}")
            if success and response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_result("Admin Product DELETE", True, data["message"])
                else:
                    self.log_result("Admin Product DELETE", True, "Product deleted successfully")
            else:
                self.log_result("Admin Product DELETE", False, 
                    f"HTTP {response.status_code if response else 'N/A'}: {response.text if response else error}")

    def test_admin_order_management(self):
        """Test Admin Order Management operations"""
        print("\n=== Testing Admin Order Management API ===")
        
        # Test 1: Get All Orders (GET /api/admin/orders)
        response, success, error = self.make_request("GET", "/admin/orders")
        if not success:
            self.log_result("Admin Orders GET All", False, f"Request failed: {error}")
            return
        
        if response.status_code == 200:
            data = response.json()
            if "orders" in data:
                orders = data["orders"]
                self.log_result("Admin Orders GET All", True, f"Found {len(orders)} orders")
                
                # Store first order ID for update test
                if orders:
                    self.test_order_id = orders[0]["id"]
                    print(f"   Using order ID for update test: {self.test_order_id}")
            else:
                self.log_result("Admin Orders GET All", False, "Missing 'orders' in response")
        else:
            self.log_result("Admin Orders GET All", False, f"HTTP {response.status_code}: {response.text}")
        
        # Test 2: Filter Orders by Status (GET /api/admin/orders?status=pending)
        response, success, error = self.make_request("GET", "/admin/orders?status=pending")
        if success and response.status_code == 200:
            data = response.json()
            if "orders" in data:
                pending_orders = data["orders"]
                self.log_result("Admin Orders Filter by Status", True, 
                    f"Found {len(pending_orders)} pending orders")
            else:
                self.log_result("Admin Orders Filter by Status", False, "Missing 'orders' in response")
        else:
            self.log_result("Admin Orders Filter by Status", False, "Failed to filter orders by status")
        
        # Test 3: Update Order Status (PUT /api/admin/orders/:id)
        if self.test_order_id:
            update_data = {
                "status": "shipped",
                "paymentStatus": "completed"
            }
            
            response, success, error = self.make_request("PUT", f"/admin/orders/{self.test_order_id}", update_data)
            if success and response.status_code == 200:
                data = response.json()
                if "order" in data:
                    updated_order = data["order"]
                    self.log_result("Admin Order UPDATE Status", True, 
                        f"Order status updated to: {updated_order.get('status')}")
                else:
                    self.log_result("Admin Order UPDATE Status", False, "Missing 'order' in response")
            else:
                self.log_result("Admin Order UPDATE Status", False, 
                    f"HTTP {response.status_code if response else 'N/A'}: {response.text if response else error}")

    def run_admin_tests(self):
        """Run all admin API tests"""
        print("🚀 Starting SevenGhost Admin Panel Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 70)
        
        try:
            # Test admin endpoints in logical order
            self.test_admin_stats()
            self.test_admin_users()
            self.test_admin_settings_get()
            self.test_admin_settings_update()
            self.test_admin_product_crud()
            self.test_admin_order_management()
            
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR: {str(e)}")
            self.results["failed"] += 1
            self.results["errors"].append(f"Critical error: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 70)
        print("🏁 ADMIN API TEST SUMMARY")
        print("=" * 70)
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
    tester = SevenGhostAdminAPITester()
    success = tester.run_admin_tests()
    sys.exit(0 if success else 1)