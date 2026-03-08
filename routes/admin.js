const express = require("express");
const router = express.Router();
const { Product, User, Order } = require("../database/db");
const { requireAdmin } = require("../middleware/auth");

router.use(requireAdmin);

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const [totalProducts, totalUsers, totalOrders, revenueAgg, recentOrders, topProductsAgg, lowStock] =
      await Promise.all([
        Product.countDocuments(),
        User.countDocuments({ role: "customer" }),
        Order.countDocuments(),
        Order.aggregate([
          { $match: { status: { $ne: "cancelled" } } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Order.find().sort({ createdAt: -1 }).limit(10),
        Order.aggregate([
          { $unwind: "$items" },
          { $group: { _id: "$items.productId", sold: { $sum: "$items.quantity" } } },
          { $sort: { sold: -1 } },
          { $limit: 5 },
          { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
          { $unwind: "$product" },
          { $project: { id: "$_id", name: "$product.name", category: "$product.category", price: "$product.price", sold: 1 } },
        ]),
        Product.find({ stock: { $lt: 10 } }).sort({ stock: 1 }).select("_id name stock"),
      ]);

    const revenue     = revenueAgg[0]?.total || 0;
    const topProducts = topProductsAgg.map(t => ({ id: t._id, name: t.name, category: t.category, price: t.price, sold: t.sold }));
    const lowStockMapped = lowStock.map(p => ({ id: p._id, name: p.name, stock: p.stock }));

    res.json({ totalProducts, totalUsers, totalOrders, revenue, recentOrders, topProducts, lowStock: lowStockMapped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/orders
router.get("/orders", async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = status ? { status } : {};
    const skip   = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/orders/:id — update status
router.put("/orders/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending","processing","shipped","delivered","cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
