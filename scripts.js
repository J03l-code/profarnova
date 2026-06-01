/* ============================================
   CYSPREX® Premium Landing Page
   JavaScript - Interactions & Animations
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initHeader();
    initMobileMenu();
    initScrollAnimations();
    initScrollToTop();
    initSmoothScroll();
    initProfileModal();
    initProductPriceSync();
});

/* ============================================
   Header Scroll Effect
   ============================================ */
function initHeader() {
    const header = document.getElementById('header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Add/remove scrolled class
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    }, { passive: true });
}

/* ============================================
   Mobile Menu Toggle
   ============================================ */
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!menuToggle || !nav) return;

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        nav.classList.toggle('active');
        document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            nav.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('active')) {
            menuToggle.classList.remove('active');
            nav.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

/* ============================================
   Scroll Animations with Intersection Observer
   ============================================ */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (!animatedElements.length) return;

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optionally unobserve after animation
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

/* ============================================
   Scroll to Top Button
   ============================================ */
function initScrollToTop() {
    const scrollTopBtn = document.getElementById('scrollTop');

    if (!scrollTopBtn) return;

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    }, { passive: true });

    // Scroll to top on click
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/* ============================================
   Smooth Scroll for Anchor Links
   ============================================ */
function initSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            // Skip if it's just "#"
            if (href === '#') return;

            const target = document.querySelector(href);

            if (target) {
                e.preventDefault();

                const headerHeight = document.getElementById('header')?.offsetHeight || 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* ============================================
   Parallax Effect (Optional Enhancement)
   ============================================ */
function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');

    if (!parallaxElements.length) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;

        parallaxElements.forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.5;
            const yPos = -(scrolled * speed);
            el.style.transform = `translateY(${yPos}px)`;
        });
    }, { passive: true });
}

/* ============================================
   Counter Animation (For Statistics)
   ============================================ */
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

/* ============================================
   Lazy Loading Images (Native Support)
   ============================================ */
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    if ('loading' in HTMLImageElement.prototype) {
        // Native lazy loading supported
        return;
    }

    // Fallback for browsers without native support
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
}

/* ============================================
   Add Ripple Effect to Buttons
   ============================================ */
function initRippleEffect() {
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });
}

/* ============================================
   Preloader (Optional)
   ============================================ */
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }
}

// Hide preloader when page is fully loaded
window.addEventListener('load', hidePreloader);

/* ============================================
   Performance: Debounce & Throttle Utilities
   ============================================ */
function debounce(func, wait = 100) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit = 100) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/* ============================================
   Accessibility: Focus Management
   ============================================ */
function initAccessibility() {
    // Add visible focus styles when using keyboard
    document.body.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-nav');
        }
    });

    document.body.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-nav');
    });
}

// Initialize accessibility features
initAccessibility();

/* ============================================
   Secure Product Profile Modal
   ============================================ */
