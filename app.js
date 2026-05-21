// AXONIX CART SIMULATION Fully functional with localStorage persistence

class Cart {
  constructor() {
    this.items = this.loadCart();
    this.init();
  }

  // Initialize all event listeners
  init() {
    this.cacheDOM();
    this.bindEvents();
    this.render();
    this.createSuccessModal();
  }

  // Create success modal element
  createSuccessModal() {
    // Check if modal already exists
    if (document.getElementById('successModal')) return;

    const modalHTML = `
      <div id="successModal" class="success-modal">
        <div class="success-modal-content">
          <div class="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#4CAF50"/>
            </svg>
          </div>
          <h2>Order Placed Successfully!</h2>
          <div class="order-details">
            <p><span>Items:</span> <span id="orderItemCount"></span></p>
            <p><span>Total:</span> <span id="orderTotal"></span></p>
          </div>
          <p class="thankyou-message">Thank you for shopping with AXONIX!</p>
          <button class="modal-close-btn">Continue Shopping</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add modal styles
    this.addModalStyles();

    // Get modal elements
    this.successModal = document.getElementById('successModal');
    this.modalCloseBtn = document.querySelector('.modal-close-btn');

    // Bind close events
    this.modalCloseBtn.addEventListener('click', () => this.closeSuccessModal());
    this.successModal.addEventListener('click', (e) => {
      if (e.target === this.successModal) this.closeSuccessModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.successModal.classList.contains('active')) {
        this.closeSuccessModal();
      }
    });
  }

  // Add CSS styles for modal
  addModalStyles() {
    if (document.getElementById('modalStyles')) return;

    const styles = `
      <style id="modalStyles">
        .success-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 10000;
          justify-content: center;
          align-items: center;
          animation: fadeIn 0.3s ease;
        }

        .success-modal.active {
          display: flex;
        }

        .success-modal-content {
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          animation: slideUp 0.3s ease;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .success-icon {
          margin-bottom: 20px;
          animation: bounce 0.5s ease;
        }

        .success-icon svg {
          width: 80px;
          height: 80px;
        }

        .success-modal-content h2 {
          color: #333;
          margin-bottom: 20px;
          font-size: 24px;
        }

        .order-details {
          background: #f5f5f5;
          border-radius: 10px;
          padding: 15px;
          margin: 20px 0;
          text-align: left;
        }

        .order-details p {
          margin: 10px 0;
          font-size: 16px;
        }

        .order-details p span:first-child {
          font-weight: 600;
          color: #666;
        }

        .order-details p span:last-child {
          float: right;
          color: #333;
          font-weight: 500;
        }

        .thankyou-message {
          color: #666;
          margin-bottom: 25px;
          font-style: italic;
        }

        .modal-close-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 25px;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .modal-close-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  // Show success modal
  showSuccessModal(itemCount, total) {
    if (!this.successModal) {
      this.createSuccessModal();
    }

    // Update modal content
    document.getElementById('orderItemCount').textContent = itemCount;
    document.getElementById('orderTotal').textContent = `$${total.toFixed(2)}`;
    
    // Show modal
    this.successModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Close success modal
  closeSuccessModal() {
    this.successModal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Clear cart and close cart sidebar after modal closes
    this.clearCart();
    this.closeCart();
  }

  // Cache DOM elements
  cacheDOM() {
    this.cartToggle = document.getElementById('cartToggle');
    this.cartSidebar = document.getElementById('cartSidebar');
    this.cartOverlay = document.getElementById('cartOverlay');
    this.cartClose = document.getElementById('cartClose');
    this.cartItems = document.getElementById('cartItems');
    this.cartCount = document.getElementById('cartCount');
    this.cartTotal = document.getElementById('cartTotal');
    this.cartFooter = document.getElementById('cartFooter');
    this.cartEmpty = document.getElementById('cartEmpty');
    this.cartBadge = document.getElementById('cartBadge');
    this.toast = document.getElementById('toast');
    this.toastMessage = document.getElementById('toastMessage');
    this.addButtons = document.querySelectorAll('.btn-add');
  }

  // Bind all event listeners
  bindEvents() {
    // Open cart
    this.cartToggle.addEventListener('click', () => this.openCart());

    // Close cart
    this.cartClose.addEventListener('click', () => this.closeCart());
    this.cartOverlay.addEventListener('click', () => this.closeCart());

    // Add to cart buttons
    this.addButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleAddToCart(e));
    });

