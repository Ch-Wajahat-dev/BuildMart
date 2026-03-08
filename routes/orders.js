const express = require("express");
const router = express.Router();
const { Product, Order } = require("../database/db");
const { verifyToken, optionalAuth } = require("../middleware/auth");

const TAX_RATE = 0.05;
const PROMO_CODES = { "PIRMAHAL10": 0.10, "HARDWARE20": 0.20, "SAVE15": 0.15 };
const SHIPPING_THRESHOLD = 5000;
const SHIPPING_COST = 250;

// POST /api/orders — place order from session cart
router.post("/", optionalAuth, async (req, res) => {
  try {
    const { name, phone, address, city, paymentMethod, notes, promoCode } = req.body;
    const cartItems = req.session.cart || [];
    if (!cartItems.length) return res.status(400).json({ error: "Cart is empty" });

    const orderItems = [];
    let subtotal = 0;

    for (const ci of cartItems) {
      const p = await Product.findById(ci.id);
      if (!p) continue;
      orderItems.push({ productId: p._id, name: p.name, price: p.price, quantity: ci.quantity });
      subtotal += p.price * ci.quantity;
    }

    const discountRate = promoCode ? (PROMO_CODES[promoCode.toUpperCase()] || 0) : 0;
    const discountAmt  = Math.round(subtotal * discountRate);
    const shipping     = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const tax          = Math.round((subtotal - discountAmt) * TAX_RATE);
    const total        = subtotal - discountAmt + shipping + tax;

    const order = await Order.create({
      userId:    req.user ? req.user.id : null,
      sessionId: req.sessionID,
      subtotal, discount: discountAmt, shipping, tax, total,
      promoCode: promoCode || null,
      name: name || null, phone: phone || null, address: address || null,
      city: city || null, paymentMethod: paymentMethod || "cod", notes: notes || null,
      items: orderItems,
    });

    req.session.cart = [];
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders — orders for logged-in user
router.get("/", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const isOwner      = req.user && req.user.id === order.userId?.toString();
    const isSameSession = req.sessionID === order.sessionId;
    const isAdmin      = req.user?.role === "admin";
    if (!isOwner && !isSameSession && !isAdmin)
      return res.status(403).json({ error: "Access denied" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
