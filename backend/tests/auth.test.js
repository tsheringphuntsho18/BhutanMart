const request = require("supertest");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const bcrypt = require("bcryptjs");
const app = require("../src/app");

describe("Authentication Controller", () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bhutanmart_test");
  });

  afterAll(async () => {
    // Clean up and disconnect
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          role: "customer",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toHaveProperty("email", "test@example.com");
    });

    it("should not register if email already exists", async () => {
      // First registration
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "duplicate@example.com",
          password: "password123",
        });

      // Second registration with same email
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Another User",
          email: "duplicate@example.com",
          password: "password456",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should not register if missing required fields", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "incomplete@example.com",
          password: "password123",
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("testpass123", 10);
      await User.create({
        name: "Login Test User",
        email: "logintest@example.com",
        password: hashedPassword,
        role: "customer",
      });
    });

    it("should login successfully with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "logintest@example.com",
          password: "testpass123",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toHaveProperty("email", "logintest@example.com");
    });

    it("should fail login with incorrect password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "logintest@example.com",
          password: "wrongpassword",
        });

      expect(res.statusCode).toBe(400);
    });

    it("should fail login if user doesn't exist", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout authenticated user", async () => {
      // Register and login first
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Logout Test",
          email: "logout@example.com",
          password: "password123",
        });

      const token = registerRes.body.token;

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Logout successful");
    });
  });
});