function initProfileModal() {
    const modal = document.getElementById('profileModal');
    const closeBtn = document.getElementById('closeProfileModal');
    const overlay = document.querySelector('.profile-modal-overlay');
    const pdfContainer = document.getElementById('pdf-render-container');
    const titleEl = document.getElementById('profileModalTitle');

    if (!modal || !closeBtn || !pdfContainer) return;

    // Optional: Setup PDF.js worker if available
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }

    // Trigger buttons
    const triggers = document.querySelectorAll('.btn-profile-trigger');

    triggers.forEach(trigger => {
        trigger.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const pdfPath = trigger.getAttribute('data-pdf');
            const pdfTitle = trigger.getAttribute('data-title') || 'Perfil de Producto';

            if (!pdfPath) return;

            // Open modal
            titleEl.textContent = pdfTitle;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            pdfContainer.innerHTML = '<div style="color:white; padding:20px; text-align:center;">Cargando documento...</div>';

            try {
                if (!window.pdfjsLib) throw new Error("PDF.js no cargado");
                
                const loadingTask = pdfjsLib.getDocument(pdfPath);
                const pdf = await loadingTask.promise;
                
                pdfContainer.innerHTML = ''; // clear loading

                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    
                    const canvas = document.createElement('canvas');
                    canvas.style.display = 'block';
                    canvas.style.margin = '0 auto 10px auto';
                    canvas.style.maxWidth = '100%';
                    canvas.style.height = 'auto'; // ensure responsiveness
                    canvas.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                    
                    pdfContainer.appendChild(canvas);
                    
                    // Render page
                    const viewport = page.getViewport({ scale: 1.5 }); // Good scale for mobile/desktop
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    await page.render(renderContext).promise;
                }
            } catch (error) {
                console.error('Error loading PDF:', error);
                pdfContainer.innerHTML = '<div style="color:white; padding:20px; text-align:center;">Error al cargar el documento.</div>';
            }
        });
    });

    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Clear container to save memory
        pdfContainer.innerHTML = '';
    };

    closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Prevent Print and Save hotkeys
    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('active')) {
            // Block Ctrl+P / Cmd+P (Print) and Ctrl+S / Cmd+S (Save)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) {
                e.preventDefault();
                return false;
            }
        }
    });

    // Disable right click on modal
    modal.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
}

/* ============================================
   Dynamic Product Price Synchronization
   ============================================ */
async function initProductPriceSync() {
    try {
        const apiUrl = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
            ? 'https://profarnova.com/api/products'
            : '/api/products';

        const response = await fetch(apiUrl);
        if (!response.ok) return;
        const products = await response.json();
        
        // Find Cysprex and Lubryn-E from the database
        const cysprex = products.find(p => p.sku === 'PRF-CYS-36');
        const lubryne = products.find(p => p.sku === 'PRF-LUB-60');
        
        if (cysprex) {
            updateProductPriceOnDOM('CYSPREX', cysprex.price);
        }
        if (lubryne) {
            updateProductPriceOnDOM('Lubryn-E', lubryne.price);
        }
    } catch (e) {
        console.warn('API connection failed, using offline fallback prices:', e);
    }
}

function updateProductPriceOnDOM(nameKey, rawPrice) {
    const formattedPrice = parseFloat(rawPrice).toFixed(2);
    
    // 1. Update text content of elements containing the old price or containing specific tags
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let node;
    while (node = walker.nextNode()) {
        const text = node.nodeValue;
        if (nameKey === 'CYSPREX' && text.includes('28.80')) {
            node.nodeValue = text.replace(/28\.80/g, formattedPrice);
        } else if (nameKey === 'Lubryn-E' && text.includes('20.99')) {
            node.nodeValue = text.replace(/20\.99/g, formattedPrice);
        }
    }

    // 2. Update WhatsApp links in the href attribute of anchors
    const links = document.querySelectorAll('a[href*="wa.me"]');
    links.forEach(link => {
        let href = link.getAttribute('href');
        if (!href) return;
        
        if (nameKey === 'CYSPREX' && href.includes('28.80')) {
            href = href.replace(/28\.80/g, formattedPrice);
            link.setAttribute('href', href);
        } else if (nameKey === 'Lubryn-E' && href.includes('20.99')) {
            href = href.replace(/20\.99/g, formattedPrice);
            link.setAttribute('href', href);
        }
    });
}

/* ============================================
   CART & ORDER MODAL SYSTEM
   ============================================ */

// Cart state stored in localStorage
let cart = JSON.parse(localStorage.getItem('pf_cart') || '[]');

function saveCart() {
    localStorage.setItem('pf_cart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.cart-badge').forEach(el => {
        el.textContent = total;
        el.style.display = total > 0 ? 'flex' : 'none';
    });
}

// Called by "Comprar" buttons — data-product, data-price, data-img
function addToCart(name, price, img) {
    const existing = cart.find(i => i.name === name);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ name, price: parseFloat(price), img: img || '', qty: 1 });
    }
    saveCart();
    showCartToast(name);
    openCartDrawer();
}

