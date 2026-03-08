const express = require("express");
const router = express.Router();
const { Product, Category } = require("../database/db");
const { requireAdmin } = require("../middleware/auth");

function mapProduct(p) {
  const o = p.toObject ? p.toObject() : p;
  return {
    id: o._id, name: o.name, category: o.category, categoryName: o.categoryName,
    price: o.price, originalPrice: o.originalPrice || null,
    rating: o.rating, reviews: o.reviews, stock: o.stock,
    description: o.description, icon: o.icon, iconColor: o.iconColor,
    image: o.image, featured: o.featured, isNew: o.isNew, onSale: o.onSale, brand: o.brand,
  };
}

// GET /api/products
router.get("/", async (req, res) => {
  try {
    const { category, search, sort, featured, on_sale, is_new,
            min_price, max_price, page = 1, limit = 100 } = req.query;

    const filter = {};
    if (category)           filter.category = category;
    if (featured === "true") filter.featured = true;
    if (on_sale  === "true") filter.onSale   = true;
    if (is_new   === "true") filter.isNew    = true;
    if (min_price || max_price) {
      filter.price = {};
      if (min_price) filter.price.$gte = Number(min_price);
      if (max_price) filter.price.$lte = Number(max_price);
    }
    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [{ name: re }, { description: re }, { brand: re }, { categoryName: re }];
    }

    let sortOpt = { _id: 1 };
    switch (sort) {
      case "price-asc":  sortOpt = { price:  1 }; break;
      case "price-desc": sortOpt = { price: -1 }; break;
      case "rating":     sortOpt = { rating: -1 }; break;
      case "name":       sortOpt = { name:   1 }; break;
      case "newest":     sortOpt = { isNew: -1, _id: -1 }; break;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOpt).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({ products: products.map(mapProduct), total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/categories
router.get("/categories", async (req, res) => {
  try {
    const cats = await Category.find();
    const result = await Promise.all(cats.map(async c => ({
      id: c._id, name: c.name, icon: c.icon, color: c.color, bg: c.bg,
      count: await Product.countDocuments({ category: c._id }),
    })));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const p = await Product.findById(Number(req.params.id));
    if (!p) return res.status(404).json({ error: "Product not found" });
    res.json(mapProduct(p));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — admin create
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, category, categoryName, price, originalPrice, rating, reviews,
            stock, description, icon, iconColor, image, featured, isNew, onSale, brand } = req.body;

    const cat = await Category.findById(category);
    if (!cat) return res.status(400).json({ error: "Invalid category" });

    const last = await Product.findOne().sort({ _id: -1 });
    const nextId = last ? last._id + 1 : 1;

    const product = await Product.create({
      _id: nextId, name, category, categoryName: categoryName || category,
      price, originalPrice: originalPrice || null,
      rating: rating || 0, reviews: reviews || 0, stock: stock || 0,
      description: description || "", icon: icon || "fa-box",
      iconColor: iconColor || "#888", image: image || "",
      featured: !!featured, isNew: !!isNew, onSale: !!onSale, brand: brand || "",
    });

    res.status(201).json(mapProduct(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id — admin update
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(Number(req.params.id));
    if (!product) return res.status(404).json({ error: "Product not found" });

    const fields = ["name","category","categoryName","price","originalPrice","rating",
                    "reviews","stock","description","icon","iconColor","image",
                    "featured","isNew","onSale","brand"];
    for (const f of fields) {
      if (req.body[f] !== undefined) product[f] = req.body[f];
    }
    await product.save();
    res.json(mapProduct(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id — admin delete
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const p = await Product.findByIdAndDelete(Number(req.params.id));
    if (!p) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
