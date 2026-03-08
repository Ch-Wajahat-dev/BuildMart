// ============================================================
// CART PAGE SCRIPTS — works with server session cart + local fallback
// ============================================================
const TAX_RATE = 0.05; // 5% GST
let promoApplied = false;
let promoDiscount = 0;
let promoCode = "";

// enrichedItems: full product objects with quantity (from server or local)
let enrichedItems = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadCart();
  setupPromo();
  setupCheckout();
  document.querySelector('.nav-link[href="cart.html"]') &&
    document.querySelector('.nav-link[href="cart.html"]').classList.add("active");
});

async function loadCart() {
  if (IS_SERVER) {
    try {
      const data = await CartAPI.get();
      enrichedItems = data.items || [];
      // Sync local badge
      Cart.items = enrichedItems.map(i => ({ id: i.id, quantity: i.quantity }));
      Cart.save();
      renderCartItems();
      return;
    } catch {}
  }
  // fallback: build enriched from localStorage
  enrichedItems = Cart.items.map(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) return null;
    return { ...p, quantity: item.quantity };
  }).filter(Boolean);
  renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById("cartContainer");
  const summarySection = document.getElementById("summarySection");
  if (!container) return;

  if (enrichedItems.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-cart-shopping"></i>
        <h3>Your cart is empty</h3>
        <p>Looks like you haven't added any products yet.</p>
        <a href="products.html" class="btn btn-primary"><i class="fas fa-store"></i> Browse Products</a>
      </div>`;
    if (summarySection) summarySection.style.display = "none";
    return;
  }

  if (summarySection) summarySection.style.display = "block";

  const headerCount = document.getElementById("cartCount");
  if (headerCount) headerCount.textContent = `(${enrichedItems.reduce((s,i) => s + i.quantity, 0)} items)`;

  container.innerHTML = enrichedItems.map(item => {
    const p = item;
    return `
      <div class="cart-item" id="cart-item-${p.id}">
        <div class="cart-item-img" style="background:${p.iconColor}18;overflow:hidden;position:relative;">
          <img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;display:block;"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;position:absolute;inset:0;">
            <i class="fas ${p.icon}" style="color:${p.iconColor};font-size:28px;"></i>
          </div>
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-category">${p.categoryName}</div>
          <div class="cart-item-price">${formatPrice(p.price)} each</div>
        </div>
        <div class="cart-item-controls">
          <div class="cart-item-total">${formatPrice(p.price * p.quantity)}</div>
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty(${p.id}, -1)">−</button>
            <input type="number" class="qty-value" value="${p.quantity}" min="1" max="${p.stock || 99}"
              onchange="setQty(${p.id}, +this.value)" onblur="setQty(${p.id}, +this.value)">
            <button class="qty-btn" onclick="changeQty(${p.id}, 1)">+</button>
          </div>
          <button class="btn-remove" onclick="removeItem(${p.id})" title="Remove">
            <i class="fas fa-trash"></i> Remove
          </button>
        </div>
      </div>`;
  }).join("");

  updateSummary();
}

async function changeQty(productId, delta) {
  const item = enrichedItems.find(i => i.id === productId);
  if (!item) return;
  const newQty = item.quantity + delta;
  if (newQty < 1) { removeItem(productId); return; }
  if (item.stock && newQty > item.stock) return;
  await setQty(productId, newQty);
}

async function setQty(productId, qty) {
  if (isNaN(qty) || qty < 1) qty = 1;
  const item = enrichedItems.find(i => i.id === productId);
  if (item && item.stock && qty > item.stock) qty = item.stock;

  await Cart.updateQuantity(productId, qty);

  if (IS_SERVER) {
    try {
      const data = await CartAPI.get();
      enrichedItems = data.items || [];
    } catch {}
  } else {
    enrichedItems = Cart.items.map(ci => {
      const p = PRODUCTS.find(x => x.id === ci.id);
      return p ? { ...p, quantity: ci.quantity } : null;
    }).filter(Boolean);
  }
  renderCartItems();
}

async function removeItem(productId) {
  const row = document.getElementById("cart-item-" + productId);
  if (row) {
    row.style.opacity = "0";
    row.style.transform = "translateX(20px)";
    row.style.transition = "all 0.3s ease";
    await new Promise(r => setTimeout(r, 300));
  }

  await Cart.remove(productId);
  enrichedItems = enrichedItems.filter(i => i.id !== productId);
  renderCartItems();
}

async function clearCart() {
  if (!confirm("Remove all items from cart?")) return;
  await Cart.clear();
  enrichedItems = [];
  renderCartItems();
}

function getSubtotal() {
  return enrichedItems.reduce((s, i) => s + i.price * i.quantity, 0);
}

function updateSummary() {
  const subtotal = getSubtotal();
  const shipping = subtotal >= 5000 ? 0 : 250;
  const discountAmt = promoApplied ? Math.round(subtotal * promoDiscount) : 0;
  const tax = Math.round((subtotal - discountAmt) * TAX_RATE);
  const total = subtotal - discountAmt + shipping + tax;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("summarySubtotal", formatPrice(subtotal));
  set("summaryShipping", shipping === 0 ? "FREE" : formatPrice(shipping));
  set("summaryDiscount", promoApplied ? "−" + formatPrice(discountAmt) : "—");
  set("summaryTax", formatPrice(tax));
  set("summaryTotal", formatPrice(total));

  const freeShipBanner = document.getElementById("freeShipBanner");
  if (freeShipBanner) {
    if (subtotal < 5000) {
      freeShipBanner.style.display = "flex";
      const msgEl  = document.getElementById("freeShipMsg");
      const fillEl = document.getElementById("freeShipBarFill");
      if (msgEl)  msgEl.textContent = `Add ${formatPrice(5000 - subtotal)} more for FREE shipping!`;
      if (fillEl) fillEl.style.width = Math.round((subtotal / 5000) * 100) + "%";
    } else {
      freeShipBanner.style.display = "none";
    }
  }
}

function setupPromo() {
  const btn = document.getElementById("applyPromo");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const input = document.getElementById("promoInput");
    const msg = document.getElementById("promoMsg");
    const code = input.value.trim().toUpperCase();
    const codes = { "PIRMAHAL10": 0.10, "HARDWARE20": 0.20, "SAVE15": 0.15 };
    if (codes[code]) {
      promoApplied = true;
      promoDiscount = codes[code];
      promoCode = code;
      if (msg) { msg.textContent = `Promo applied! ${Math.round(promoDiscount * 100)}% off.`; msg.className = "promo-msg success"; }
      input.disabled = true;
      btn.disabled = true;
      updateSummary();
    } else {
      if (msg) { msg.textContent = "Invalid promo code."; msg.className = "promo-msg error"; }
      promoApplied = false;
    }
  });
}

function setupCheckout() {
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (!checkoutBtn) return;

  // "Proceed to Checkout" → open modal, fill mini-summary
  checkoutBtn.addEventListener("click", () => {
    if (enrichedItems.length === 0) return;
    if (!IS_SERVER) {
      Cart.showToast("Start the server (npm start) to place real orders!");
      return;
    }

    // Fill mini summary inside modal
    const subtotal = getSubtotal();
    const shipping  = subtotal >= 5000 ? 0 : 250;
    const discountAmt = promoApplied ? Math.round(subtotal * promoDiscount) : 0;
    const tax  = Math.round((subtotal - discountAmt) * TAX_RATE);
    const total = subtotal - discountAmt + shipping + tax;

    const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    s("coSubtotal", formatPrice(subtotal));
    s("coShipping",  shipping === 0 ? "FREE" : formatPrice(shipping));
    s("coDiscount",  promoApplied ? "−" + formatPrice(discountAmt) : "—");
    s("coTax",       formatPrice(tax));
    s("coTotal",     formatPrice(total));

    // Pre-fill name if logged in
    const user = Auth.getUser();
    if (user && !document.getElementById("co-name").value) {
      document.getElementById("co-name").value = user.name || "";
    }

    document.getElementById("checkoutModal").classList.add("show");
  });

  // Form submit → place order
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const errEl = document.getElementById("coError");
    errEl.style.display = "none";

    const name    = document.getElementById("co-name").value.trim();
    const phone   = document.getElementById("co-phone").value.trim();
    const address = document.getElementById("co-address").value.trim();
    const city    = document.getElementById("co-city").value.trim();
    const payment = document.querySelector("input[name='paymentMethod']:checked")?.value || "cod";
    const notes   = document.getElementById("co-notes").value.trim();

    if (!name || !phone || !address || !city) {
      errEl.textContent = "Please fill in all required fields.";
      errEl.style.display = "block";
      return;
    }
    if (!/^0\d{9,10}$/.test(phone.replace(/[-\s]/g, ""))) {
      errEl.textContent = "Enter a valid Pakistani phone number (e.g. 03001234567).";
      errEl.style.display = "block";
      return;
    }

    const btn = document.getElementById("placeOrderBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order…';

    try {
      const order = await OrdersAPI.place({
        name, phone, address, city,
        paymentMethod: payment,
        notes: notes || null,
        promoCode: promoApplied ? promoCode : null,
      });

      // Save order ID for tracking
      const saved = JSON.parse(localStorage.getItem("hw_orders") || "[]");
      saved.unshift(order._id);
      localStorage.setItem("hw_orders", JSON.stringify(saved.slice(0, 20)));

      // Clear cart
      enrichedItems = [];
      Cart.items = [];
      Cart.save();

      // Close checkout, show success
      document.getElementById("checkoutModal").classList.remove("show");
      const shortId = String(order._id).slice(-8).toUpperCase();
      document.getElementById("successOrderId").textContent = `Order ID: #${shortId}`;
      document.getElementById("orderSuccessModal").classList.add("show");

      renderCartItems();
    } catch (err) {
      errEl.textContent = "Failed to place order: " + err.message;
      errEl.style.display = "block";
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
    }
  });
}