function showCartToast(name) {
    let t = document.getElementById('pf-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'pf-toast';
        t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#16a34a;color:#fff;padding:10px 22px;border-radius:30px;font-weight:700;font-size:0.9rem;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);transition:opacity .3s';
        document.body.appendChild(t);
    }
    t.textContent = `✓ ${name} añadido al carrito`;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.style.opacity = '0', 2500);
}

function openCartDrawer() {
    ensureCartUI();
    document.getElementById('pf-cart-drawer').classList.add('open');
    renderCartDrawer();
}

function closeCartDrawer() {
    const d = document.getElementById('pf-cart-drawer');
    if (d) d.classList.remove('open');
}

function renderCartDrawer() {
    const list = document.getElementById('pf-cart-list');
    const footer = document.getElementById('pf-cart-footer');
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:2rem 0;">Tu carrito está vacío</p>';
        footer.innerHTML = '';
        return;
    }

    list.innerHTML = cart.map((item, idx) => `
        <div style="display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #f1f5f9">
            <img src="${item.img}" alt="${item.name}" style="width:56px;height:56px;object-fit:contain;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0">
            <div style="flex:1">
                <div style="font-weight:700;font-size:0.9rem;color:#1e293b">${item.name}</div>
                <div style="color:#16a34a;font-weight:700">$${item.price.toFixed(2)} c/u</div>
                <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
                    <button onclick="changeQty(${idx},-1)" style="width:28px;height:28px;border-radius:50%;border:2px solid #e2e8f0;background:#fff;cursor:pointer;font-size:1rem;font-weight:700;display:flex;align-items:center;justify-content:center">−</button>
                    <span style="font-weight:700;min-width:20px;text-align:center">${item.qty}</span>
                    <button onclick="changeQty(${idx},1)" style="width:28px;height:28px;border-radius:50%;border:2px solid #e2e8f0;background:#fff;cursor:pointer;font-size:1rem;font-weight:700;display:flex;align-items:center;justify-content:center">+</button>
                    <button onclick="removeCartItem(${idx})" style="margin-left:auto;color:#ef4444;background:none;border:none;cursor:pointer;font-size:0.8rem;font-weight:700">Eliminar</button>
                </div>
            </div>
            <div style="font-weight:800;color:#1e293b;white-space:nowrap">$${(item.price*item.qty).toFixed(2)}</div>
        </div>`).join('');

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    footer.innerHTML = `
        <div style="display:flex;justify-content:space-between;font-weight:800;font-size:1.1rem;margin-bottom:14px;color:#1e293b">
            <span>Total:</span><span style="color:#16a34a">$${total.toFixed(2)}</span>
        </div>
        <button onclick="openOrderModal()" style="width:100%;padding:14px;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;border:none;border-radius:12px;font-weight:800;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Proceder al pedido por WhatsApp
        </button>`;
}

function changeQty(idx, delta) {
    cart[idx].qty = Math.max(1, cart[idx].qty + delta);
    saveCart();
    renderCartDrawer();
}

function removeCartItem(idx) {
    cart.splice(idx, 1);
    saveCart();
    renderCartDrawer();
}

function openOrderModal() {
    closeCartDrawer();
    ensureOrderModal();
    document.getElementById('pf-order-modal').style.display = 'flex';
}

function closeOrderModal() {
    const m = document.getElementById('pf-order-modal');
    if (m) m.style.display = 'none';
}

