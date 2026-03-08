// ============================================================
// PRODUCTS PAGE SCRIPTS
// ============================================================
let filteredProducts = [];
let activeCategories = new Set();
let maxPrice = 12000;
let minRating = 0;
let searchQuery = "";
let sortBy = "default";
let showOnSale = false;
let showNew = false;
const PAGE_SIZE = 9;
let currentPage = 1;

document.addEventListener("DOMContentLoaded", async () => {
  readUrlParams();
  await buildCategoryFilters();
  buildPriceFilter();
  buildRatingFilters();
  bindToolbar();
  await applyFilters();
  highlightNavLink();
});

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("category");
  if (cat) activeCategories.add(cat);
  const q = params.get("q");
  if (q) { searchQuery = q; const el = document.getElementById("productSearch"); if (el) el.value = q; }
}

async function buildCategoryFilters() {
  const container = document.getElementById("catFilters");
  if (!container) return;

  let cats;
  try {
    cats = await ProductsAPI.getCategories();
  } catch {
    cats = CATEGORIES.map(c => ({ ...c, count: PRODUCTS.filter(p => p.category === c.id).length }));
  }

  container.innerHTML = cats.map(cat => {
    const checked = activeCategories.has(cat.id) ? "checked" : "";
    return `
      <label class="filter-option">
        <input type="checkbox" value="${cat.id}" ${checked} onchange="onCategoryChange(this)">
        <i class="fas ${cat.icon}" style="color:${cat.color};width:16px;"></i>
        ${cat.name}
        <span class="filter-count">${cat.count}</span>
      </label>`;
  }).join("");
}

function buildPriceFilter() {
  const slider = document.getElementById("priceSlider");
  const display = document.getElementById("priceDisplay");
  if (!slider) return;
  slider.max = 12000;
  slider.value = maxPrice;
  display.textContent = formatPrice(maxPrice);
  slider.addEventListener("input", () => {
    maxPrice = parseInt(slider.value);
    display.textContent = formatPrice(maxPrice);
    applyFilters();
  });
}

function buildRatingFilters() {
  const container = document.getElementById("ratingFilters");
  if (!container) return;
  container.innerHTML = [5,4,3,2,1].map(r => `
    <label class="rating-option">
      <input type="radio" name="rating" value="${r}" onchange="onRatingChange(${r})">
      <span class="stars">${renderStars(r)}</span>
      <span style="font-size:13px;color:var(--gray-500);">&amp; Up</span>
    </label>`).join("");
}

function onCategoryChange(checkbox) {
  if (checkbox.checked) activeCategories.add(checkbox.value);
  else activeCategories.delete(checkbox.value);
  currentPage = 1;
  applyFilters();
}

function onRatingChange(rating) {
  minRating = rating;
  currentPage = 1;
  applyFilters();
}

function bindToolbar() {
  const search = document.getElementById("productSearch");
  const sort = document.getElementById("sortSelect");
  const clearBtn = document.getElementById("clearFilters");

  search && search.addEventListener("input", () => {
    searchQuery = search.value.trim().toLowerCase();
    currentPage = 1;
    applyFilters();
  });

  sort && sort.addEventListener("change", () => {
    sortBy = sort.value;
    applyFilters();
  });

  clearBtn && clearBtn.addEventListener("click", () => {
    activeCategories.clear();
    maxPrice = 12000; minRating = 0; searchQuery = ""; sortBy = "default";
    showOnSale = false; showNew = false;
    document.querySelectorAll("#catFilters input").forEach(cb => cb.checked = false);
    document.querySelectorAll("#ratingFilters input").forEach(rb => rb.checked = false);
    const s = document.getElementById("productSearch"); if (s) s.value = "";
    const pr = document.getElementById("priceSlider"); if (pr) { pr.value = 12000; document.getElementById("priceDisplay").textContent = formatPrice(12000); }
    const so = document.getElementById("sortSelect"); if (so) so.value = "default";
    currentPage = 1;
    applyFilters();
  });

  // Mobile filter toggle
  const filterToggle = document.getElementById("filterToggle");
  const sidebar = document.getElementById("sidebar");
  filterToggle && filterToggle.addEventListener("click", () => {
    sidebar && sidebar.classList.toggle("show");
  });
}

async function applyFilters() {
  const params = {};
  if (activeCategories.size === 1) params.category = [...activeCategories][0];
  if (searchQuery) params.search = searchQuery;
  if (sortBy !== "default") params.sort = sortBy;
  if (maxPrice < 12000) params.max_price = maxPrice;

  let list;
  try {
    if (IS_SERVER) {
      const data = await ProductsAPI.getAll({ ...params, limit: 200 });
      list = data.products || [];
    } else {
      throw new Error("fallback");
    }
  } catch {
    list = [...PRODUCTS];
    if (activeCategories.size > 0) list = list.filter(p => activeCategories.has(p.category));
    list = list.filter(p => p.price <= maxPrice);
  }

  // Apply client-side filters not handled by API
  if (activeCategories.size > 1) list = list.filter(p => activeCategories.has(p.category));
  if (minRating > 0) list = list.filter(p => p.rating >= minRating);
  if (!IS_SERVER && searchQuery) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(searchQuery) ||
      p.categoryName.toLowerCase().includes(searchQuery) ||
      p.brand.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery)
    );
  }
  if (!IS_SERVER) {
    switch (sortBy) {
      case "price-asc":  list.sort((a,b) => a.price - b.price); break;
      case "price-desc": list.sort((a,b) => b.price - a.price); break;
      case "rating":     list.sort((a,b) => b.rating - a.rating); break;
      case "name":       list.sort((a,b) => a.name.localeCompare(b.name)); break;
      case "newest":     list.sort((a,b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
    }
  }

  filteredProducts = list;
  renderProducts();
  renderPagination();
}

function renderProducts() {
  const grid = document.getElementById("productsGrid");
  const countEl = document.getElementById("productsCount");
  if (!grid) return;

  const total = filteredProducts.length;
  const start = (currentPage - 1) * PAGE_SIZE;
  const page = filteredProducts.slice(start, start + PAGE_SIZE);

  if (countEl) countEl.textContent = total === 0 ? "No products found" :
    `Showing ${start + 1}–${Math.min(start + page.length, total)} of ${total} products`;

  if (page.length === 0) {
    grid.innerHTML = `<div class="no-products"><i class="fas fa-box-open"></i><p>No products match your filters.</p><button class="btn btn-outline btn-sm" onclick="document.getElementById('clearFilters').click()">Clear Filters</button></div>`;
    return;
  }
  grid.innerHTML = page.map(buildProductCard).join("");
}

function renderPagination() {
  const container = document.getElementById("pagination");
  if (!container) return;
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  if (totalPages <= 1) { container.innerHTML = ""; return; }

  let html = `<button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}><i class="fas fa-chevron-left"></i></button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      html += `<button class="page-btn ${i === currentPage ? "active" : ""}" onclick="goPage(${i})">${i}</button>`;
    } else if (Math.abs(i - currentPage) === 2) {
      html += `<span class="page-dots">…</span>`;
    }
  }
  html += `<button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}><i class="fas fa-chevron-right"></i></button>`;
  container.innerHTML = html;
}

function goPage(page) {
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderProducts();
  renderPagination();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function highlightNavLink() {
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("href") && window.location.pathname.endsWith(link.getAttribute("href").split("?")[0])) {
      link.classList.add("active");
    }
  });
  const productsLink = document.querySelector('.nav-link[href="products.html"]');
  if (productsLink) productsLink.classList.add("active");
}
