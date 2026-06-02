const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const Product = require("../src/models/Product");
const Category = require("../src/models/Category");
const Seller = require("../src/models/Seller");
const User = require("../src/models/User");

describe("Product Controller", () => {
  let categoryId, sellerId, token;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bhutanmart_test");

    // Create test category
    const category = await Category.create({
      name: "Test Category",
      description: "Category for testing",
    });
    categoryId = category._id;

    // Create test seller user and seller profile
    const sellerUser = await User.create({
      name: "Test Seller",
      email: "seller@test.com",
      password: "password123",
      role: "seller",
    });

    const seller = await Seller.create({
      owner: sellerUser._id,
      storeName: "Test Store",
      description: "A test store",
    });
    sellerId = seller._id;
    token = require("../src/utils/generateToken").generateToken(sellerUser._id, "seller");
  });

  afterAll(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Seller.deleteMany({});
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  describe("GET /api/products", () => {
    beforeEach(async () => {
      await Product.create({
        name: "Test Product",
        description: "A test product",
        categoryId,
        sellerId,
        price: 99.99,
        stock: 10,
        tags: ["test"],
      });
    });

    it("should get all products", async () => {
      const res = await request(app)
        .get("/api/products")
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should filter products by category", async () => {
      const res = await request(app)
        .get("/api/products")
        .query({ categoryId: categoryId.toString() });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should filter products by price range", async () => {
      const res = await request(app)
        .get("/api/products")
        .query({ minPrice: 50, maxPrice: 150 });

      expect(res.statusCode).toBe(200);
    });
  });

  describe("GET /api/products/:productId", () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create({
        name: "Detail Test Product",
        description: "Product for detail testing",
        categoryId,
        sellerId,
        price: 49.99,
        stock: 5,
      });
      productId = product._id;
    });

    it("should get product by ID", async () => {
      const res = await request(app)
        .get(`/api/products/${productId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.product).toHaveProperty("name", "Detail Test Product");
    });

    it("should return 404 for non-existent product", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/products/${fakeId}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("POST /api/products", () => {
    it("should create a new product", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "New Product",
          description: "A brand new product",
          categoryId: categoryId.toString(),
          price: 199.99,
          stock: 20,
          tags: ["new", "featured"],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.product).toHaveProperty("name", "New Product");
    });

    it("should not create product without authentication", async () => {
      const res = await request(app)
        .post("/api/products")
        .send({
          name: "Unauthorized Product",
          categoryId: categoryId.toString(),
          price: 99.99,
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("PUT /api/products/:productId", () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create({
        name: "Original Name",
        description: "Original description",
        categoryId,
        sellerId,
        price: 79.99,
        stock: 15,
      });
      productId = product._id;
    });

    it("should update a product", async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Updated Name",
          price: 89.99,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.product.name).toBe("Updated Name");
    });
  });

  describe("DELETE /api/products/:productId", () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create({
        name: "Product to Delete",
        categoryId,
        sellerId,
        price: 59.99,
        stock: 8,
      });
      productId = product._id;
    });

    it("should delete a product", async () => {
      const res = await request(app)
        .delete(`/api/products/${productId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);

      const deletedProduct = await Product.findById(productId);
      expect(deletedProduct).toBeNull();
    });
  });
});