    // Checkout button
    document.querySelector('.btn-checkout').addEventListener('click', () => {
      this.checkout();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeCart();
    });
  }


  // LOCAL STORAGE METHODS


  loadCart() {
    try {
      const saved = localStorage.getItem('axonix_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading cart:', e);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem('axonix_cart', JSON.stringify(this.items));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }

  // CART OPERATIONS

  addItem(product) {
    const existing = this.items.find(item => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({
        ...product,
        quantity: 1
      });
    }

    this.saveCart();
    this.render();
    this.showToast(`${product.name} added to cart`);
  }

  removeItem(id) {
    this.items = this.items.filter(item => item.id !== id);
    this.saveCart();
    this.render();
  }

  updateQuantity(id, change) {
    const item = this.items.find(item => item.id === id);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
      this.removeItem(id);
      return;
    }

    this.saveCart();
    this.render();
  }

  setQuantity(id, value) {
    const quantity = parseInt(value);
    if (isNaN(quantity) || quantity < 1) {
      this.render(); // Reset to previous value
      return;
    }

    const item = this.items.find(item => item.id === id);
    if (item) {
      item.quantity = quantity;
      this.saveCart();
      this.render();
    }
  }

  clearCart() {
    this.items = [];
    this.saveCart();
    this.render();
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // EVENT HANDLERS

  handleAddToCart(e) {
    const card = e.target.closest('.product-card');
    if (!card) return;

    const product = {
      id: card.dataset.id,
      name: card.dataset.name,
      price: parseFloat(card.dataset.price),
      image: card.dataset.image
    };

    this.addItem(product);
    this.openCart();
  }

  // UI METHODS

  openCart() {
    this.cartSidebar.classList.add('open');
    this.cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeCart() {
    this.cartSidebar.classList.remove('open');
    this.cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  showToast(message) {
    this.toastMessage.textContent = message;
    this.toast.classList.add('show');

    setTimeout(() => {
      this.toast.classList.remove('show');
    }, 2500);
  }

  // RENDER METHODS

  render() {
    this.renderItems();
    this.renderSummary();
    this.renderBadge();
  }

  renderItems() {
    if (this.items.length === 0) {
      this.cartItems.innerHTML = `
        <div class="cart-empty" id="cartEmpty">
          <i class="fas fa-shopping-cart"></i>
          <p>Your cart is empty</p>
        </div>
      `;
      this.cartFooter.style.display = 'none';
      return;
    }

    this.cartItems.innerHTML = this.items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)}</div>
          <div class="cart-item-controls">
            <button class="qty-btn minus" data-id="${item.id}">−</button>
            <input type="number" class="qty-input" value="${item.quantity}" 
                   data-id="${item.id}" min="1">
            <button class="qty-btn plus" data-id="${item.id}">+</button>
          </div>
        </div>
        <button class="cart-item-delete" data-id="${item.id}">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `).join('');

    this.cartFooter.style.display = 'block';

    // Bind item events
    this.cartItems.querySelectorAll('.qty-btn.minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.updateQuantity(e.target.dataset.id, -1);
      });
    });

    this.cartItems.querySelectorAll('.qty-btn.plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.updateQuantity(e.target.dataset.id, 1);
      });
    });

    this.cartItems.querySelectorAll('.qty-input').forEach(input => {
      input.addEventListener('change', (e) => {
        this.setQuantity(e.target.dataset.id, e.target.value);
      });
    });

    this.cartItems.querySelectorAll('.cart-item-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('.cart-item-delete').dataset.id;
        this.removeItem(id);
      });
    });
  }

  renderSummary() {
    const total = this.getTotal();
    const count = this.getItemCount();

    this.cartCount.textContent = count;
    this.cartTotal.textContent = `$${total.toFixed(2)}`;
  }

  renderBadge() {
    const count = this.getItemCount();
    this.cartBadge.textContent = count;

    if (count > 0) {
      this.cartBadge.classList.add('show');
    } else {
      this.cartBadge.classList.remove('show');
    }
  }

  checkout() {
    if (this.items.length === 0) {
      this.showToast('Your cart is empty!');
      return;
    }

    const total = this.getTotal();
    const itemCount = this.getItemCount();

    // Simulate checkout process
    this.showToast(`Processing ${itemCount} items...`);
    setTimeout(() => {
      // Show custom modal instead of alert
      this.showSuccessModal(itemCount, total);
    }, 1500);
  }
}

// INITIALIZE CART WHEN DOM IS READY

document.addEventListener('DOMContentLoaded', () => {
  window.cart = new Cart();
});

// ============================================
// PROFESSIONAL HAMBURGER MENU FUNCTIONALITY
// Add this to your existing JavaScript file
// ============================================

class ResponsiveMenu {
  constructor() {
    this.init();
  }

  init() {
    this.createHamburgerElements();
    this.cacheDOM();
    this.bindEvents();
    this.updateCartBadge();
  }

  createHamburgerElements() {
    // Only add if hamburger doesn't exist
    if (document.querySelector('.hamburger')) return;

    // Add hamburger button to header
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    
    if (header && nav) {
      const hamburgerHTML = `
        <button class="hamburger" id="hamburgerMenu" aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      `;
      
      // Insert hamburger before nav
      header.insertBefore(this.createElementFromHTML(hamburgerHTML), nav);
    }

    // Create mobile navigation if it doesn't exist
    if (!document.querySelector('.mobile-nav')) {
      const mobileNavHTML = `
        <div class="mobile-nav" id="mobileNav">
          <div class="mobile-nav-header">
            <div class="mobile-nav-logo">AXONIX</div>
            <button class="mobile-nav-close" id="mobileNavClose" aria-label="Close menu">✕</button>
          </div>
          <ul id="mobileNavMenu">
            ${this.getNavigationLinks()}
            <li class="mobile-nav-cart">
              <a href="#" class="cart-wrapper" id="mobileCartLink">
                <span class="cart-icon">
                  <i class="fas fa-shopping-cart"></i> Cart
                </span>
                <span class="cart-badge" id="mobileCartBadge">0</span>
              </a>
            </li>
          </ul>
        </div>
        <div class="nav-overlay" id="navOverlay"></div>
      `;
      document.body.insertAdjacentHTML('beforeend', mobileNavHTML);
    }
  }

  getNavigationLinks() {
    // Get existing navigation links from desktop nav
    const desktopLinks = document.querySelectorAll('nav ul li:not(.cart-wrapper) a');
    let links = '';
    
    if (desktopLinks.length > 0) {
      desktopLinks.forEach(link => {
        links += `<li><a href="${link.getAttribute('href')}">${link.textContent}</a></li>`;
      });
    } else {
      // Default links if none exist
      links = `
        <li><a href="#home">Home</a></li>
        <li><a href="#products">Products</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      `;
    }
    
    return links;
  }

  createElementFromHTML(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
  }

  cacheDOM() {
    this.hamburger = document.getElementById('hamburgerMenu');
    this.mobileNav = document.getElementById('mobileNav');
    this.mobileNavClose = document.getElementById('mobileNavClose');
    this.navOverlay = document.getElementById('navOverlay');
    this.mobileCartLink = document.getElementById('mobileCartLink');
    this.mobileCartBadge = document.getElementById('mobileCartBadge');
    this.body = document.body;
  }

  bindEvents() {
    if (this.hamburger) {
      this.hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openMenu();
      });
    }
    
    if (this.mobileNavClose) {
      this.mobileNavClose.addEventListener('click', () => this.closeMenu());
    }
    
    if (this.navOverlay) {
      this.navOverlay.addEventListener('click', () => this.closeMenu());
    }
    
    if (this.mobileCartLink) {
      this.mobileCartLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.cart && window.cart.openCart) {
          window.cart.openCart();
          this.closeMenu();
        }
      });
    }
    
    // Close menu when clicking on any mobile nav link
    if (this.mobileNav) {
      this.mobileNav.querySelectorAll('a:not(#mobileCartLink)').forEach(link => {
        link.addEventListener('click', () => {
          setTimeout(() => this.closeMenu(), 100);
        });
      });
    }
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mobileNav && this.mobileNav.classList.contains('open')) {
        this.closeMenu();
      }
    });
    
    // Update cart badge periodically
    setInterval(() => this.updateCartBadge(), 100);
  }

  openMenu() {
    if (this.mobileNav) {
      this.mobileNav.classList.add('open');
      this.navOverlay.classList.add('active');
      this.body.classList.add('menu-open');
      this.body.style.overflow = 'hidden';
      
      // Animate hamburger to X
      if (this.hamburger) {
        const spans = this.hamburger.querySelectorAll('span');
        spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
      }
    }
  }

  closeMenu() {
    if (this.mobileNav) {
      this.mobileNav.classList.remove('open');
      this.navOverlay.classList.remove('active');
      this.body.classList.remove('menu-open');
      this.body.style.overflow = '';
      
      // Animate X back to hamburger
      if (this.hamburger) {
        const spans = this.hamburger.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    }
  }

  updateCartBadge() {
    if (window.cart && this.mobileCartBadge) {
      const count = window.cart.getItemCount ? window.cart.getItemCount() : 0;
      this.mobileCartBadge.textContent = count;
      
      if (count > 0) {
        this.mobileCartBadge.classList.add('show');
      } else {
        this.mobileCartBadge.classList.remove('show');
      }
    }
  }
}

// Initialize responsive menu when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.responsiveMenu = new ResponsiveMenu();
  });
} else {
  window.responsiveMenu = new ResponsiveMenu();
}