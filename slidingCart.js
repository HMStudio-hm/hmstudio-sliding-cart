// src/scripts/slidingCart.js
// HMStudio Sliding Cart v1.0.8

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
        width: 400px;
        height: 100vh;
        background: #fff;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
        transition: transform 300ms ease;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        direction: ${isRTL ? 'rtl' : 'ltr'};
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
        font-size: 1.25rem;
        font-weight: bold;
      `;

      const closeButton = document.createElement('button');
      closeButton.innerHTML = '✕';
      closeButton.style.cssText = `
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 5px;
        opacity: 0.6;
        transition: opacity 0.3s;
      `;
      closeButton.addEventListener('mouseover', () => closeButton.style.opacity = '1');
      closeButton.addEventListener('mouseout', () => closeButton.style.opacity = '0.6');
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
        transition: opacity 300ms ease;
        z-index: 999998;
      `;

      backdrop.addEventListener('click', () => this.closeCart());

      // Add to DOM
      document.body.appendChild(backdrop);
      document.body.appendChild(container);

      this.cartElement = {
        container,
        content,
        footer,
        backdrop
      };

      return this.cartElement;
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
      const isArabic = currentLang === 'ar';
      const currencySymbol = ' ر.س ';

      const itemElement = document.createElement('div');
      itemElement.style.cssText = `
        display: flex;
        gap: 15px;
        padding: 15px 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        direction: ${isArabic ? 'rtl' : 'ltr'};
      `;

      // Product image
      const image = document.createElement('img');
      image.src = item.thumbnail || item.main_image || '/path/to/default-image.jpg';
      image.alt = item.name || '';
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
      name.textContent = item.name || '';
      name.style.cssText = `
        margin: 0;
        font-size: 0.9rem;
        font-weight: 500;
      `;

      // Price container
      const priceContainer = document.createElement('div');
      priceContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        flex-direction: ${isArabic ? 'row-reverse' : 'row'};
      `;

      if (item.price_before && item.price_before !== item.price) {
        // Sale price (current price)
        const salePrice = document.createElement('div');
        const formattedSalePrice = isArabic
          ? `${item.price.toFixed(2)} ${currencySymbol}`
          : `${currencySymbol} ${item.price.toFixed(2)}`;
        salePrice.textContent = formattedSalePrice;
        salePrice.style.cssText = `
          font-weight: bold;
          color: var(--theme-primary, #00b286);
        `;
        
        // Original price
        const originalPrice = document.createElement('div');
        const formattedOriginalPrice = isArabic
          ? `${item.price_before.toFixed(2)} ${currencySymbol}`
          : `${currencySymbol} ${item.price_before.toFixed(2)}`;
        originalPrice.textContent = formattedOriginalPrice;
        originalPrice.style.cssText = `
          text-decoration: line-through;
          color: #999;
          font-size: 0.9em;
          margin-${isArabic ? 'left' : 'right'}: 8px;
        `;

        if (isArabic) {
          priceContainer.appendChild(originalPrice);
          priceContainer.appendChild(salePrice);
        } else {
          priceContainer.appendChild(salePrice);
          priceContainer.appendChild(originalPrice);
        }
      } else {
        // Regular price only
        const price = document.createElement('div');
        const formattedPrice = isArabic
          ? `${item.price.toFixed(2)} ${currencySymbol}`
          : `${currencySymbol} ${item.price.toFixed(2)}`;
        price.textContent = formattedPrice;
        price.style.cssText = `
          font-weight: bold;
          color: var(--theme-primary, #00b286);
        `;
        priceContainer.appendChild(price);
      }

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
        margin-${isArabic ? 'right' : 'left'}: auto;
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
      details.appendChild(priceContainer);
      details.appendChild(quantityControls);

      // Assemble item
      itemElement.appendChild(image);
      itemElement.appendChild(details);
      itemElement.appendChild(removeBtn);

      return itemElement;
    },

    createFooterContent(cartData, currentLang) {
      const isArabic = currentLang === 'ar';
      const currencySymbol = ' ر.س ';

      const footer = document.createElement('div');
      footer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 15px;
        direction: ${isArabic ? 'rtl' : 'ltr'};
      `;

      // Coupon Section
      const couponSection = document.createElement('div');
      couponSection.style.cssText = `
        padding: 15px 0;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      `;

      const couponForm = document.createElement('form');
      couponForm.style.cssText = `
        display: flex;
        gap: 10px;
      `;

      const couponInput = document.createElement('input');
      couponInput.type = 'text';
      couponInput.placeholder = isArabic ? 'أدخل رمز القسيمة' : 'Enter coupon code';
      couponInput.style.cssText = `
        flex: 1;
        padding: 8px 12px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        font-size: 0.9rem;
      `;

      const applyButton = document.createElement('button');
      applyButton.type = 'button';
      applyButton.textContent = isArabic ? 'تطبيق' : 'Apply';
      applyButton.style.cssText = `
        padding: 8px 16px;
        background: var(--theme-primary, #00b286);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      `;

      applyButton.addEventListener('click', async () => {
        const couponCode = couponInput.value.trim();
        if (couponCode) {
          try {
            await zid.store.cart.redeemCoupon(couponCode);
            this.updateCartDisplay();
          } catch (error) {
            alert(isArabic ? 'كود القسيمة غير صالح' : 'Invalid coupon code');
          }
        }
      });

      couponForm.appendChild(couponInput);
      couponForm.appendChild(applyButton);
      couponSection.appendChild(couponForm);

      // Subtotal
      const subtotal = document.createElement('div');
      subtotal.style.cssText = `
        display: flex;
        justify-content: space-between;
        font-weight: bold;
        margin-top: 10px;
      `;

      const formattedTotal = isArabic
        ? `${cartData.total.value.toFixed(2)} ${currencySymbol}`
        : `${currencySymbol} ${cartData.total.value.toFixed(2)}`;

      subtotal.innerHTML = `
        <span>${isArabic ? 'المجموع' : 'Subtotal'}</span>
        <span>${formattedTotal}</span>
      `;

      // Applied Coupon Display (if any)
      if (cartData.coupon) {
        const couponInfo = document.createElement('div');
        couponInfo.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          color: var(--theme-primary, #00b286);
        `;
        
        const couponText = document.createElement('span');
        couponText.textContent = isArabic ? 'القسيمة المطبقة:' : 'Applied Coupon:';
        
        const couponCode = document.createElement('span');
        couponCode.textContent = cartData.coupon.code;
        
        const removeButton = document.createElement('button');
        removeButton.textContent = '✕';
        removeButton.style.cssText = `
          border: none;
          background: none;
          color: #999;
          cursor: pointer;
          padding: 5px;
        `;
        removeButton.addEventListener('click', async () => {
          await zid.store.cart.removeCoupon();
          this.updateCartDisplay();
        });

        couponInfo.appendChild(couponText);
        couponInfo.appendChild(couponCode);
        couponInfo.appendChild(removeButton);
        footer.appendChild(couponInfo);
      }

      // Checkout button
      const checkoutBtn = document.createElement('button');
      checkoutBtn.textContent = isArabic ? 'إتمام الطلب' : 'Checkout';
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
      checkoutBtn.addEventListener('click', () => {
        window.location.href = '/auth/login?redirect_to=/checkout/choose-address-and-shipping';
      });

      footer.appendChild(couponSection);
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
      
      if (!cartData.products || cartData.products.length === 0) {
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
        
        // Hide footer when cart is empty
        footer.style.display = 'none';
      } else {
        cartData.products.forEach(item => {
          content.appendChild(this.createCartItem(item, currentLang));
        });
        
        // Show and update footer when cart has items
        footer.style.display = 'block';
        footer.innerHTML = '';
        footer.appendChild(this.createFooterContent(cartData, currentLang));
      }
    },

    openCart() {
      if (this.isOpen) return;
      
      const currentLang = getCurrentLanguage();
      const isRTL = currentLang === 'ar';
      
      this.cartElement.container.style.transform = `translateX(${isRTL ? '100%' : '-100%'})`;
      this.cartElement.backdrop.style.opacity = '1';
      this.cartElement.backdrop.style.visibility = 'visible';
      document.body.style.overflow = 'hidden';
      this.isOpen = true;

      this.updateCartDisplay();
    },

    closeCart() {
      if (!this.isOpen) return;

      this.cartElement.container.style.transform = 'translateX(0)';
      this.cartElement.backdrop.style.opacity = '0';
      this.cartElement.backdrop.style.visibility = 'hidden';
      document.body.style.overflow = '';
      this.isOpen = false;
    },

    handleCartUpdates() {
      // Override the original cart add function to show sliding cart
      const originalAddProduct = zid.store.cart.addProduct;
      zid.store.cart.addProduct = async (...args) => {
        try {
          const result = await originalAddProduct.apply(zid.store.cart, args);
          if (result.status === 'success') {
            setTimeout(() => {
              this.openCart();
              this.updateCartDisplay();
            }, 100);
          }
          return result;
        } catch (error) {
          console.error('Error in cart add:', error);
          throw error;
        }
      };
    },

    setupCartButton() {
      const cartButtons = document.querySelectorAll('.a-shopping-cart, .a-shopping-cart');
      cartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.openCart();
        });
      });
    },

    async initialize() {
      console.log('Initializing Sliding Cart');
      
      // Fetch settings
      const settings = await this.fetchSettings();
      if (!settings?.enabled) {
        console.log('Sliding Cart is disabled');
        return;
      }

      // Create cart structure
      this.createCartStructure();

      // Setup cart functionality
      this.handleCartUpdates();
      this.setupCartButton();

      // Setup mutation observer for dynamically added cart buttons
      const observer = new MutationObserver(() => {
        this.setupCartButton();
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
