// ============================================================
// HOME PAGE SCRIPTS
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    renderCategories(),
    renderFeaturedProducts()
  ]);
  startCountdown();
  renderTestimonials();
  setupNewsletter();
  setupAuthNav();
  highlightNavLink();
});

async function renderCategories() {
  const grid = document.getElementById("categoriesGrid");
  if (!grid) return;
  try {
    const cats = await ProductsAPI.getCategories();
    grid.innerHTML = cats.map(cat => `
      <a href="products.html?category=${cat.id}" class="category-card">
        <div class="category-icon" style="background:${cat.bg};color:${cat.color};">
          <i class="fas ${cat.icon}"></i>
        </div>
        <div class="category-name">${cat.name}</div>
        <div class="category-count">${cat.count} Products</div>
      </a>`).join("");
  } catch {
    // fallback to local data
    grid.innerHTML = CATEGORIES.map(cat => {
      const count = PRODUCTS.filter(p => p.category === cat.id).length;
      return `
        <a href="products.html?category=${cat.id}" class="category-card">
          <div class="category-icon" style="background:${cat.bg};color:${cat.color};">
            <i class="fas ${cat.icon}"></i>
          </div>
          <div class="category-name">${cat.name}</div>
          <div class="category-count">${count} Products</div>
        </a>`;
    }).join("");
  }
}

async function renderFeaturedProducts() {
  const grid = document.getElementById("featuredGrid");
  if (!grid) return;
  try {
    const data = await ProductsAPI.getFeatured();
    const featured = (data.products || data).slice(0, 6);
    grid.innerHTML = featured.map(buildProductCard).join("");
  } catch {
    const featured = PRODUCTS.filter(p => p.featured).slice(0, 6);
    grid.innerHTML = featured.map(buildProductCard).join("");
  }
}

function renderTestimonials() {
  const grid = document.getElementById("testimonialsGrid");
  if (!grid) return;
  grid.innerHTML = TESTIMONIALS.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-stars">${renderStars(t.rating)}</div>
      <p class="testimonial-text">"${t.text}"</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${t.avatar}</div>
        <div>
          <div class="testimonial-name">${t.name}</div>
          <div class="testimonial-role">${t.role}</div>
        </div>
      </div>
    </div>`).join("");
}

// Promo countdown: 2 days from now
function startCountdown() {
  const target = new Date().getTime() + 2 * 24 * 60 * 60 * 1000;
  function tick() {
    const diff = target - new Date().getTime();
    if (diff <= 0) return;
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val).padStart(2, "0"); };
    set("cdDays", d); set("cdHours", h); set("cdMins", m); set("cdSecs", s);
  }
  tick();
  setInterval(tick, 1000);
}

function setupNewsletter() {
  const form = document.getElementById("newsletterForm");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const input = form.querySelector("input");
    if (!input.value.trim()) return;
    Cart.showToast("Thank you for subscribing!");
    input.value = "";
  });
}

function setupAuthNav() {
  if (typeof Auth === "undefined") return;
  const user = Auth.getUser();
  const accountLinks = document.querySelectorAll('a[href="#"][title="Account"], a.navbar-action-btn[title="Account"]');
  if (user) {
    accountLinks.forEach(a => {
      a.title = user.name;
      if (user.role === "admin") {
        a.href = "admin.html";
        a.querySelector("i") && (a.querySelector("i").className = "fas fa-user-shield");
      }
    });
  }
  window.addEventListener("auth:login",  () => setupAuthNav());
  window.addEventListener("auth:logout", () => { accountLinks.forEach(a => { a.href = "#"; a.title = "Account"; }); });
}

function highlightNavLink() {
  const path = window.location.pathname;
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("href") && path.endsWith(link.getAttribute("href").split("?")[0])) {
      link.classList.add("active");
    }
  });
}
