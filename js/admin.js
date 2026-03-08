// ============================================================
// ADMIN DASHBOARD SCRIPTS
// ============================================================
let adminProducts = [];
let adminOrders = [];

document.addEventListener("DOMContentLoaded", async () => {
  // Redirect if not admin
  if (!Auth.isAdmin()) {
    showLoginModal();
    return;
  }
  initAdmin();
});

async function initAdmin() {
  setupTabs();
  await Promise.all([loadStats(), loadProducts(), loadOrders(), loadUsers()]);
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function showLoginModal() {
  document.getElementById("adminContent").style.display = "none";
  document.getElementById("loginModal").classList.add("show");

  document.getElementById("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const errEl = document.getElementById("loginError");
    try {
      await AuthAPI.login(email, password);
      if (!Auth.isAdmin()) {
        Auth.logout();
        errEl.textContent = "Admin access required.";
        return;
      }
      document.getElementById("loginModal").classList.remove("show");
      document.getElementById("adminContent").style.display = "block";
      initAdmin();
    } catch (e) {
      errEl.textContent = e.message || "Login failed";
    }
  });
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".admin-tab-panel").forEach(p => p.style.display = "none");
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).style.display = "block";
    });
  });
  // Show first tab
  document.querySelector(".admin-tab-btn")?.click();
}

// ── Stats ─────────────────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const s = await apiFetch("/admin/stats");
    document.getElementById("statProducts").textContent = s.totalProducts;
    document.getElementById("statOrders").textContent = s.totalOrders;
    document.getElementById("statUsers").textContent = s.totalUsers;
    document.getElementById("statRevenue").textContent = "Rs. " + Math.round(s.revenue).toLocaleString("en-PK");

    // Low stock alerts
    const lowEl = document.getElementById("lowStockList");
    if (lowEl) {
      lowEl.innerHTML = s.lowStock.length === 0
        ? "<p style='color:var(--gray-400)'>No low stock items.</p>"
        : s.lowStock.map(p => `<div class="low-stock-row"><span>${p.name}</span><span class="badge-warning">${p.stock} left</span></div>`).join("");
    }
  } catch (e) { console.error("Stats error", e); }
}

// ── Products ──────────────────────────────────────────────────────────────────
async function loadProducts() {
  try {
    const data = await apiFetch("/products?limit=100");
    adminProducts = data.products || [];
    renderAdminProducts();
  } catch (e) { console.error("Products error", e); }
}

function renderAdminProducts() {
  const tbody = document.getElementById("productsTable");
  if (!tbody) return;
  tbody.innerHTML = adminProducts.map(p => `
    <tr>
      <td>${p.id}</td>
      <td><img src="${p.image}" onerror="this.src=''" style="width:36px;height:36px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:8px;">${p.name}</td>
      <td>${p.categoryName}</td>
      <td>Rs. ${p.price.toLocaleString()}</td>
      <td><span class="stock-badge ${p.stock < 10 ? "low" : ""}">${p.stock}</span></td>
      <td>${p.featured ? "★" : ""} ${p.onSale ? "Sale" : ""} ${p.isNew ? "New" : ""}</td>
      <td>
        <button class="btn-sm btn-edit" onclick="openEditProduct(${p.id})"><i class="fas fa-edit"></i></button>
        <button class="btn-sm btn-delete" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join("");
}

function openAddProduct() {
  document.getElementById("productFormTitle").textContent = "Add Product";
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  document.getElementById("productModal").classList.add("show");
}

function openEditProduct(id) {
  const p = adminProducts.find(x => x.id === id);
  if (!p) return;
  document.getElementById("productFormTitle").textContent = "Edit Product";
  document.getElementById("productId").value = p.id;
  document.getElementById("pName").value = p.name;
  document.getElementById("pCategory").value = p.category;
  document.getElementById("pPrice").value = p.price;
  document.getElementById("pOriginalPrice").value = p.originalPrice || "";
  document.getElementById("pStock").value = p.stock;
  document.getElementById("pBrand").value = p.brand;
  document.getElementById("pImage").value = p.image;
  document.getElementById("pDescription").value = p.description;
  document.getElementById("pFeatured").checked = p.featured;
  document.getElementById("pOnSale").checked = p.onSale;
  document.getElementById("pIsNew").checked = p.isNew;
  document.getElementById("productModal").classList.add("show");
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("productForm");
  if (!form) return;
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const id = document.getElementById("productId").value;
    const body = {
      name: document.getElementById("pName").value,
      category: document.getElementById("pCategory").value,
      price: +document.getElementById("pPrice").value,
      originalPrice: +document.getElementById("pOriginalPrice").value || null,
      stock: +document.getElementById("pStock").value,
      brand: document.getElementById("pBrand").value,
      image: document.getElementById("pImage").value,
      description: document.getElementById("pDescription").value,
      featured: document.getElementById("pFeatured").checked,
      onSale: document.getElementById("pOnSale").checked,
      isNew: document.getElementById("pIsNew").checked,
    };
    try {
      if (id) {
        await apiFetch(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await apiFetch("/products", { method: "POST", body: JSON.stringify(body) });
      }
      document.getElementById("productModal").classList.remove("show");
      await loadProducts();
      await loadStats();
    } catch (e) { alert("Save failed: " + e.message); }
  });
});

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  try {
    await apiFetch(`/products/${id}`, { method: "DELETE" });
    await loadProducts();
    await loadStats();
  } catch (e) { alert("Delete failed: " + e.message); }
}

// ── Orders ────────────────────────────────────────────────────────────────────
async function loadOrders() {
  try {
    const data = await apiFetch("/admin/orders?limit=50");
    adminOrders = data.orders || [];
    renderAdminOrders();
  } catch (e) { console.error("Orders error", e); }
}

function renderAdminOrders() {
  const tbody = document.getElementById("ordersTable");
  if (!tbody) return;
  tbody.innerHTML = adminOrders.map(o => {
    const shortId = String(o._id).slice(-8).toUpperCase();
    return `
    <tr>
      <td>#${shortId}</td>
      <td>${o.name || "Guest"}</td>
      <td>${o.items?.length || 0} items</td>
      <td>Rs. ${Math.round(o.total).toLocaleString("en-PK")}</td>
      <td><span class="status-badge status-${o.status}">${o.status}</span></td>
      <td>${new Date(o.createdAt).toLocaleDateString("en-PK")}</td>
      <td>
        <select class="status-select" onchange="updateOrderStatus('${o._id}', this.value)">
          ${["pending","processing","shipped","delivered","cancelled"].map(s =>
            `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`
          ).join("")}
        </select>
      </td>
    </tr>`;
  }).join("");
}

async function updateOrderStatus(id, status) {
  try {
    await apiFetch(`/admin/orders/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
    const o = adminOrders.find(x => x._id === id);
    if (o) o.status = status;
  } catch (e) { alert("Update failed: " + e.message); }
}

// ── Users ─────────────────────────────────────────────────────────────────────
async function loadUsers() {
  try {
    const users = await apiFetch("/admin/users");
    const tbody = document.getElementById("usersTable");
    if (!tbody) return;
    tbody.innerHTML = users.map(u => `
      <tr>
        <td style="font-size:11px;color:var(--gray-400);">${String(u._id).slice(-6)}</td>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td><span class="role-badge role-${u.role}">${u.role}</span></td>
        <td>${new Date(u.createdAt).toLocaleDateString("en-PK")}</td>
      </tr>`).join("");
  } catch (e) { console.error("Users error", e); }
}

function logoutAdmin() {
  Auth.logout();
  window.location.href = "index.html";
}
