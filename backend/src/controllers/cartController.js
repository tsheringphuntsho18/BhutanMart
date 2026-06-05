const { redisClient } = require("../config/redis");

// Add to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Invalid product or quantity" });
    }

    const cartKey = `cart:${userId}`;

    // Get current cart
    let cart = await redisClient.hGet(cartKey, productId);
    let cartQty = cart ? JSON.parse(cart).quantity : 0;

    // Update quantity
    cartQty += quantity;

    // Store in Redis Hash
    await redisClient.hSet(
      cartKey,
      productId,
      JSON.stringify({ productId, quantity: cartQty })
    );

    // Set expiration (7 days for logged-in users)
    await redisClient.expire(cartKey, 604800);

    res.json({ message: "Item added to cart", quantity: cartQty });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ error: "Failed to add to cart" });
  }
};

// Get cart
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cartKey = `cart:${userId}`;

    const cartItems = await redisClient.hGetAll(cartKey);

    const cart = Object.values(cartItems).map((item) => JSON.parse(item));

    res.json({ items: cart, itemCount: cart.length });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

// Update cart item
const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;
    const cartKey = `cart:${userId}`;

    if (quantity <= 0) {
      // Remove item
      await redisClient.hDel(cartKey, productId);
      return res.json({ message: "Item removed from cart" });
    }

    // Update quantity
    await redisClient.hSet(
      cartKey,
      productId,
      JSON.stringify({ productId, quantity })
    );

    res.json({ message: "Cart updated", quantity });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ error: "Failed to update cart" });
  }
};

// Remove from cart
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    const cartKey = `cart:${userId}`;

    await redisClient.hDel(cartKey, productId);

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ error: "Failed to remove from cart" });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cartKey = `cart:${userId}`;

    await redisClient.del(cartKey);

    res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ error: "Failed to clear cart" });
  }
};

// Guest cart — uses a client-generated guestId (stored in browser localStorage)
// TTL is shorter (1 day) since guest sessions are ephemeral
const GUEST_CART_TTL = 86400;

const getGuestCart = async (req, res) => {
  try {
    const { guestId } = req.params;
    const items = await redisClient.hGetAll(`cart:guest:${guestId}`);
    const cart = Object.values(items).map((item) => JSON.parse(item));
    res.json({ items: cart, itemCount: cart.length });
  } catch (error) {
    console.error("Get guest cart error:", error);
    res.status(500).json({ error: "Failed to fetch guest cart" });
  }
};

const addToGuestCart = async (req, res) => {
  try {
    const { guestId } = req.params;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Invalid product or quantity" });
    }

    const key = `cart:guest:${guestId}`;
    const existing = await redisClient.hGet(key, productId);
    const currentQty = existing ? JSON.parse(existing).quantity : 0;
    const newQty = currentQty + quantity;

    await redisClient.hSet(key, productId, JSON.stringify({ productId, quantity: newQty }));
    await redisClient.expire(key, GUEST_CART_TTL);

    res.json({ message: "Item added to guest cart", quantity: newQty });
  } catch (error) {
    console.error("Add to guest cart error:", error);
    res.status(500).json({ error: "Failed to add to guest cart" });
  }
};

const updateGuestCartItem = async (req, res) => {
  try {
    const { guestId } = req.params;
    const { productId, quantity } = req.body;
    const key = `cart:guest:${guestId}`;

    if (quantity <= 0) {
      await redisClient.hDel(key, productId);
      return res.json({ message: "Item removed from guest cart" });
    }

    await redisClient.hSet(key, productId, JSON.stringify({ productId, quantity }));
    await redisClient.expire(key, GUEST_CART_TTL);
    res.json({ message: "Guest cart updated", quantity });
  } catch (error) {
    console.error("Update guest cart error:", error);
    res.status(500).json({ error: "Failed to update guest cart" });
  }
};

const removeFromGuestCart = async (req, res) => {
  try {
    const { guestId, productId } = req.params;
    await redisClient.hDel(`cart:guest:${guestId}`, productId);
    res.json({ message: "Item removed from guest cart" });
  } catch (error) {
    console.error("Remove from guest cart error:", error);
    res.status(500).json({ error: "Failed to remove from guest cart" });
  }
};

const clearGuestCart = async (req, res) => {
  try {
    const { guestId } = req.params;
    await redisClient.del(`cart:guest:${guestId}`);
    res.json({ message: "Guest cart cleared" });
  } catch (error) {
    console.error("Clear guest cart error:", error);
    res.status(500).json({ error: "Failed to clear guest cart" });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getGuestCart,
  addToGuestCart,
  updateGuestCartItem,
  removeFromGuestCart,
  clearGuestCart,
};
