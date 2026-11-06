(() => {
  "use strict";

  const config = window.PERFECT_MENS_CONFIG || {};
  const products = window.PERFECT_MENS_PRODUCTS || [];
  const storageKey = "perfect-mens-wear-order-v1";
  const categories = ["All", ...new Set(products.map((product) => product.category))];
  let cartReadFailed = false;
  let cart = readCart();
  let activeCategory = "All";
  let drawerTrigger = null;

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);

  function readCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved.filter((entry) => {
        const product = products.find((item) => item.id === entry.id);
        return product && product.sizes.includes(entry.size) && Number.isInteger(entry.qty) && entry.qty > 0;
      });
    } catch (error) {
      console.error("Could not read the saved order.", error);
      cartReadFailed = true;
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch (error) {
      console.error("Could not save the order to this browser.", error);
      showToast("Your browser couldn't save this order. Keep this page open while you shop.");
    }
  }

  function renderShell() {
    const activePage = document.body.dataset.page;
    const header = document.querySelector("#site-header");
    const footer = document.querySelector("#site-footer");
    const overlays = document.querySelector("#site-overlays");
    if (!header || !footer || !overlays) return;

    header.innerHTML = `
      <a class="skip-link" href="#main-content">Skip to content</a>
      <header class="site-header">
        <div class="page-width nav-inner">
          <a class="wordmark" href="index.html" aria-label="Perfect Mens Wear home">
            <span class="wordmark-mark">PMW</span>
            <span class="wordmark-copy"><strong>PERFECT</strong><small>MENS WEAR · SINCE 1998</small></span>
          </a>
          <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="Open menu"><span></span><span></span></button>
          <nav class="primary-nav" id="primary-navigation" aria-label="Main navigation">
            <a class="${activePage === "home" ? "is-active" : ""}" href="index.html">Home</a>
            <a class="${activePage === "collection" ? "is-active" : ""}" href="collection.html">Collection</a>
            <a class="${activePage === "contact" ? "is-active" : ""}" href="contact.html">About &amp; contact</a>
            <button class="nav-order cart-open" type="button" aria-label="Open order"><span class="nav-order-label">Your order</span><span class="cart-count" data-cart-count>0</span></button>
          </nav>
        </div>
      </header>`;

    footer.innerHTML = `
      <footer class="site-footer">
        <div class="page-width footer-main">
          <div class="footer-brand"><a class="wordmark wordmark-light" href="index.html"><span class="wordmark-mark">PMW</span><span class="wordmark-copy"><strong>PERFECT</strong><small>MENS WEAR · SINCE 1998</small></span></a><p>Good style, personal service.<br>Serving Purandar since 1998.</p></div>
          <div class="footer-column"><h3>Explore</h3><a href="collection.html">The collection</a><a href="contact.html">Our story</a><a href="contact.html">Get in touch</a></div>
          <div class="footer-column"><h3>Find us</h3><p>Ta. Purandar, Dist. Pune<br>Maharashtra, India</p><a data-contact-phone href="#">Phone details to be added</a><button class="footer-whatsapp whatsapp-action" type="button">Message on WhatsApp ↗</button></div>
          <div class="footer-note"><span class="footer-since">EST. 1998</span><p>Thanks for choosing local.</p><span>परफेक्ट मेन्स वेअर</span></div>
        </div>
        <div class="footer-bottom"><div class="page-width"><span>© <span data-current-year></span> Perfect Mens Wear</span><span>Purandar · Maharashtra</span></div></div>
      </footer>`;

    overlays.innerHTML = `
      <div class="toast-region" aria-live="polite" aria-atomic="true"></div>
      <div class="drawer-backdrop" data-drawer-backdrop hidden></div>
      <aside class="order-drawer" data-order-drawer role="dialog" aria-modal="true" aria-labelledby="drawer-heading" aria-hidden="true">
        <div class="drawer-header"><div><p class="eyebrow">YOUR SELECTION</p><h2 id="drawer-heading">Your order</h2></div><button type="button" class="icon-button drawer-close" aria-label="Close order">×</button></div>
        <div class="drawer-body">
          <div class="cart-items" data-cart-items></div>
          <form class="order-form" data-order-form novalidate>
            <div class="cart-total"><span>Indicative total</span><strong data-cart-total>₹0</strong></div>
            <p class="small-note">We’ll confirm availability and final pricing with you. No online payment is taken.</p>
            <label for="customer-name">Your name</label><input id="customer-name" name="name" autocomplete="name" maxlength="80" required placeholder="e.g. Rahul Pawar">
            <label for="customer-phone">Your phone number</label><input id="customer-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" required placeholder="10-digit mobile number">
            <label for="customer-note">Note <span>(optional)</span></label><textarea id="customer-note" name="note" rows="3" maxlength="300" placeholder="Size, colour, or anything else we should know"></textarea>
            <p class="form-error" data-form-error role="alert"></p>
            <button class="button button-whatsapp button-full" type="submit">Place order on WhatsApp <span aria-hidden="true">↗</span></button>
            <p class="drawer-disclaimer">WhatsApp will open with your message ready. Tap Send there to share it with the store.</p>
          </form>
        </div>
      </aside>`;
    const main = document.querySelector("main");
    if (main) main.id = "main-content";
    document.querySelector("[data-current-year]").textContent = String(new Date().getFullYear());
    applyContactConfig();
  }

  function applyContactConfig() {
    const phone = String(config.phone || "").trim();
    document.querySelectorAll("[data-contact-phone]").forEach((link) => {
      if (/^[+\d\s().-]{7,25}$/.test(phone) && /\d/.test(phone)) {
        link.textContent = phone;
        link.href = `tel:${phone.replace(/[^\d+]/g, "")}`;
      } else {
        link.textContent = "Phone details to be added";
        link.href = "contact.html";
        link.setAttribute("aria-label", "Phone details have not been added yet");
      }
    });
    const hours = String(config.hours || "").trim();
    document.querySelectorAll("[data-contact-hours]").forEach((element) => {
      element.textContent = hours || "Hours to be confirmed";
    });
    const mapLink = document.querySelector("[data-map-link]");
    if (mapLink && config.mapUrl) mapLink.href = config.mapUrl;
  }

  function renderProductCard(product) {
    const sizes = product.sizes.map((size) => `<option value="${escapeHtml(size)}">${escapeHtml(size)}</option>`).join("");
    const tag = product.tag ? `<span class="product-tag">${escapeHtml(product.tag)}</span>` : "";
    const mrp = product.mrp ? `<span class="product-mrp">${formatPrice(product.mrp)}</span>` : "";
    return `
      <article class="product-card">
        <div class="product-image-wrap">
          <img class="product-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.brand)} ${escapeHtml(product.name)}" loading="lazy" decoding="async">
          ${tag}<button class="product-add" type="button" data-add-product="${escapeHtml(product.id)}" aria-label="Add ${escapeHtml(product.name)} to your order">+</button>
        </div>
        <div class="product-meta"><span>${escapeHtml(product.brand)}</span><span>${escapeHtml(product.category)}</span></div>
        <h3>${escapeHtml(product.name)}</h3>
        <div class="product-price"><strong>${formatPrice(product.price)}</strong>${mrp}</div>
        <div class="product-card-actions"><label class="sr-only" for="size-${escapeHtml(product.id)}">Size for ${escapeHtml(product.name)}</label><select id="size-${escapeHtml(product.id)}" data-product-size="${escapeHtml(product.id)}">${sizes}</select><button class="add-button" type="button" data-add-product="${escapeHtml(product.id)}">Add to order <span aria-hidden="true">+</span></button></div>
      </article>`;
  }

  function renderProducts() {
    document.querySelectorAll("[data-product-list]").forEach((list) => {
      const type = list.dataset.productList;
      let visible = type === "featured" ? products.slice(0, Number(list.dataset.limit || 4)) : products;
      if (type !== "featured" && activeCategory !== "All") visible = visible.filter((item) => item.category === activeCategory);
      list.innerHTML = visible.map(renderProductCard).join("");
      if (!visible.length) list.innerHTML = `<p class="empty-products">No styles in this category just yet. Please check back soon.</p>`;
    });

    const filterContainer = document.querySelector("[data-category-filters]");
    if (filterContainer) {
      filterContainer.innerHTML = categories.map((category) => `
        <button type="button" class="filter-chip ${category === activeCategory ? "is-active" : ""}" data-filter-category="${escapeHtml(category)}" aria-pressed="${category === activeCategory}">
          ${escapeHtml(category)}
        </button>`).join("");
    }
  }

  function formatPrice(price) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
  }

  function addProduct(productId) {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      showToast("That style could not be found. Please refresh and try again.");
      return;
    }
    const sizeSelect = document.querySelector(`[data-product-size="${CSS.escape(productId)}"]`);
    const size = sizeSelect ? sizeSelect.value : product.sizes[0];
    const existing = cart.find((entry) => entry.id === productId && entry.size === size);
    if (existing) existing.qty += 1;
    else cart.push({ id: productId, size, qty: 1 });
    saveCart();
    updateCart();
    showToast(`${product.name} added to your order.`);
  }

  function updateCart() {
    const count = cart.reduce((total, entry) => total + entry.qty, 0);
    document.querySelectorAll("[data-cart-count]").forEach((element) => {
      element.textContent = String(count);
      element.setAttribute("aria-label", `${count} ${count === 1 ? "item" : "items"} in your order`);
    });
    const items = document.querySelector("[data-cart-items]");
    const total = document.querySelector("[data-cart-total]");
    if (!items || !total) return;

    const cartTotal = cart.reduce((sum, entry) => {
      const product = products.find((item) => item.id === entry.id);
      return sum + (product ? product.price * entry.qty : 0);
    }, 0);
    total.textContent = formatPrice(cartTotal);
    if (!cart.length) {
      items.innerHTML = `<div class="empty-cart"><span class="empty-cart-icon">＋</span><h3>Your order is waiting.</h3><p>Browse the collection and add a style you like.</p><button class="text-link cart-browse" type="button">Browse collection <span aria-hidden="true">↗</span></button></div>`;
      return;
    }
    items.innerHTML = cart.map((entry) => {
      const product = products.find((item) => item.id === entry.id);
      if (!product) return "";
      return `<article class="cart-item">
        <img src="${escapeHtml(product.image)}" alt="" loading="lazy">
        <div class="cart-item-info"><span>${escapeHtml(product.brand)}</span><h3>${escapeHtml(product.name)}</h3><p>Size: ${escapeHtml(entry.size)} · ${formatPrice(product.price)}</p><div class="quantity-control"><button type="button" data-quantity-step="-1" data-id="${escapeHtml(entry.id)}" data-size="${escapeHtml(entry.size)}" aria-label="Decrease quantity of ${escapeHtml(product.name)}">−</button><span>${entry.qty}</span><button type="button" data-quantity-step="1" data-id="${escapeHtml(entry.id)}" data-size="${escapeHtml(entry.size)}" aria-label="Increase quantity of ${escapeHtml(product.name)}">+</button></div></div>
        <button type="button" class="remove-item" data-remove-item="${escapeHtml(entry.id)}" data-size="${escapeHtml(entry.size)}" aria-label="Remove ${escapeHtml(product.name)} from your order">×</button>
      </article>`;
    }).join("");
  }

  function updateQuantity(productId, size, step) {
    const entry = cart.find((item) => item.id === productId && item.size === size);
    if (!entry) return;
    entry.qty += step;
    if (entry.qty <= 0) cart = cart.filter((item) => item !== entry);
    saveCart();
    updateCart();
  }

  function showToast(message) {
    const region = document.querySelector(".toast-region");
    if (!region) return;
    region.textContent = message;
    region.classList.add("is-visible");
    clearTimeout(showToast.timeoutId);
    showToast.timeoutId = setTimeout(() => region.classList.remove("is-visible"), 3600);
  }

  function setDrawerOpen(open) {
    const drawer = document.querySelector("[data-order-drawer]");
    const backdrop = document.querySelector("[data-drawer-backdrop]");
    if (!drawer || !backdrop) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    backdrop.hidden = !open;
    document.body.classList.toggle("drawer-is-open", open);
    if (open) {
      drawerTrigger = document.activeElement;
      updateCart();
      drawer.querySelector(".drawer-close").focus();
    } else if (drawerTrigger instanceof HTMLElement) {
      drawerTrigger.focus();
      drawerTrigger = null;
    }
  }

  function buildOrderMessage(customer) {
    const lines = cart.map((entry, index) => {
      const product = products.find((item) => item.id === entry.id);
      return `${index + 1}. ${product.name} (${product.brand}), Size: ${entry.size} x ${entry.qty} = ${formatPrice(product.price * entry.qty)}`;
    });
    const total = cart.reduce((sum, entry) => {
      const product = products.find((item) => item.id === entry.id);
      return sum + product.price * entry.qty;
    }, 0);
    const message = [
      "*New order enquiry — Perfect Mens Wear*",
      "",
      `Name: ${customer.name}`,
      `Phone: ${customer.phone}`,
      "",
      "*Selected styles:*",
      ...lines,
      "",
      `Indicative total: ${formatPrice(total)}`,
      "Please confirm current availability and final pricing.",
      customer.note ? `Note: ${customer.note}` : "",
      "",
      "From the Perfect Mens Wear website"
    ].filter(Boolean).join("\n");
    if (message.length > 1500) throw new Error("This order message is too long. Please remove some items or shorten your note.");
    return message;
  }

  function submitOrder(event) {
    event.preventDefault();
    const errorElement = document.querySelector("[data-form-error]");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const note = String(formData.get("note") || "").trim();
    const phoneDigits = phone.replace(/\D/g, "");
    let error = "";

    if (!cart.length) error = "Add at least one style to your order first.";
    else if (name.length < 2) error = "Please enter your name.";
    else if (phoneDigits.length !== 10) error = "Please enter a valid 10-digit mobile number.";
    else if (!/^\d{10,15}$/.test(String(config.ownerWhatsApp || ""))) error = "The store’s WhatsApp number hasn’t been set up yet. Please contact the store directly.";

    if (error) {
      errorElement.textContent = error;
      if (!cart.length) showToast(error);
      return;
    }

    try {
      const message = encodeURIComponent(buildOrderMessage({ name, phone, note }));
      const url = `https://wa.me/${config.ownerWhatsApp}?text=${message}`;
      window.open(url, "_blank", "noopener,noreferrer");
      errorElement.textContent = "";
      showToast("Your message is ready. Tap Send in WhatsApp to share your enquiry.");
    } catch (exception) {
      errorElement.textContent = exception.message;
    }
  }

  function handleClick(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const addButton = target.closest("[data-add-product]");
    if (addButton) {
      addProduct(addButton.dataset.addProduct);
      return;
    }
    const filter = target.closest("[data-filter-category]");
    if (filter) {
      activeCategory = filter.dataset.filterCategory;
      renderProducts();
      return;
    }
    const quantity = target.closest("[data-quantity-step]");
    if (quantity) {
      updateQuantity(quantity.dataset.id, quantity.dataset.size, Number(quantity.dataset.quantityStep));
      return;
    }
    const remove = target.closest("[data-remove-item]");
    if (remove) {
      cart = cart.filter((entry) => entry.id !== remove.dataset.removeItem || entry.size !== remove.dataset.size);
      saveCart();
      updateCart();
      return;
    }
    if (target.closest(".cart-open")) {
      setDrawerOpen(true);
      return;
    }
    if (target.closest(".drawer-close") || target.matches("[data-drawer-backdrop]")) {
      setDrawerOpen(false);
      return;
    }
    if (target.closest(".cart-browse")) {
      setDrawerOpen(false);
      window.location.href = "collection.html";
      return;
    }
    if (target.closest(".whatsapp-action")) {
      const number = String(config.ownerWhatsApp || "");
      if (!/^\d{10,15}$/.test(number)) {
        showToast("The store’s WhatsApp number hasn’t been set up yet. Please contact the store directly.");
        return;
      }
      const text = encodeURIComponent("Hello, I’m contacting you from the Perfect Mens Wear website.");
      window.open(`https://wa.me/${number}?text=${text}`, "_blank", "noopener,noreferrer");
    }
  }

  function setupNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const navigation = document.querySelector(".primary-nav");
    if (!toggle || !navigation) return;
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      toggle.setAttribute("aria-label", expanded ? "Open menu" : "Close menu");
      navigation.classList.toggle("is-open", !expanded);
    });
    navigation.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
        navigation.classList.remove("is-open");
      }
    });
  }

  function init() {
    renderShell();
    renderProducts();
    updateCart();
    setupNavigation();
    if (cartReadFailed) showToast("We couldn't restore your saved order. You can start a new one from the collection.");
    document.addEventListener("click", handleClick);
    document.querySelector("[data-order-form]")?.addEventListener("submit", submitOrder);
    document.addEventListener("keydown", (event) => {
      const drawer = document.querySelector("[data-order-drawer]");
      if (!drawer?.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }
      if (event.key === "Tab") {
        const focusable = [...drawer.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]')];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });
    const initialCategory = new URLSearchParams(window.location.search).get("category");
    if (initialCategory && categories.includes(initialCategory)) {
      activeCategory = initialCategory;
      renderProducts();
    }
    document.querySelectorAll(".product-image").forEach((image) => {
      image.addEventListener("error", () => image.classList.add("image-unavailable"), { once: true });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
