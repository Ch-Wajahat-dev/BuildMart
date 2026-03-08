// ============================================================
// CART MODULE — syncs with server session when on server
// Falls back to localStorage when served from file://
// ============================================================
const Cart = {
  items: JSON.parse(localStorage.getItem("hw_cart")) || [],
  _serverSynced: false,

  // ── localStorage fallback ──────────────────────────────────────────────────
  save() {
    localStorage.setItem("hw_cart", JSON.stringify(this.items));
    this.updateBadge();
  },

  // ── Core actions ───────────────────────────────────────────────────────────
  async add(productId, quantity = 1) {
    const qty = Math.max(1, parseInt(quantity) || 1);

    if (IS_SERVER) {
      try {
        const data = await CartAPI.add(productId, qty);
        this.items = data.items.map(i => ({ id: i.id, quantity: i.quantity }));
        this.save();
        const p = data.items.find(i => i.id === productId);
        this.showToast(`<strong>${p ? p.name : "Item"}</strong> added to cart!`);
        return;
      } catch (e) { console.warn("Server cart failed, using local", e); }
    }

    // local fallback
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    const existing = this.items.find(i => i.id === productId);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + qty, product.stock);
    } else {
      this.items.push({ id: productId, quantity: qty });
    }
    this.save();
    this.showToast(`<strong>${product.name}</strong> added to cart!`);
  },

  async remove(productId) {
    if (IS_SERVER) {
      try {
        const data = await CartAPI.remove(productId);
        this.items = data.items.map(i => ({ id: i.id, quantity: i.quantity }));
        this.save(); return;
      } catch {}
    }
    this.items = this.items.filter(i => i.id !== productId);
    this.save();
  },

  async updateQuantity(productId, quantity) {
    if (quantity <= 0) { this.remove(productId); return; }
    if (IS_SERVER) {
      try {
        const data = await CartAPI.update(productId, quantity);
        this.items = data.items.map(i => ({ id: i.id, quantity: i.quantity }));
        this.save(); return;
      } catch {}
    }
    const item = this.items.find(i => i.id === productId);
    if (item) { item.quantity = quantity; this.save(); }
  },

  async clear() {
    if (IS_SERVER) {
      try { await CartAPI.clear(); } catch {}
    }
    this.items = [];
    this.save();
  },

  // ── Sync cart from server on page load ────────────────────────────────────
  async syncFromServer() {
    if (!IS_SERVER || this._serverSynced) return;
    try {
      const data = await CartAPI.get();
      this._serverSynced = true;
      if (data && data.items) {
        this.items = data.items.map(i => ({ id: i.id, quantity: i.quantity }));
        this.save();
      }
    } catch {}
  },

  getSubtotal() {
    return this.items.reduce((sum, item) => {
      const p = PRODUCTS.find(x => x.id === item.id);
      return sum + (p ? p.price * item.quantity : 0);
    }, 0);
  },

  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  updateBadge() {
    document.querySelectorAll(".cart-badge").forEach(badge => {
      const count = this.getCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    });
  },

  showToast(message) {
    const old = document.querySelector(".cart-toast");
    if (old) old.remove();
    const toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await Cart.syncFromServer();
  Cart.updateBadge();

  // Mobile nav toggle
  const hamburger = document.getElementById("hamburger");
  const mobileNav = document.getElementById("mobileNav");
  const mobileOverlay = document.getElementById("mobileOverlay");
  const mobileClose = document.getElementById("mobileClose");

  function openMobileNav() {
    mobileNav && mobileNav.classList.add("open");
    mobileOverlay && mobileOverlay.classList.add("show");
    document.body.style.overflow = "hidden";
  }
  function closeMobileNav() {
    mobileNav && mobileNav.classList.remove("open");
    mobileOverlay && mobileOverlay.classList.remove("show");
    document.body.style.overflow = "";
  }

  hamburger && hamburger.addEventListener("click", openMobileNav);
  mobileClose && mobileClose.addEventListener("click", closeMobileNav);
  mobileOverlay && mobileOverlay.addEventListener("click", closeMobileNav);
});
