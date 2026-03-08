require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
// Fix TLS alert 80 on Windows with Node.js v22 + OpenSSL 3 + MongoDB Atlas

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

// ── Schemas ───────────────────────────────────────────────────────────────────

const categorySchema = new mongoose.Schema({
  _id: { type: String },          // slug, e.g. "hand-tools"
  name:  { type: String, required: true },
  icon:  { type: String, required: true },
  color: { type: String, required: true },
  bg:    { type: String, required: true },
}, { versionKey: false });

const productSchema = new mongoose.Schema({
  _id:          { type: Number },  // numeric ID — keeps frontend compatible
  name:         { type: String, required: true },
  category:     { type: String, ref: "Category" },
  categoryName: { type: String },
  price:        { type: Number, required: true },
  originalPrice:{ type: Number, default: null },
  rating:       { type: Number, default: 0 },
  reviews:      { type: Number, default: 0 },
  stock:        { type: Number, default: 0 },
  description:  { type: String, default: "" },
  icon:         { type: String, default: "fa-box" },
  iconColor:    { type: String, default: "#888" },
  image:        { type: String, default: "" },
  featured:     { type: Boolean, default: false },
  isNew:        { type: Boolean, default: false },
  onSale:       { type: Boolean, default: false },
  brand:        { type: String, default: "" },
}, { versionKey: false, suppressReservedKeysWarning: true });

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  role:      { type: String, default: "customer", enum: ["customer", "admin"] },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });

const orderItemSchema = new mongoose.Schema({
  productId: Number,
  name:      String,
  price:     Number,
  quantity:  Number,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  sessionId: { type: String },
  status:    { type: String, default: "pending", enum: ["pending","processing","shipped","delivered","cancelled"] },
  subtotal:  { type: Number, required: true },
  discount:  { type: Number, default: 0 },
  shipping:  { type: Number, default: 0 },
  tax:       { type: Number, default: 0 },
  total:     { type: Number, required: true },
  promoCode: { type: String, default: null },
  name:          { type: String, default: null },
  phone:         { type: String, default: null },
  address:       { type: String, default: null },
  city:          { type: String, default: null },
  paymentMethod: { type: String, default: "cod" },
  notes:         { type: String, default: null },
  items:         [orderItemSchema],
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });

// ── Models ────────────────────────────────────────────────────────────────────
const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
const Product   = mongoose.models.Product  || mongoose.model("Product",  productSchema);
const User      = mongoose.models.User     || mongoose.model("User",     userSchema);
const Order     = mongoose.models.Order    || mongoose.model("Order",    orderSchema);

// ── Connect ───────────────────────────────────────────────────────────────────
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4
    });

    console.log("MongoDB Atlas connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

module.exports = { connectDB, Category, Product, User, Order };
