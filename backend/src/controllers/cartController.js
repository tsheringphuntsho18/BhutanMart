const { redisClient } = require("../config/redis");

// Add to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.userId;

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
    const userId = req.user.userId;
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
    const userId = req.user.userId;
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
    const userId = req.user.userId;
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
    const userId = req.user.userId;
    const cartKey = `cart:${userId}`;

    await redisClient.del(cartKey);

    res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ error: "Failed to clear cart" });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
