const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const { redisClient } = require("../src/config/redis");
const User = require("../src/models/User");

describe("Cart Controller", () => {
  let token, userId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bhutanmart_test");

    const user = await User.create({
      name: "Cart Test User",
      email: "cart@test.com",
      password: "password123",
      role: "customer",
    });

    userId = user._id;
    token = require("../src/utils/generateToken").generateToken(userId, "customer");
  });

  afterAll(async () => {
    await User.deleteMany({});
    await redisClient.del(`cart:${userId}`);
    await mongoose.disconnect();
  });

  describe("POST /api/cart/add", () => {
    it("should add item to cart", async () => {
      const fakeProductId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({
          productId: fakeProductId.toString(),
          quantity: 2,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Item added to cart");
    });

    it("should not add item with invalid quantity", async () => {
      const fakeProductId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({
          productId: fakeProductId.toString(),
          quantity: 0,
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /api/cart", () => {
    it("should get cart items", async () => {
      const res = await request(app)
        .get("/api/cart")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("items");
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it("should not get cart without authentication", async () => {
      const res = await request(app)
        .get("/api/cart");

      expect(res.statusCode).toBe(401);
    });
  });

  describe("PUT /api/cart/update", () => {
    it("should update cart item quantity", async () => {
      const fakeProductId = new mongoose.Types.ObjectId();

      // First add an item
      await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({
          productId: fakeProductId.toString(),
          quantity: 1,
        });

      // Then update it
      const res = await request(app)
        .put("/api/cart/update")
        .set("Authorization", `Bearer ${token}`)
        .send({
          productId: fakeProductId.toString(),
          quantity: 5,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.quantity).toBe(5);
    });
  });

  describe("DELETE /api/cart/remove/:productId", () => {
    it("should remove item from cart", async () => {
      const fakeProductId = new mongoose.Types.ObjectId();

      // Add item first
      await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${token}`)
        .send({
          productId: fakeProductId.toString(),
          quantity: 1,
        });

      // Then remove it
      const res = await request(app)
        .delete(`/api/cart/remove/${fakeProductId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Item removed from cart");
    });
  });

  describe("DELETE /api/cart/clear", () => {
    it("should clear entire cart", async () => {
      const res = await request(app)
        .delete("/api/cart/clear")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Cart cleared");
    });
  });
});
