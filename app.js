// ============================================
// AXONIX CART SIMULATION
// Fully functional with localStorage persistence
// ============================================

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

  // ============================================
  // LOCAL STORAGE METHODS
  // ============================================

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

  // ============================================
  // CART OPERATIONS
  // ============================================

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

  // ============================================
  // EVENT HANDLERS
  // ============================================

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

  // ============================================
  // UI METHODS
  // ============================================

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

  // ============================================
  // RENDER METHODS
  // ============================================

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
      alert(`🎉 Order Placed Successfully!\n\nItems: ${itemCount}\nTotal: $${total.toFixed(2)}\n\nThank you for shopping with AXONIX!`);
      this.clearCart();
      this.closeCart();
    }, 1500);
  }
}

// ============================================
// INITIALIZE CART WHEN DOM IS READY
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  window.cart = new Cart();
});