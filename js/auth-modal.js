// ============================================================
// AUTH MODAL — Login / Register for all pages
// Depends on: api.js (Auth, AuthAPI must be loaded first)
// ============================================================
(function () {
  "use strict";

  // ── CSS ──────────────────────────────────────────────────────
  const css = `
    #authModalOverlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,.55); z-index: 2000;
      align-items: center; justify-content: center; padding: 16px;
    }
    #authModalOverlay.open { display: flex; }
    .auth-box {
      background: #fff; border-radius: 18px; padding: 36px 32px;
      width: 100%; max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
      position: relative; animation: authFadeIn .22s ease;
    }
    @keyframes authFadeIn {
      from { opacity: 0; transform: translateY(-14px) scale(.97); }
      to   { opacity: 1; transform: translateY(0)     scale(1);   }
    }
    @media (max-width: 480px) { .auth-box { padding: 28px 18px; } }

    .auth-close {
      position: absolute; top: 14px; right: 14px;
      background: none; border: none; cursor: pointer;
      color: #94a3b8; font-size: 18px; line-height: 1;
      padding: 4px 6px; border-radius: 6px; transition: color .15s;
    }
    .auth-close:hover { color: #0f172a; }

    .auth-logo {
      width: 48px; height: 48px; background: #e05c1a; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 20px; margin: 0 auto 12px;
    }
    .auth-title {
      text-align: center; font-size: 20px; font-weight: 700;
      color: #0f172a; margin-bottom: 4px;
    }
    .auth-sub {
      text-align: center; font-size: 13px; color: #64748b; margin-bottom: 22px;
    }

    .auth-tabs {
      display: flex; background: #f1f5f9; border-radius: 10px;
      padding: 4px; margin-bottom: 22px;
    }
    .auth-tab-btn {
      flex: 1; padding: 8px 0; border: none; background: none; border-radius: 8px;
      font-size: 14px; font-weight: 600; cursor: pointer; color: #64748b;
      font-family: inherit; transition: all .15s;
    }
    .auth-tab-btn.active {
      background: #fff; color: #0f172a;
      box-shadow: 0 1px 4px rgba(0,0,0,.1);
    }

    .auth-group { margin-bottom: 15px; }
    .auth-group label {
      display: block; font-size: 13px; font-weight: 600;
      color: #374151; margin-bottom: 5px;
    }
    .auth-group input {
      width: 100%; padding: 11px 14px; border: 1.5px solid #e2e8f0;
      border-radius: 10px; font-size: 14px; font-family: inherit;
      box-sizing: border-box; outline: none; transition: border-color .15s;
      color: #0f172a;
    }
    .auth-group input:focus { border-color: #e05c1a; }

    .auth-error {
      color: #dc2626; font-size: 13px; margin: -4px 0 10px; min-height: 18px;
    }
    .auth-btn {
      width: 100%; padding: 12px; background: #e05c1a; color: #fff;
      border: none; border-radius: 10px; font-size: 15px; font-weight: 700;
      cursor: pointer; font-family: inherit; transition: background .15s; margin-top: 4px;
    }
    .auth-btn:hover:not(:disabled) { background: #c44d14; }
    .auth-btn:disabled { background: #f4a27b; cursor: not-allowed; }

    .auth-switch {
      text-align: center; font-size: 13px; color: #64748b; margin-top: 16px;
    }
    .auth-switch span {
      color: #e05c1a; font-weight: 600; cursor: pointer; text-decoration: none;
    }
    .auth-switch span:hover { text-decoration: underline; }

    /* Avatar in navbar */
    .account-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: #e05c1a;
      color: #fff; font-size: 13px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }

    /* Dropdown */
    #acctDropdown {
      display: none; position: fixed; z-index: 1999;
      background: #fff; border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,.15), 0 0 0 1px rgba(0,0,0,.05);
      min-width: 224px; padding: 6px 0; overflow: hidden;
    }
    #acctDropdown.open { display: block; }

    .acct-drop-hdr {
      padding: 14px 16px 10px; display: flex; align-items: center; gap: 10px;
    }
    .acct-drop-av {
      width: 38px; height: 38px; border-radius: 50%; background: #e05c1a;
      color: #fff; font-size: 15px; font-weight: 700; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .acct-drop-name  { font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.3; }
    .acct-drop-email { font-size: 12px; color: #94a3b8; word-break: break-all; }
    .acct-drop-div   { height: 1px; background: #f1f5f9; margin: 4px 0; }

    .acct-drop-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 16px;
      font-size: 14px; color: #374151; text-decoration: none; cursor: pointer;
      background: none; border: none; width: 100%; text-align: left;
      font-family: inherit; transition: background .1s;
    }
    .acct-drop-item:hover { background: #f8fafc; color: #e05c1a; }
    .acct-drop-item i { width: 16px; color: #94a3b8; font-size: 13px; }
    .acct-drop-item:hover i { color: #e05c1a; }

    .acct-drop-logout { color: #dc2626; }
    .acct-drop-logout i { color: #fca5a5; }
    .acct-drop-logout:hover { background: #fff5f5; color: #dc2626; }
    .acct-drop-logout:hover i { color: #dc2626; }
  `;

  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── HTML Template ─────────────────────────────────────────────
  const tpl = `
  <div id="authModalOverlay">
    <div class="auth-box">
      <button class="auth-close" id="authClose" type="button">
        <i class="fas fa-times"></i>
      </button>
      <div class="auth-logo"><i class="fas fa-hammer"></i></div>
      <div class="auth-title" id="authTitle">Welcome Back</div>
      <div class="auth-sub"   id="authSub">Sign in to your IronCraft account</div>

      <div class="auth-tabs">
        <button class="auth-tab-btn active" id="authTabLogin"    type="button">Login</button>
        <button class="auth-tab-btn"        id="authTabRegister" type="button">Register</button>
      </div>

      <!-- Login Panel -->
      <div id="authPanelLogin">
        <form id="authFormLogin" autocomplete="on">
          <div class="auth-group">
            <label for="aLoginEmail">Email Address</label>
            <input type="email" id="aLoginEmail" placeholder="you@example.com"
              autocomplete="email" required>
          </div>
          <div class="auth-group">
            <label for="aLoginPass">Password</label>
            <input type="password" id="aLoginPass" placeholder="••••••••"
              autocomplete="current-password" required>
          </div>
          <div class="auth-error" id="aLoginErr"></div>
          <button type="submit" class="auth-btn" id="aLoginBtn">
            <i class="fas fa-sign-in-alt"></i> Login
          </button>
        </form>
        <div class="auth-switch">
          Don't have an account? <span id="toRegister">Create one</span>
        </div>
      </div>

      <!-- Register Panel -->
      <div id="authPanelRegister" style="display:none;">
        <form id="authFormRegister" autocomplete="on">
          <div class="auth-group">
            <label for="aRegName">Full Name</label>
            <input type="text" id="aRegName" placeholder="Muhammad Ahmad"
              autocomplete="name" required>
          </div>
          <div class="auth-group">
            <label for="aRegEmail">Email Address</label>
            <input type="email" id="aRegEmail" placeholder="you@example.com"
              autocomplete="email" required>
          </div>
          <div class="auth-group">
            <label for="aRegPass">Password</label>
            <input type="password" id="aRegPass" placeholder="Min. 6 characters"
              autocomplete="new-password" required>
          </div>
          <div class="auth-group">
            <label for="aRegConfirm">Confirm Password</label>
            <input type="password" id="aRegConfirm" placeholder="••••••••"
              autocomplete="new-password" required>
          </div>
          <div class="auth-error" id="aRegErr"></div>
          <button type="submit" class="auth-btn" id="aRegBtn">
            <i class="fas fa-user-plus"></i> Create Account
          </button>
        </form>
        <div class="auth-switch">
          Already have an account? <span id="toLogin">Login</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Account Dropdown -->
  <div id="acctDropdown">
    <div class="acct-drop-hdr">
      <div class="acct-drop-av" id="acctDropAv"></div>
      <div>
        <div class="acct-drop-name"  id="acctDropName"></div>
        <div class="acct-drop-email" id="acctDropEmail"></div>
      </div>
    </div>
    <div class="acct-drop-div"></div>
    <a href="orders.html" class="acct-drop-item">
      <i class="fas fa-box"></i> My Orders
    </a>
    <a href="admin.html" class="acct-drop-item" id="acctDropAdmin" style="display:none;">
      <i class="fas fa-shield-halved"></i> Admin Dashboard
    </a>
    <div class="acct-drop-div"></div>
    <button class="acct-drop-item acct-drop-logout" id="acctDropLogout" type="button">
      <i class="fas fa-sign-out-alt"></i> Logout
    </button>
  </div>
  `;

  // ── Helpers ───────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }

  function openModal(tab) {
    $("authModalOverlay").classList.add("open");
    switchTab(tab || "login");
  }

  function closeModal() {
    $("authModalOverlay").classList.remove("open");
    $("aLoginErr").textContent = "";
    $("aRegErr").textContent = "";
    $("authFormLogin").reset();
    $("authFormRegister").reset();
  }

  function switchTab(tab) {
    const isLogin = tab === "login";
    $("authPanelLogin").style.display    = isLogin ? "block" : "none";
    $("authPanelRegister").style.display = isLogin ? "none"  : "block";
    $("authTabLogin").classList.toggle("active",    isLogin);
    $("authTabRegister").classList.toggle("active", !isLogin);
    $("authTitle").textContent = isLogin ? "Welcome Back"    : "Create Account";
    $("authSub").textContent   = isLogin
      ? "Sign in to your IronCraft account"
      : "Join IronCraft Hardware today";
  }

  // Mark account buttons with data attribute for reliable selection
  function tagAcctBtns() {
    document.querySelectorAll("a.navbar-action-btn").forEach(btn => {
      const isCart = btn.title === "Cart" || !!btn.querySelector(".fa-cart-shopping");
      if (!isCart) btn.setAttribute("data-acct-btn", "1");
    });
  }

  function updateAcctBtns() {
    if (typeof Auth === "undefined") return;
    const user = Auth.getUser();

    document.querySelectorAll("[data-acct-btn]").forEach(btn => {
      if (user) {
        const initial = user.name.charAt(0).toUpperCase();
        btn.innerHTML = `<div class="account-avatar">${initial}</div>`;
        btn.title = user.name;
        btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); toggleDropdown(btn); };
      } else {
        btn.innerHTML = `<i class="fas fa-user"></i>`;
        btn.title = "Account";
        btn.onclick = (e) => { e.preventDefault(); openModal("login"); };
      }
    });

    // Populate dropdown header
    if (user) {
      $("acctDropAv").textContent    = user.name.charAt(0).toUpperCase();
      $("acctDropName").textContent  = user.name;
      $("acctDropEmail").textContent = user.email;
      $("acctDropAdmin").style.display = user.role === "admin" ? "flex" : "none";
    }
  }

  function toggleDropdown(btn) {
    const drop = $("acctDropdown");
    if (drop.classList.contains("open")) { drop.classList.remove("open"); return; }
    const r = btn.getBoundingClientRect();
    drop.style.top   = (r.bottom + 6) + "px";
    drop.style.right = (window.innerWidth - r.right) + "px";
    drop.style.left  = "auto";
    drop.classList.add("open");
  }

  function showToast(msg) {
    if (typeof Cart !== "undefined" && Cart.showToast) Cart.showToast(msg);
  }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    tagAcctBtns();
    updateAcctBtns();

    // Close modal
    $("authClose").onclick = closeModal;
    $("authModalOverlay").onclick = (e) => {
      if (e.target === $("authModalOverlay")) closeModal();
    };
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    // Tab switches
    $("authTabLogin").onclick    = () => switchTab("login");
    $("authTabRegister").onclick = () => switchTab("register");
    $("toRegister").onclick      = () => switchTab("register");
    $("toLogin").onclick         = () => switchTab("login");

    // ── Login submit ───────────────────────────────────────────
    $("authFormLogin").onsubmit = async (e) => {
      e.preventDefault();
      const btn = $("aLoginBtn");
      const err = $("aLoginErr");
      err.textContent = "";
      btn.disabled = true;
      btn.textContent = "Logging in…";
      try {
        await AuthAPI.login(
          $("aLoginEmail").value.trim(),
          $("aLoginPass").value
        );
        closeModal();
        updateAcctBtns();
        showToast(`Welcome back, <strong>${Auth.getUser().name}</strong>!`);
      } catch (ex) {
        err.textContent = ex.message || "Login failed. Please try again.";
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
      }
    };

    // ── Register submit ────────────────────────────────────────
    $("authFormRegister").onsubmit = async (e) => {
      e.preventDefault();
      const btn     = $("aRegBtn");
      const err     = $("aRegErr");
      const pass    = $("aRegPass").value;
      const confirm = $("aRegConfirm").value;
      err.textContent = "";
      if (pass !== confirm) { err.textContent = "Passwords do not match."; return; }
      if (pass.length < 6)  { err.textContent = "Password must be at least 6 characters."; return; }
      btn.disabled = true;
      btn.textContent = "Creating account…";
      try {
        await AuthAPI.register(
          $("aRegName").value.trim(),
          $("aRegEmail").value.trim(),
          pass
        );
        closeModal();
        updateAcctBtns();
        showToast(`Welcome, <strong>${Auth.getUser().name}</strong>! Account created.`);
      } catch (ex) {
        err.textContent = ex.message || "Registration failed. Please try again.";
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
      }
    };

    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
      const drop = $("acctDropdown");
      if (!drop.classList.contains("open")) return;
      if (!drop.contains(e.target) && !e.target.closest("[data-acct-btn]")) {
        drop.classList.remove("open");
      }
    });

    // Logout
    $("acctDropLogout").onclick = () => {
      Auth.logout();
      $("acctDropdown").classList.remove("open");
      updateAcctBtns();
      showToast("Logged out successfully.");
    };

    // React to auth events (e.g. from other scripts)
    window.addEventListener("auth:login",  updateAcctBtns);
    window.addEventListener("auth:logout", updateAcctBtns);
  }

  // ── Bootstrap ─────────────────────────────────────────────────
  function inject() {
    document.body.insertAdjacentHTML("beforeend", tpl);
    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