function submitOrder() {
    const get = id => document.getElementById(id)?.value.trim() || '';
    const nombre = get('ord-nombre');
    const telefono = get('ord-telefono');
    const email = get('ord-email');
    const ciudad = get('ord-ciudad');
    const direccion = get('ord-direccion');
    const referencia = get('ord-referencia');
    const notas = get('ord-notas');

    if (!nombre || !telefono || !ciudad || !direccion) {
        alert('Por favor completa los campos obligatorios: nombre, teléfono, ciudad y dirección.');
        return;
    }

    const itemLines = cart.map(i => `  • ${i.name} x${i.qty} = $${(i.price * i.qty).toFixed(2)}`).join('\n');
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
    
    // Generate a short 6-character order ID for easy reference
    const shortOrderId = Math.random().toString(36).substring(2, 8).toUpperCase();

    const msg = `🛍️ *NUEVO PEDIDO #${shortOrderId}*

👤 *Datos del Cliente:*
• Nombre: ${nombre}
• Teléfono: ${telefono}
• Email: ${email || 'No indicado'}

📦 *Productos:*
${itemLines}

💰 *Total: $${total}*

🚚 *Datos de Envío:*
• Ciudad: ${ciudad}
• Dirección: ${direccion}
• Referencia: ${referencia || 'No indicada'}

📝 *Notas:* ${notas || 'Ninguna'}

_Pedido realizado desde profarnova.com_`;

    // Save to DB → Ventas y Pedidos section in Dashboard
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : '/api';

    fetch(`${API_BASE}/orders/website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_name: nombre,
            client_phone: telefono,
            client_email: email || '',
            shipping_city: ciudad,
            shipping_address: direccion,
            shipping_reference: referencia || '',
            notes: `[Ref: #${shortOrderId}] ${notas || ''}`.trim(),
            total_amount: total,
            items: cart.map(i => ({ name: i.name, quantity: i.qty, price: i.price, subtotal: (i.qty * i.price).toFixed(2) }))
        })
    }).catch(() => {});

    // Open WhatsApp
    window.open(`https://wa.me/593987646968?text=${encodeURIComponent(msg)}`, '_blank');

    // Clear cart
    cart = [];
    saveCart();
    closeOrderModal();
    document.getElementById('pf-order-success').style.display = 'flex';
}

function ensureCartUI() {
    if (document.getElementById('pf-cart-drawer')) return;

    // Floating button is removed — cart is now in the page header.
    // Drawer stays the same.
    const drawer = document.createElement('div');
    drawer.id = 'pf-cart-drawer';
    drawer.style.cssText = 'position:fixed;top:0;right:0;width:min(420px,100vw);height:100vh;background:#fff;z-index:1000;box-shadow:-8px 0 40px rgba(0,0,0,0.15);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1)';
    drawer.innerHTML = `
        <style>#pf-cart-drawer.open{transform:translateX(0)!important}</style>
        <div style="padding:20px 24px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between">
            <h3 style="margin:0;font-size:1.2rem;font-weight:800;color:#1e293b;display:flex;align-items:center;gap:8px">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                Mi Carrito
            </h3>
            <button onclick="closeCartDrawer()" style="background:none;border:none;cursor:pointer;color:#64748b;padding:4px">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
        <div id="pf-cart-list" style="flex:1;overflow-y:auto;padding:16px 24px"></div>
        <div id="pf-cart-footer" style="padding:20px 24px;border-top:1px solid #f1f5f9"></div>`;
    document.body.appendChild(drawer);

    // Overlay
    const ov = document.createElement('div');
    ov.id = 'pf-cart-overlay';
    ov.onclick = closeCartDrawer;
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:999;display:none';
    document.body.appendChild(ov);

    drawer.addEventListener('transitionend', () => {
        ov.style.display = drawer.classList.contains('open') ? 'block' : 'none';
    });

    updateCartBadge();
}

