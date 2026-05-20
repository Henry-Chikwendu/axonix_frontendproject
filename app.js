// AXONIX UNIVERSAL SHOPPING CART - app.js
// Works across: index.html | gaming.html | wearables.html | gadgets.html
// ============================================================

(function() {
    'use strict';

    const STORAGE_KEY = 'axonix_cart';

    // ============================================================
    // 1. LOCAL STORAGE FUNCTIONS
    // ============================================================
    
    function getCart() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }
    
    function saveCart(cart) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }

    // ============================================================
    // 2. UNIVERSAL PRODUCT DETECTION
    // Detects product info from ANY page structure
    // ============================================================
    
    function detectProductFromElement(element) {
        // Walk up DOM to find product container
        const card = element.closest('.product-card') || 
                     element.closest('[data-id]') ||
                     element.closest('.price-cart')?.closest('.product-card');
        
        if (!card) return null;

        // METHOD 1: data-* attributes (index.html, wearables, gadgets)
        if (card.dataset.id) {
            return {
                id: parseInt(card.dataset.id),
                name: card.dataset.name || card.querySelector('h3')?.textContent?.trim() || 'Unknown',
                price: parseFloat(card.dataset.price) || 0,
                image: card.dataset.image || card.querySelector('img')?.src || ''
            };
        }

        // METHOD 2: Extract from DOM (gaming.html style)
        const img = card.querySelector('img');
        const nameEl = card.querySelector('h3');
        const priceEl = card.querySelector('.product-price, .price-cart h4, h4');
        
        // Generate ID from name if no data-id exists
        const name = nameEl?.textContent?.trim() || 'Unknown';
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
        
        // Parse price - handle "$129.99" format
        let price = 0;
        if (priceEl) {
            const priceText = priceEl.textContent.replace('$', '').replace(',', '');
            price = parseFloat(priceText) || 0;
        }

        return {
            id: id,  // string ID for gaming page
            name: name,
            price: price,
            image: img?.src || ''
        };
    }

    // ============================================================
    // 3. CART OPERATIONS
    // ============================================================
    
    function addToCart(product) {
        if (!product) return;
        
        const cart = getCart();
        
        // Check if item exists (by id)
        const existingIndex = cart.findIndex(item => item.id === product.id);
        
        if (existingIndex >= 0) {
            // Increment quantity
            cart[existingIndex].quantity += 1;
        } else {
            // Add new item
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }
        
        saveCart(cart);
        updateCartUI();
        openCart();
        
        // Visual feedback on button
        showAddedFeedback(product.id);
    }
    
    function removeFromCart(productId) {
        let cart = getCart();
        cart = cart.filter(item => item.id !== productId);
        saveCart(cart);
        updateCartUI();
    }
    
    function updateQuantity(productId, change) {
        const cart = getCart();
        const item = cart.find(item => item.id === productId);
        
        if (!item) return;
        
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        
        saveCart(cart);
        updateCartUI();
    }

    // ============================================================
    // 4. CALCULATIONS
    // ============================================================
    
    function getTotalItemCount() {
        return getCart().reduce((sum, item) => sum + item.quantity, 0);
    }
    
    function getCartTotal() {
        return getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // ============================================================
    // 5. UI UPDATES
    // ============================================================
    
    function updateCartUI() {
        const cart = getCart();
        const totalCount = getTotalItemCount();
        const totalPrice = getCartTotal();
        
        // Update badge on cart icon
        const badge = document.getElementById('cartBadge');
        if (badge) {
            badge.textContent = totalCount;
            badge.classList.toggle('show', totalCount > 0);
        }
        
        // Update sidebar count
        const countEl = document.getElementById('cartCount');
        if (countEl) countEl.textContent = totalCount;
        
        // Render items
        renderCartItems(cart);
        
        // Update total
        const totalEl = document.getElementById('cartTotal');
        if (totalEl) totalEl.textContent = '$' + totalPrice.toFixed(2);
        
        // Show/hide footer
        const footer = document.getElementById('cartFooter');
        if (footer) footer.style.display = cart.length > 0 ? 'block' : 'none';
    }
    
    function renderCartItems(cart) {
        const container = document.getElementById('cartItems');
        if (!container) return;
        
        if (cart.length === 0) {
            container.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image" 
                     onerror="this.src='https://via.placeholder.com/70?text=No+Image'">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="window.axonixCart.updateQuantity('${item.id}', -1)">-</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="window.axonixCart.updateQuantity('${item.id}', 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-delete" onclick="window.axonixCart.removeFromCart('${item.id}')">
                    <i class="far fa-trash-alt"></i>
                </button>
            </div>
        `).join('');
    }
    
    function showAddedFeedback(productId) {
        // Find the button that was clicked
        const buttons = document.querySelectorAll('.btn-add, .price-cart button, button');
        buttons.forEach(btn => {
            const card = btn.closest('.product-card');
            if (card) {
                const cardData = detectProductFromElement(btn);
                if (cardData && cardData.id === productId) {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check"></i> Added';
                    btn.style.background = '#22c55e';
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.style.background = '';
                    }, 1500);
                }
            }
        });
    }

    // ============================================================
    // 6. SIDEBAR CONTROLS
    // ============================================================
    
    function openCart() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeCart() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ============================================================
    // 7. EVENT LISTENERS SETUP
    // ============================================================
    
    function setupEventListeners() {
        // Cart icon click (header) - works with any structure
        document.addEventListener('click', function(e) {
            const trigger = e.target.closest('.cart-icon') || 
                           e.target.closest('.cart-wrapper') ||
                           e.target.closest('.fa-shopping-cart') ||
                           e.target.closest('.fa-cart-shopping');
            
            if (trigger && !e.target.closest('.cart-sidebar')) {
                e.preventDefault();
                e.stopPropagation();
                openCart();
            }
        });
        
        // Close button
        document.addEventListener('click', function(e) {
            const closeBtn = e.target.closest('#cartClose') || 
                            e.target.closest('.cart-close') ||
                            e.target.closest('.fa-times');
            if (closeBtn) {
                e.preventDefault();
                closeCart();
            }
        });
        
        // Overlay click
        document.addEventListener('click', function(e) {
            if (e.target.id === 'cartOverlay' || e.target.classList.contains('cart-overlay')) {
                closeCart();
            }
        });
        
        // Add to cart buttons - UNIVERSAL DETECTION
        document.addEventListener('click', function(e) {
            // Detect any "Add" button click
            const btn = e.target.closest('.btn-add') || 
                       e.target.closest('button');
            
            if (!btn) return;
            
            // Check if button is inside a product card
            const card = btn.closest('.product-card') || 
                        btn.closest('.price-cart')?.closest('.product-card');
            
            if (!card) return;
            
            // Don't trigger if clicking quantity buttons in cart
            if (btn.classList.contains('qty-btn') || 
                btn.classList.contains('cart-item-delete') ||
                btn.classList.contains('cart-close')) return;
            
            e.preventDefault();
            
            const product = detectProductFromElement(btn);
            if (product) {
                addToCart(product);
            }
        });
        
        // Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeCart();
        });
    }

    // ============================================================
    // 8. CART SIDEBAR HTML INJECTION (for pages without it)
    // ============================================================
    
    function injectCartSidebar() {
        // Check if sidebar already exists
        if (document.getElementById('cartSidebar')) return;
        
        const sidebarHTML = `
            <!-- Cart Overlay -->
            <div class="cart-overlay" id="cartOverlay"></div>
            
            <!-- Cart Sidebar -->
            <div class="cart-sidebar" id="cartSidebar">
                <div class="cart-header">
                    <h2>Shopping Cart (<span id="cartCount">0</span>)</h2>
                    <button class="cart-close" id="cartClose"><i class="fas fa-times"></i></button>
                </div>
                <div class="cart-items" id="cartItems">
                    <div class="cart-empty" id="cartEmpty">
                        <i class="fas fa-shopping-cart"></i>
                        <p>Your cart is empty</p>
                    </div>
                </div>
                <div class="cart-footer" id="cartFooter" style="display: none;">
                    <div class="cart-total-row">
                        <span class="cart-total-label">Total:</span>
                        <span class="cart-total-value" id="cartTotal">$0.00</span>
                    </div>
                    <button class="btn-checkout">Proceed to Checkout</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', sidebarHTML);
    }

    // ============================================================
    // 9. CART BADGE INJECTION (for pages without it)
    // ============================================================
    
    function injectCartBadge() {
        // Check if badge already exists
        if (document.getElementById('cartBadge')) return;
        
        // Find cart icon in header
        const cartIcon = document.querySelector('.cart-icon') || 
                        document.querySelector('.fa-shopping-cart') ||
                        document.querySelector('.fa-cart-shopping');
        
        if (!cartIcon) return;
        
        const parent = cartIcon.parentElement;
        
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'cart-wrapper';
        wrapper.style.cssText = 'position: relative; cursor: pointer; display: inline-block;';
        
        // Move icon into wrapper
        parent.insertBefore(wrapper, cartIcon);
        wrapper.appendChild(cartIcon);
        
        // Create badge
        const badge = document.createElement('span');
        badge.id = 'cartBadge';
        badge.className = 'cart-badge';
        badge.textContent = '0';
        badge.style.cssText = `
            position: absolute;
            top: -8px;
            right: -10px;
            background: #ef4444;
            color: #fff;
            font-size: 11px;
            font-weight: 600;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transform: scale(0);
            transition: all 0.3s ease;
        `;
        wrapper.appendChild(badge);
    }

    // ============================================================
    // 10. CART CSS INJECTION (for pages without cart styles)
    // ============================================================
    
    function injectCartStyles() {
        if (document.getElementById('axonix-cart-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'axonix-cart-styles';
        styles.textContent = `
            /* Cart Badge */
            .cart-badge.show { opacity: 1 !important; transform: scale(1) !important; }
            
            /* Overlay */
            .cart-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); z-index: 200;
                opacity: 0; visibility: hidden; transition: all 0.3s ease;
            }
            .cart-overlay.active { opacity: 1; visibility: visible; }
            
            /* Sidebar */
            .cart-sidebar {
                position: fixed; top: 0; right: -420px; width: 400px; max-width: 100%;
                height: 100vh; background: #fff; z-index: 300;
                box-shadow: -5px 0 25px rgba(0,0,0,0.15);
                transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex; flex-direction: column;
            }
            .cart-sidebar.open { right: 0; }
            
            .cart-header {
                padding: 20px 25px; border-bottom: 1px solid #eee;
                display: flex; justify-content: space-between; align-items: center;
            }
            .cart-header h2 { font-size: 18px; font-weight: 600; color: #1a1a1a; }
            .cart-close { background: none; border: none; font-size: 22px; color: #666; cursor: pointer; }
            
            .cart-items { flex: 1; overflow-y: auto; padding: 15px 20px; }
            .cart-empty { text-align: center; padding: 60px 20px; color: #999; }
            .cart-empty i { font-size: 50px; margin-bottom: 15px; opacity: 0.5; }
            
            .cart-item { display: flex; align-items: center; gap: 15px; padding: 15px 0; border-bottom: 1px solid #f0f0f0; }
            .cart-item-image { width: 70px; height: 70px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
            .cart-item-details { flex: 1; min-width: 0; }
            .cart-item-name { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .cart-item-price { font-size: 14px; color: #0a2463; font-weight: 600; margin-bottom: 8px; }
            .cart-item-controls { display: flex; align-items: center; gap: 12px; }
            
            .qty-btn { width: 28px; height: 28px; border: 1px solid #ddd; background: #fff; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #555; }
            .qty-btn:hover { background: #f5f5f5; }
            .qty-value { font-size: 14px; font-weight: 600; color: #333; min-width: 20px; text-align: center; }
            
            .cart-item-delete { background: none; border: none; color: #ef4444; font-size: 18px; cursor: pointer; padding: 5px; margin-left: auto; }
            .cart-item-delete:hover { color: #dc2626; }
            
            .cart-footer { padding: 20px 25px; border-top: 1px solid #eee; background: #fff; }
            .cart-total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .cart-total-label { font-size: 16px; font-weight: 500; color: #333; }
            .cart-total-value { font-size: 20px; font-weight: 700; color: #0a2463; }
            .btn-checkout { width: 100%; padding: 14px; background: #0a2463; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
            .btn-checkout:hover { background: #143a8a; }
            
            @media (max-width: 600px) {
                .cart-sidebar { width: 100%; right: -100%; }
            }
        `;
        document.head.appendChild(styles);
    }

    // ============================================================
    // 11. EXPOSE FUNCTIONS GLOBALLY (for onclick handlers)
    // ============================================================
    
    window.axonixCart = {
        addToCart: function(productId) {
            // For manual onclick="addToCart(1)" calls
            const card = document.querySelector(`.product-card[data-id="${productId}"]`);
            if (card) {
                const product = {
                    id: parseInt(card.dataset.id),
                    name: card.dataset.name,
                    price: parseFloat(card.dataset.price),
                    image: card.dataset.image
                };
                addToCart(product);
            }
        },
        removeFromCart: removeFromCart,
        updateQuantity: updateQuantity,
        getCart: getCart,
        openCart: openCart,
        closeCart: closeCart
    };

    // ============================================================
    // 12. INITIALIZATION
    // ============================================================
    
    function init() {
        injectCartStyles();
        injectCartSidebar();
        injectCartBadge();
        setupEventListeners();
        updateCartUI();
        console.log('AXONIX Cart System Initialized');
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})
