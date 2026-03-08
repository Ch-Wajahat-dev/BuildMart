const express = require("express");
const router = express.Router();
const { Product } = require("../database/db");
const { optionalAuth } = require("../middleware/auth");

router.use(optionalAuth);

function getCart(req)          { return req.session.cart || []; }
function saveCart(req, items)  { req.session.cart = items; }

async function enrichCart(items) {
  const results = await Promise.all(items.map(async item => {
    const p = await Product.findById(item.id);
    if (!p) return null;
    return {
      id: p._id, name: p.name, price: p.price, originalPrice: p.originalPrice || null,
      image: p.image, icon: p.icon, iconColor: p.iconColor,
      category: p.category, categoryName: p.categoryName,
      brand: p.brand, stock: p.stock, quantity: item.quantity,
    };
  }));
  return results.filter(Boolean);
}

// GET /api/cart
router.get("/", async (req, res) => {
  try {
    const items = getCart(req);
    const enriched = await enrichCart(items);
    res.json({ items: enriched, count: items.reduce((s, i) => s + i.quantity, 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart — add item
router.post("/", async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const p = await Product.findById(Number(productId));
    if (!p) return res.status(404).json({ error: "Product not found" });

    const qty = Math.max(1, parseInt(quantity) || 1);
    const items = getCart(req);
    const existing = items.find(i => i.id === p._id);

    if (existing) {
      existing.quantity = Math.min(existing.quantity + qty, p.stock);
    } else {
      items.push({ id: p._id, quantity: Math.min(qty, p.stock) });
    }

    saveCart(req, items);
    const enriched = await enrichCart(items);
    res.json({ items: enriched, count: items.reduce((s, i) => s + i.quantity, 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cart/:productId — update quantity
router.put("/:productId", async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = Number(req.params.productId);
    const items = getCart(req);
    const idx = items.findIndex(i => i.id === productId);
    if (idx === -1) return res.status(404).json({ error: "Item not in cart" });

    const qty = parseInt(quantity);
    if (!qty || qty < 1) {
      items.splice(idx, 1);
    } else {
      const p = await Product.findById(productId);
      items[idx].quantity = p ? Math.min(qty, p.stock) : qty;
    }

    saveCart(req, items);
    const enriched = await enrichCart(items);
    res.json({ items: enriched, count: items.reduce((s, i) => s + i.quantity, 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/:productId — remove item
router.delete("/:productId", async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const items = getCart(req).filter(i => i.id !== productId);
    saveCart(req, items);
    const enriched = await enrichCart(items);
    res.json({ items: enriched, count: items.reduce((s, i) => s + i.quantity, 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart — clear cart
router.delete("/", (req, res) => {
  saveCart(req, []);
  res.json({ items: [], count: 0 });
});

module.exports = router;
