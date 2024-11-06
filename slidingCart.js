// src/scripts/slidingCart.js
// HMStudio Sliding Cart v1.0.1

(function() {
    console.log('Sliding Cart script initialized');
  
    function getStoreIdFromUrl() {
      const scriptTag = document.currentScript;
      const scriptUrl = new URL(scriptTag.src);
      const storeId = scriptUrl.searchParams.get('storeId');
      return storeId ? storeId.split('?')[0] : null;
    }
  
    function getCurrentLanguage() {
      return document.documentElement.lang || 'ar';
    }
  
    const storeId = getStoreIdFromUrl();
    if (!storeId) {
      console.error('Store ID not found in script URL');
      return;
    }
  
    const SlidingCart = {
      settings: null,
      cartElement: null,
      isOpen: false,
  
      async fetchSettings() {
        try {
          const response = await fetch(`https://europe-west3-hmstudio-85f42.cloudfunctions.net/getSlidingCartSettings?storeId=${storeId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch settings: ${response.statusText}`);
          }
          const data = await response.json();
          console.log('Fetched sliding cart settings:', data);
          return data;
        } catch (error) {
          console.error('Error fetching sliding cart settings:', error);
          return null;
        }
      },
  
      createCartStructure() {
        const currentLang = getCurrentLanguage();
        const isRTL = currentLang === 'ar';
  
        // Create cart container
        const container = document.createElement('div');
        container.id = 'hmstudio-sliding-cart';
        container.style.cssText = `
          position: fixed;
          top: 0;
          ${isRTL ? 'right' : 'left'}: 100%;
          width: ${this.settings.width}px;
          height: 100vh;
          background: ${this.settings.backgroundColor};
          color: ${this.settings.textColor};
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
          transition: transform ${this.settings.animationSpeed}ms ease;
          z-index: 999999;
          display: flex;
          flex-direction: column;
        `;
  
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
          padding: 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        `;
  
        const title = document.createElement('h2');
        title.textContent = currentLang === 'ar' ? 'سلة التسوق' : 'Shopping Cart';
        title.style.cssText = `
          margin: 0;
          font-size: 1.5rem;
          font-weight: bold;
        `;
  
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '✕';
        closeButton.style.cssText = `
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 5px;
          color: inherit;
        `;
        closeButton.addEventListener('click', () => this.closeCart());
  
        header.appendChild(title);
        header.appendChild(closeButton);
  
        // Create content area
        const content = document.createElement('div');
        content.style.cssText = `
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        `;
  
        // Create footer
        const footer = document.createElement('div');
        footer.style.cssText = `
          padding: 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        `;
  
        // Assemble cart structure
        container.appendChild(header);
        container.appendChild(content);
        container.appendChild(footer);
  
        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'hmstudio-sliding-cart-backdrop';
        backdrop.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          opacity: 0;
          visibility: hidden;
          transition: opacity ${this.settings.animationSpeed}ms ease;
          z-index: 999998;
        `;
  
        if (this.settings.closeOnBackdropClick) {
          backdrop.addEventListener('click', () => this.closeCart());
        }
  
        // Add to DOM
        document.body.appendChild(backdrop);
        document.body.appendChild(container);
  
        this.cartElement = container;
        return { container, content, footer, backdrop };
      },
  
      async fetchCartData() {
        try {
          const response = await zid.store.cart.fetch();
          if (response.status === 'success') {
            return response.data.cart;
          }
          throw new Error('Failed to fetch cart data');
        } catch (error) {
          console.error('Error fetching cart:', error);
          return null;
        }
      },
  
      async updateItemQuantity(cartProductId, productId, newQuantity) {
        try {
          await zid.store.cart.updateProduct(cartProductId, newQuantity, productId);
          await this.updateCartDisplay();
        } catch (error) {
          console.error('Error updating quantity:', error);
        }
      },
  
      async removeItem(cartProductId, productId) {
        try {
          await zid.store.cart.removeProduct(cartProductId, productId);
          await this.updateCartDisplay();
        } catch (error) {
          console.error('Error removing item:', error);
        }
      },
  
      createCartItem(item, currentLang) {
        const itemElement = document.createElement('div');
        itemElement.style.cssText = `
          display: flex;
          gap: 15px;
          padding: 15px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        `;
  
        // Product image
        const image = document.createElement('img');
        image.src = item.product.image;
        image.alt = item.product.name[currentLang];
        image.style.cssText = `
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 4px;
        `;
  
        // Product details container
        const details = document.createElement('div');
        details.style.cssText = `
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 5px;
        `;
  
        // Product name
        const name = document.createElement('h3');
        name.textContent = item.product.name[currentLang];
        name.style.cssText = `
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
        `;
  
        // Price
        const price = document.createElement('div');
        price.textContent = item.formatted_price;
        price.style.cssText = `
          font-weight: bold;
          color: var(--theme-primary, #00b286);
        `;
  
        // Quantity controls
        const quantityControls = document.createElement('div');
        quantityControls.style.cssText = `
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: auto;
        `;
  
        const createButton = (text, onClick) => {
          const btn = document.createElement('button');
          btn.textContent = text;
          btn.style.cssText = `
            width: 24px;
            height: 24px;
            padding: 0;
            border: 1px solid rgba(0, 0, 0, 0.1);
            background: transparent;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
          `;
          btn.addEventListener('click', onClick);
          return btn;
        };
  
        const decreaseBtn = createButton('-', () => {
          if (item.quantity > 1) {
            this.updateItemQuantity(item.id, item.product_id, item.quantity - 1);
          }
        });
  
        const quantity = document.createElement('span');
        quantity.textContent = item.quantity;
  
        const increaseBtn = createButton('+', () => {
          this.updateItemQuantity(item.id, item.product_id, item.quantity + 1);
        });
  
        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '🗑️';
        removeBtn.style.cssText = `
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px;
          margin-left: auto;
          font-size: 1.2rem;
          opacity: 0.7;
        `;
        removeBtn.addEventListener('click', () => {
          this.removeItem(item.id, item.product_id);
        });
  
        // Assemble quantity controls
        quantityControls.appendChild(decreaseBtn);
        quantityControls.appendChild(quantity);
        quantityControls.appendChild(increaseBtn);
  
        // Assemble details
        details.appendChild(name);
        details.appendChild(price);
        details.appendChild(quantityControls);
  
        // Assemble item
        itemElement.appendChild(image);
        itemElement.appendChild(details);
        itemElement.appendChild(removeBtn);
  
        return itemElement;
      },
  
      createFooterContent(cartData, currentLang) {
        const footer = document.createElement('div');
        footer.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 15px;
        `;
  
        // Subtotal
        const subtotal = document.createElement('div');
        subtotal.style.cssText = `
          display: flex;
          justify-content: space-between;
          font-weight: bold;
        `;
        subtotal.innerHTML = `
          <span>${currentLang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
          <span>${cartData.formatted_subtotal}</span>
        `;
  
        // Checkout button
        const checkoutBtn = document.createElement('button');
        checkoutBtn.textContent = currentLang === 'ar' ? 'إتمام الطلب' : 'Checkout';
        checkoutBtn.style.cssText = `
          width: 100%;
          padding: 15px;
          background: var(--theme-primary, #00b286);
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          transition: opacity 0.3s;
        `;
        checkoutBtn.addEventListener('mouseover', () => {
          checkoutBtn.style.opacity = '0.9';
        });
        checkoutBtn.addEventListener('mouseout', () => {
          checkoutBtn.style.opacity = '1';
        });
        checkoutBtn.addEventListener('click', () => {
          window.location.href = '/cart/checkout';
        });
  
        footer.appendChild(subtotal);
        footer.appendChild(checkoutBtn);
  
        return footer;
      },
  
      async updateCartDisplay() {
        const cartData = await this.fetchCartData();
        if (!cartData) return;
  
        const currentLang = getCurrentLanguage();
        const { content, footer } = this.cartElement;
  
        // Update content
        content.innerHTML = '';
        if (cartData.products.length === 0) {
          const emptyMessage = document.createElement('div');
          emptyMessage.style.cssText = `
            text-align: center;
            padding: 40px 20px;
            color: rgba(0, 0, 0, 0.5);
          `;
          emptyMessage.textContent = currentLang === 'ar' 
            ? 'سلة التسوق فارغة' 
            : 'Your cart is empty';
          content.appendChild(emptyMessage);
        } else {
          cartData.products.forEach(item => {
            content.appendChild(this.createCartItem(item, currentLang));
          });
        }
  
        // Update footer
        footer.innerHTML = '';
        footer.appendChild(this.createFooterContent(cartData, currentLang));
      },
  
      openCart() {
        if (this.isOpen) return;
        
        const currentLang = getCurrentLanguage();
        const isRTL = currentLang === 'ar';
        
        this.cartElement.style.transform = `translateX(${isRTL ? '100%' : '-100%'})`;
        document.getElementById('hmstudio-sliding-cart-backdrop').style.opacity = '1';
        document.getElementById('hmstudio-sliding-cart-backdrop').style.visibility = 'visible';
        document.body.style.overflow = 'hidden';
        this.isOpen = true;
  
        this.updateCartDisplay();
      },
  
      closeCart() {
        if (!this.isOpen) return;
  
        this.cartElement.style.transform = 'translateX(0)';
        document.getElementById('hmstudio-sliding-cart-backdrop').style.opacity = '0';
        document.getElementById('hmstudio-sliding-cart-backdrop').style.visibility = 'hidden';
        document.body.style.overflow = '';
        this.isOpen = false;
      },
  
      setupCartButton() {
        const cartButtons = document.querySelectorAll('.a-shopping-cart, .a-shopping-cart');
        cartButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            e.preventDefault();
            this.openCart();
          });
        });
      },
  
      async initialize() {
        console.log('Initializing Sliding Cart');
        
        // Fetch settings
        this.settings = await this.fetchSettings();
        if (!this.settings?.enabled) {
          console.log('Sliding Cart is disabled');
          return;
        }
  
        // Create cart structure
        this.createCartStructure();
  
        // Setup cart button
        this.setupCartButton();
  
        // Setup mutation observer for dynamically added cart buttons
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              this.setupCartButton();
            }
          });
        });
  
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
  
        console.log('Sliding Cart initialized successfully');
      }
    };
  
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => SlidingCart.initialize());
    } else {
      SlidingCart.initialize();
    }
  })();
