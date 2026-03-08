// ============================================================
// API HELPER — js/api.js
// Handles all communication with the Express backend.
// Falls back to local PRODUCTS[] if served from file://
// ============================================================

const IS_SERVER = window.location.protocol !== "file:";
const API_BASE = IS_SERVER ? "/api" : null;

// ── Token management ──────────────────────────────────────────────────────────
const Auth = {
  getToken()        { return localStorage.getItem("hw_token"); },
  setToken(t)       { localStorage.setItem("hw_token", t); },
  removeToken()     { localStorage.removeItem("hw_token"); },
  getUser()         { const u = localStorage.getItem("hw_user"); return u ? JSON.parse(u) : null; },
  setUser(u)        { localStorage.setItem("hw_user", JSON.stringify(u)); },
  removeUser()      { localStorage.removeItem("hw_user"); },
  isLoggedIn()      { return !!this.getToken(); },
  isAdmin()         { const u = this.getUser(); return u && u.role === "admin"; },
  logout()          { this.removeToken(); this.removeUser(); window.dispatchEvent(new Event("auth:logout")); }
};

// ── Base fetch with auth header ───────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(API_BASE + path, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Products API ──────────────────────────────────────────────────────────────
const ProductsAPI = {
  async getAll(params = {}) {
    if (!IS_SERVER) return { products: PRODUCTS, total: PRODUCTS.length };
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/products${qs ? "?" + qs : ""}`);
  },

  async getById(id) {
    if (!IS_SERVER) return PRODUCTS.find(p => p.id === Number(id)) || null;
    return apiFetch(`/products/${id}`);
  },

  async getCategories() {
    if (!IS_SERVER) {
      return CATEGORIES.map(c => ({
        ...c, count: PRODUCTS.filter(p => p.category === c.id).length
      }));
    }
    return apiFetch("/products/categories");
  },

  async getFeatured() {
    if (!IS_SERVER) return { products: PRODUCTS.filter(p => p.featured), total: 0 };
    return apiFetch("/products?featured=true");
  }
};

// ── Cart API (server session) ────────────────────────────────────────────────
const CartAPI = {
  async get() {
    if (!IS_SERVER) return null; // handled by Cart object
    return apiFetch("/cart");
  },

  async add(productId, quantity = 1) {
    if (!IS_SERVER) return null;
    return apiFetch("/cart", { method: "POST", body: JSON.stringify({ productId, quantity }) });
  },

  async update(productId, quantity) {
    if (!IS_SERVER) return null;
    return apiFetch(`/cart/${productId}`, { method: "PUT", body: JSON.stringify({ quantity }) });
  },

  async remove(productId) {
    if (!IS_SERVER) return null;
    return apiFetch(`/cart/${productId}`, { method: "DELETE" });
  },

  async clear() {
    if (!IS_SERVER) return null;
    return apiFetch("/cart", { method: "DELETE" });
  }
};

// ── Auth API ─────────────────────────────────────────────────────────────────
const AuthAPI = {
  async register(name, email, password) {
    const data = await apiFetch("/auth/register", {
      method: "POST", body: JSON.stringify({ name, email, password })
    });
    Auth.setToken(data.token);
    Auth.setUser(data.user);
    window.dispatchEvent(new Event("auth:login"));
    return data;
  },

  async login(email, password) {
    const data = await apiFetch("/auth/login", {
      method: "POST", body: JSON.stringify({ email, password })
    });
    Auth.setToken(data.token);
    Auth.setUser(data.user);
    window.dispatchEvent(new Event("auth:login"));
    return data;
  },

  async me() {
    return apiFetch("/auth/me");
  }
};

// ── Orders API ────────────────────────────────────────────────────────────────
const OrdersAPI = {
  async place(data) {
    return apiFetch("/orders", { method: "POST", body: JSON.stringify(data) });
  },

  async getMine() {
    return apiFetch("/orders");
  },

  async getById(id) {
    return apiFetch(`/orders/${id}`);
  }
};
