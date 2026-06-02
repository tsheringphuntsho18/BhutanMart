const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const Order = require("../src/models/Order");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Category = require("../src/models/Category");
const Seller = require("../src/models/Seller");
const Inventory = require("../src/models/Inventory");

describe("Order Controller", () => {
  let token, userId, productId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bhutanmart_test");

    // Create user
    const user = await User.create({
      name: "Order Test User",
      email: "order@test.com",
      password: "password123",
      role: "customer",
    });

    userId = user._id;
    token = require("../src/utils/generateToken").generateToken(userId, "customer");

    // Create category, seller, and product
    const category = await Category.create({
      name: "Order Test Category",
      description: "For order testing",
    });

    const seller = await Seller.create({
      owner: await User.create({
        name: "Order Seller",
        email: "orderseller@test.com",
        password: "password123",
        role: "seller",
      }),
      storeName: "Order Test Store",
    });

    const product = await Product.create({
      name: "Order Test Product",
      categoryId: category._id,
      sellerId: seller._id,
      price: 49.99,
      stock: 100,
    });

    productId = product._id;

    // Create inventory
    await Inventory.create({
      productId: product._id,
      stock: 100,
      lowStockThreshold: 10,
    });
  });

  afterAll(async () => {
    await Order.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Seller.deleteMany({});
    await Inventory.deleteMany({});
    await mongoose.disconnect();
  });

  describe("POST /api/orders", () => {
    it("should place an order successfully", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [
            {
              productId: productId.toString(),
              name: "Order Test Product",
              quantity: 2,
              price: 49.99,
            },
          ],
          paymentMethod: "COD",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("orderId");
      expect(res.body.totalAmount).toBe(99.98);
    });

    it("should not place order with insufficient stock", async () => {
      // Create a product with low stock
      const lowStockCategory = await Category.create({
        name: "Low Stock Test",
      });

      const lowStockSeller = await Seller.create({
        owner: await User.create({
          name: "Low Stock Seller",
          email: "lowseller@test.com",
          password: "password123",
          role: "seller",
        }),
        storeName: "Low Stock Store",
      });

      const lowStockProduct = await Product.create({
        name: "Low Stock Product",
        categoryId: lowStockCategory._id,
        sellerId: lowStockSeller._id,
        price: 29.99,
        stock: 1,
      });

      await Inventory.create({
        productId: lowStockProduct._id,
        stock: 1,
        lowStockThreshold: 5,
      });

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [
            {
              productId: lowStockProduct._id.toString(),
              name: "Low Stock Product",
              quantity: 5, // More than available
              price: 29.99,
            },
          ],
          paymentMethod: "COD",
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /api/orders", () => {
    it("should get user orders", async () => {
      const res = await request(app)
        .get("/api/orders")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("orders");
      expect(Array.isArray(res.body.orders)).toBe(true);
    });

    it("should not get orders without authentication", async () => {
      const res = await request(app)
        .get("/api/orders");

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/orders/:orderId", () => {
    let orderId;

    beforeEach(async () => {
      const order = await Order.create({
        userId,
        items: [
          {
            productId,
            name: "Test Product",
            quantity: 1,
            price: 49.99,
          },
        ],
        totalAmount: 49.99,
        status: "Placed",
        paymentMethod: "COD",
      });
      orderId = order._id;
    });

    it("should get order by ID", async () => {
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("_id", orderId.toString());
    });

    it("should return 404 for non-existent order", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/orders/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("PUT /api/orders/:orderId/status", () => {
    let orderId;

    beforeEach(async () => {
      const order = await Order.create({
        userId,
        items: [
          {
            productId,
            name: "Test Product",
            quantity: 1,
            price: 49.99,
          },
        ],
        totalAmount: 49.99,
        status: "Placed",
        paymentMethod: "COD",
      });
      orderId = order._id;
    });

    it("should update order status", async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          status: "Confirmed",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.order.status).toBe("Confirmed");
    });
  });

  describe("PUT /api/orders/:orderId/cancel", () => {
    let orderId;

    beforeEach(async () => {
      const order = await Order.create({
        userId,
        items: [
          {
            productId,
            name: "Test Product",
            quantity: 1,
            price: 49.99,
          },
        ],
        totalAmount: 49.99,
        status: "Placed",
        paymentMethod: "COD",
      });
      orderId = order._id;
    });

    it("should cancel an order", async () => {
      const res = await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.order.status).toBe("Cancelled");
    });
  });
});