function ensureOrderModal() {
    if (document.getElementById('pf-order-modal')) return;

    const m = document.createElement('div');
    m.id = 'pf-order-modal';
    m.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.6);display:none;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)';
    m.innerHTML = `
        <div style="background:#fff;border-radius:20px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,0.3)">
            <div style="padding:24px 28px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#fff;border-radius:20px 20px 0 0;z-index:1">
                <h3 style="margin:0;font-size:1.2rem;font-weight:800;color:#1e293b">📋 Datos del Pedido</h3>
                <button onclick="closeOrderModal()" style="background:none;border:none;cursor:pointer;color:#64748b">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <div style="padding:24px 28px;display:flex;flex-direction:column;gap:14px">
                <p style="margin:0;font-size:0.85rem;color:#64748b;background:#f8fafc;padding:10px 14px;border-radius:10px">
                    Completa tus datos y se abrirá WhatsApp con tu pedido listo para enviar.
                </p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    ${field('ord-nombre','Nombre completo *','Tu nombre','text')}
                    ${field('ord-telefono','Teléfono / WhatsApp *','+593 9 0000 0000','tel')}
                    ${field('ord-email','Correo electrónico','tu@correo.com','email')}
                    ${field('ord-ciudad','Ciudad *','Quito, Guayaquil...','text')}
                </div>
                ${field('ord-direccion','Dirección de entrega *','Calle, número, sector...','text',true)}
                ${field('ord-referencia','Referencia (opcional)','Ej: Casa azul, junto al parque...','text',true)}
                ${field('ord-notas','Notas adicionales (opcional)','Instrucciones especiales...','text',true,true)}
                <button onclick="submitOrder()" style="width:100%;padding:16px;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;border:none;border-radius:12px;font-weight:800;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-top:4px;box-shadow:0 4px 16px rgba(22,163,74,0.4)">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Confirmar y enviar por WhatsApp
                </button>
            </div>
        </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) closeOrderModal(); });

    // Success screen
    const s = document.createElement('div');
    s.id = 'pf-order-success';
    s.style.cssText = 'position:fixed;inset:0;z-index:2100;background:rgba(0,0,0,0.7);display:none;align-items:center;justify-content:center;padding:16px';
    s.innerHTML = `
        <div style="background:#fff;border-radius:20px;padding:40px 32px;text-align:center;max-width:380px;width:100%">
            <div style="font-size:4rem;margin-bottom:16px">🎉</div>
            <h3 style="margin:0 0 8px;color:#16a34a;font-size:1.4rem">¡Pedido enviado!</h3>
            <p style="color:#64748b;margin:0 0 24px">Tu pedido fue enviado a nuestro equipo por WhatsApp. Te contactaremos en breve para confirmar.</p>
            <button onclick="document.getElementById('pf-order-success').style.display='none'" style="padding:12px 32px;background:#16a34a;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer">Aceptar</button>
        </div>`;
    document.body.appendChild(s);
}

function field(id, label, placeholder, type='text', fullWidth=false, isTextarea=false) {
    const col = fullWidth ? 'grid-column:1/-1' : '';
    const input = isTextarea
        ? `<textarea id="${id}" placeholder="${placeholder}" rows="2" style="width:100%;padding:10px 14px;border:2px solid #e2e8f0;border-radius:10px;font-size:0.9rem;font-family:inherit;resize:vertical;box-sizing:border-box;transition:border-color .2s" onfocus="this.style.borderColor='#16a34a'" onblur="this.style.borderColor='#e2e8f0'"></textarea>`
        : `<input id="${id}" type="${type}" placeholder="${placeholder}" style="width:100%;padding:10px 14px;border:2px solid #e2e8f0;border-radius:10px;font-size:0.9rem;font-family:inherit;box-sizing:border-box;transition:border-color .2s" onfocus="this.style.borderColor='#16a34a'" onblur="this.style.borderColor='#e2e8f0'">`;
    return `<div style="${col}"><label style="display:block;font-size:0.8rem;font-weight:700;color:#475569;margin-bottom:5px">${label}</label>${input}</div>`;
}

// Auto-init cart UI on page load
document.addEventListener('DOMContentLoaded', () => {
    ensureCartUI();
    cart = JSON.parse(localStorage.getItem('pf_cart') || '[]');
    updateCartBadge();
});
