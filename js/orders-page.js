// ============================================================
// ORDERS PAGE — Track & view placed orders
// ============================================================

const STATUS_STEPS = ["pending", "processing", "shipped", "delivered"];

const STATUS_ICONS = {
  pending:    "fa-clock",
  processing: "fa-gear",
  shipped:    "fa-truck",
  delivered:  "fa-circle-check",
  cancelled:  "fa-ban",
};

const PAYMENT_LABELS = {
  cod:       "Cash on Delivery",
  jazzcash:  "JazzCash",
  easypaisa: "EasyPaisa",
};

document.addEventListener("DOMContentLoaded", async () => {
  if (!IS_SERVER) {
    renderNoOrders("Start the server (npm start) to view your orders.");
    return;
  }
  await loadOrders();
});

async function loadOrders() {
  const savedIds = JSON.parse(localStorage.getItem("hw_orders") || "[]");

  if (savedIds.length === 0) {
    renderNoOrders();
    return;
  }

  const orders = [];
  for (const id of savedIds) {
    try {
      const order = await apiFetch(`/orders/${id}`);
      orders.push(order);
    } catch {
      // skip inaccessible orders
    }
  }

  if (orders.length === 0) {
    renderNoOrders();
    return;
  }

  document.getElementById("ordersContainer").innerHTML =
    orders.map(renderOrderCard).join("");
}

async function trackById() {
  const input = document.getElementById("trackInput");
  const raw   = input.value.trim();
  if (!raw) return;

  // Accept both full ID and short 8-char suffix
  let order = null;
  try {
    // Try as full MongoDB ObjectId first
    order = await apiFetch(`/orders/${raw}`);
  } catch {
    // Try matching by short ID suffix from saved orders
    const savedIds = JSON.parse(localStorage.getItem("hw_orders") || "[]");
    const match = savedIds.find(id => id.slice(-8).toUpperCase() === raw.toUpperCase());
    if (match) {
      try { order = await apiFetch(`/orders/${match}`); } catch {}
    }
  }

  if (!order) {
    const container = document.getElementById("ordersContainer");
    container.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:32px;text-align:center;box-shadow:var(--shadow-sm);">
        <i class="fas fa-magnifying-glass" style="font-size:36px;color:var(--gray-300);margin-bottom:12px;display:block;"></i>
        <p style="color:var(--gray-500);font-size:14px;">Order not found. Make sure the ID is correct.</p>
        <button class="btn btn-outline" style="margin-top:16px;" onclick="loadOrders()">
          <i class="fas fa-arrow-left"></i> Back to My Orders
        </button>
      </div>`;
    return;
  }

  document.getElementById("ordersContainer").innerHTML =
    renderOrderCard(order) +
    `<div style="text-align:center;margin-top:12px;">
       <button class="btn btn-outline" onclick="loadOrders()"><i class="fas fa-arrow-left"></i> Back to All Orders</button>
     </div>`;
}

function renderOrderCard(order) {
  const shortId  = String(order._id).slice(-8).toUpperCase();
  const date     = new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  const isCancelled = order.status === "cancelled";

  return `
  <div class="order-card">

    <!-- Header -->
    <div class="order-card-header">
      <div>
        <div class="order-id"><i class="fas fa-box" style="color:var(--primary);margin-right:6px;"></i>Order #${shortId}</div>
        <div class="order-date"><i class="fas fa-calendar" style="margin-right:4px;"></i>${date}</div>
      </div>
      <span class="order-status-badge status-${order.status}">${order.status}</span>
    </div>

    <!-- Timeline -->
    ${isCancelled ? renderCancelledBanner() : renderTimeline(order.status)}

    <!-- Items -->
    <div class="order-items">
      <div class="order-info-title" style="padding-bottom:8px;">Items Ordered</div>
      ${(order.items || []).map(item => `
        <div class="order-item">
          <i class="fas fa-box" style="color:var(--gray-300);font-size:20px;flex-shrink:0;"></i>
          <div style="flex:1;min-width:0;">
            <div class="order-item-name">${item.name}</div>
            <div class="order-item-qty">Qty: ${item.quantity} &times; ${formatPrice(item.price)}</div>
          </div>
          <div class="order-item-price">${formatPrice(item.price * item.quantity)}</div>
        </div>`).join("")}
    </div>

    <!-- Delivery info + Price breakdown -->
    <div class="order-footer">
      <div class="order-info-block">
        <div class="order-info-title">Delivery Information</div>
        ${order.name    ? `<div class="order-info-row"><i class="fas fa-user"></i><span>${order.name}</span></div>` : ""}
        ${order.phone   ? `<div class="order-info-row"><i class="fas fa-phone"></i><span>${order.phone}</span></div>` : ""}
        ${order.address ? `<div class="order-info-row"><i class="fas fa-location-dot"></i><span>${order.address}${order.city ? ", " + order.city : ""}</span></div>` : ""}
        ${order.paymentMethod ? `<div class="order-info-row"><i class="fas fa-credit-card"></i><span>${PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span></div>` : ""}
        ${order.notes   ? `<div class="order-info-row"><i class="fas fa-note-sticky"></i><span>${order.notes}</span></div>` : ""}
      </div>
      <div class="order-info-block">
        <div class="order-info-title">Price Breakdown</div>
        <div class="order-total-row"><span>Subtotal</span><span>${formatPrice(order.subtotal)}</span></div>
        ${order.discount > 0 ? `<div class="order-total-row"><span>Discount</span><span style="color:var(--success);">−${formatPrice(order.discount)}</span></div>` : ""}
        <div class="order-total-row"><span>Shipping</span><span>${order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</span></div>
        <div class="order-total-row"><span>GST (5%)</span><span>${formatPrice(order.tax)}</span></div>
        <div class="order-total-row grand"><span>Total Paid</span><span>${formatPrice(order.total)}</span></div>
      </div>
    </div>

  </div>`;
}

function renderTimeline(currentStatus) {
  const steps = [
    { key: "pending",    label: "Order Placed", icon: "fa-clock" },
    { key: "processing", label: "Processing",   icon: "fa-gear" },
    { key: "shipped",    label: "Shipped",      icon: "fa-truck" },
    { key: "delivered",  label: "Delivered",    icon: "fa-circle-check" },
  ];

  const currentIdx = STATUS_STEPS.indexOf(currentStatus);

  let html = '<div class="order-timeline">';
  steps.forEach((step, i) => {
    let cls = "pending";
    if (i < currentIdx)  cls = "done";
    if (i === currentIdx) cls = "active";

    html += `<div class="timeline-step">
      <div class="timeline-icon ${cls}"><i class="fas ${step.icon}"></i></div>
      <div class="timeline-label">${step.label}</div>
    </div>`;

    if (i < steps.length - 1) {
      html += `<div class="timeline-connector ${i < currentIdx ? "done" : "pending"}"></div>`;
    }
  });
  html += "</div>";
  return html;
}

function renderCancelledBanner() {
  return `<div style="background:#fee2e2;padding:12px 24px;display:flex;align-items:center;gap:10px;color:#991b1b;font-size:13px;font-weight:600;border-bottom:1px solid var(--gray-100);">
    <i class="fas fa-ban"></i> This order was cancelled.
  </div>`;
}

function renderNoOrders(msg) {
  document.getElementById("ordersContainer").innerHTML = `
    <div class="no-orders">
      <i class="fas fa-box-open"></i>
      <h3>No Orders Yet</h3>
      <p>${msg || "You haven't placed any orders. Start shopping!"}</p>
      <a href="products.html" class="btn btn-primary"><i class="fas fa-store"></i> Browse Products</a>
    </div>`;
}
