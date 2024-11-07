// src/scripts/slidingCart.js
// HMStudio Sliding Cart v1.1.8

(function() {
  console.log('Sliding Cart script initialized');

  // Add keyframe animation for spinner
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);

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

    fetchSettings: async function() {
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

    createCartStructure: function() {
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

    fetchCartData: async function() {
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

    updateItemQuantity: async function(cartProductId, productId, newQuantity) {
      try {
        await zid.store.cart.updateProduct(cartProductId, newQuantity, productId);
        await this.updateCartDisplay();
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    },

    removeItem: async function(cartProductId, productId) {
      try {
        await zid.store.cart.removeProduct(cartProductId, productId);
        await this.updateCartDisplay();
      } catch (error) {
        console.error('Error removing item:', error);
      }
    },
    createCartItem: function(item, currentLang) {
      const isArabic = currentLang === 'ar';

      const itemElement = document.createElement('div');
      itemElement.style.cssText = `
        display: flex;
        gap: 15px;
        padding: 15px 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        direction: ${isArabic ? 'rtl' : 'ltr'};
      `;

      // Product image
      const imageElement = document.createElement('img');
      imageElement.src = item.images?.[0]?.origin || item.images?.[0]?.thumbnail || '/path/to/default-image.jpg';
      imageElement.alt = item.name || '';
      imageElement.style.cssText = `
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
        gap: 12px;
      `;

      // Product name comes first
      const name = document.createElement('h3');
      name.textContent = item.name || '';
      name.style.cssText = `
        margin: 0;
        font-size: 0.9rem;
        font-weight: 500;
        color: #333;
      `;

      // Price container comes second, directly below name
      const priceContainer = document.createElement('div');
      priceContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        flex-direction: ${isArabic ? 'row-reverse' : 'row'};
        margin-bottom: auto;
      `;

      if (item.price_before && item.price_before !== item.price) {
        // Sale price (current price)
        const salePrice = document.createElement('div');
        salePrice.textContent = isArabic ? `${item.price_string}` : item.price_string;
        salePrice.style.cssText = `
          font-weight: bold;
          color: var(--theme-primary, #00b286);
        `;
        
        // Original price
        const originalPrice = document.createElement('div');
        originalPrice.textContent = isArabic ? `${item.price_before_string}` : item.price_before_string;
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
        price.textContent = isArabic ? `${item.price_string}` : item.price_string;
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
        btn.addEventListener('click', onClick.bind(this));
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
      itemElement.appendChild(imageElement);
      itemElement.appendChild(details);
      itemElement.appendChild(removeBtn);

      return itemElement;
    },

    createFooterContent: function(cartData, currentLang) {
      const isArabic = currentLang === 'ar';

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
        flex-direction: column;
        gap: 10px;
      `;

      // Add message container for coupon feedback
      const couponMessage = document.createElement('div');
      couponMessage.style.cssText = `
        font-size: 0.9rem;
        display: none;
        padding: 5px 0;
      `;

      const inputContainer = document.createElement('div');
      inputContainer.style.cssText = `
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
      applyButton.style.cssText = `
        padding: 8px 16px;
        background: var(--theme-primary, #00b286);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 80px;
        justify-content: center;
      `;

      // Create spinner element
      const spinner = document.createElement('div');
      spinner.style.cssText = `
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-right-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        display: none;
      `;

      const buttonText = document.createElement('span');
      buttonText.textContent = isArabic ? 'تطبيق' : 'Apply';

      applyButton.appendChild(spinner);
      applyButton.appendChild(buttonText);

      const self = this;
      applyButton.addEventListener('click', async () => {
        const couponCode = couponInput.value.trim();
        if (!couponCode) return;

        // Show spinner, disable input and button
        spinner.style.display = 'block';
        couponInput.disabled = true;
        applyButton.disabled = true;
        buttonText.style.opacity = '0.7';

        try {
          const response = await zid.store.cart.redeemCoupon(couponCode);
          
          if (response.status === 'success') {
            // Show success message
            couponMessage.style.cssText = `
              display: block;
              color: var(--theme-primary, #00b286);
            `;
            couponMessage.textContent = isArabic ? 'تم تطبيق القسيمة بنجاح' : 'Coupon applied successfully';
            
            // Update cart display
            self.updateCartDisplay();
          } else {
            // Show error message
            couponMessage.style.cssText = `
              display: block;
              color: #dc3545;
            `;
            couponMessage.textContent = isArabic ? 'القسيمة غير صالحة' : 'Invalid coupon code';
          }
        } catch (error) {
          // Show error message
          couponMessage.style.cssText = `
            display: block;
            color: #dc3545;
          `;
          couponMessage.textContent = isArabic ? 'القسيمة غير صالحة' : 'Invalid coupon code';
          console.error('Coupon error:', error);
        } finally {
          // Hide spinner, enable input and button
          spinner.style.display = 'none';
          couponInput.disabled = false;
          applyButton.disabled = false;
          buttonText.style.opacity = '1';
          
          // Clear input if successful
          if (couponMessage.style.color.includes('00b286')) {
            couponInput.value = '';
          }
        }
      });

      inputContainer.appendChild(couponInput);
      inputContainer.appendChild(applyButton);
      couponForm.appendChild(inputContainer);
      couponForm.appendChild(couponMessage);
      couponSection.appendChild(couponForm);

       // Create price summary section
       const priceSummary = document.createElement('div');
       priceSummary.style.cssText = `
         display: flex;
         flex-direction: column;
         gap: 10px;
         padding-top: 15px;
       `;
 
       // Original total (Subtotal before any discounts)
       const subtotalRow = document.createElement('div');
       subtotalRow.style.cssText = `
         display: flex;
         justify-content: space-between;
         align-items: center;
         font-size: 0.95rem;
       `;
       subtotalRow.innerHTML = `
         <span>${isArabic ? 'المجموع:' : 'Subtotal:'}</span>
         <span>${cartData.gross_price_string || '0.00 SAR'}</span>
       `;
       priceSummary.appendChild(subtotalRow);
 
       // Calculate total discount (difference between gross price and final price)
       const discountValue = (cartData.gross_price || 0) - (cartData.total || 0);
       if (discountValue > 0) {
         const discountRow = document.createElement('div');
         discountRow.style.cssText = `
           display: flex;
           justify-content: space-between;
           align-items: center;
           font-size: 0.95rem;
         `;
         discountRow.innerHTML = `
           <span>${isArabic ? 'قيمة الخصم:' : 'Discount value:'}</span>
           <span>${isArabic ? `${discountValue.toFixed(2)} ر.س` : `${discountValue.toFixed(2)} SAR`}</span>
         `;
         priceSummary.appendChild(discountRow);
       }
 
       // Final total with tax info
       const finalTotalContainer = document.createElement('div');
       finalTotalContainer.style.cssText = `
         border-top: 1px solid #eee;
         padding-top: 10px;
         margin-top: 5px;
       `;
 
       const totalRow = document.createElement('div');
       totalRow.style.cssText = `
         display: flex;
         justify-content: space-between;
         align-items: center;
         font-weight: bold;
         margin-bottom: 4px;
       `;
       totalRow.innerHTML = `
         <span>${isArabic ? 'المجموع:' : 'Total:'}</span>
         <span>${cartData.total_string || '0.00 SAR'}</span>
       `;
       finalTotalContainer.appendChild(totalRow);
 
       // Add VAT info if exists
       if (cartData.tax_percentage) {
         const vatInfo = document.createElement('div');
         vatInfo.style.cssText = `
           text-align: ${isArabic ? 'left' : 'right'};
           font-size: 0.8rem;
           color: #666;
         `;
         vatInfo.textContent = isArabic 
           ? `شامل الضريبة ${cartData.tax_percentage}٪`
           : `Including VAT ${cartData.tax_percentage}%`;
         finalTotalContainer.appendChild(vatInfo);
       }
 
       priceSummary.appendChild(finalTotalContainer);
 
       footer.appendChild(couponSection);
       footer.appendChild(priceSummary);

      // Checkout button
      const checkoutBtn = document.createElement('button');
      checkoutBtn.textContent = isArabic ? 'متابعة الطلب' : 'Proceed to Checkout';
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

      footer.appendChild(checkoutBtn);

      return footer;
    },

    updateCartDisplay: async function() {
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

    openCart: function() {
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

    closeCart: function() {
      if (!this.isOpen) return;

      this.cartElement.container.style.transform = 'translateX(0)';
      this.cartElement.backdrop.style.opacity = '0';
      this.cartElement.backdrop.style.visibility = 'hidden';
      document.body.style.overflow = '';
      this.isOpen = false;
    },

    handleCartUpdates: function() {
      const self = this;
      const originalAddProduct = zid.store.cart.addProduct;
      zid.store.cart.addProduct = async function(...args) {
        try {
          const result = await originalAddProduct.apply(zid.store.cart, args);
          if (result.status === 'success') {
            setTimeout(() => {
              self.openCart();
              self.updateCartDisplay();
            }, 100);
          }
          return result;
        } catch (error) {
          console.error('Error in cart add:', error);
          throw error;
        }
      };
    },

    setupCartButton: function() {
      const self = this;
      const cartButtons = document.querySelectorAll('.a-shopping-cart, .a-shopping-cart');
      cartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          self.openCart();
        });
      });
    },

    initialize: async function() {
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
      const self = this;
      const observer = new MutationObserver(() => {
        self.setupCartButton();
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
    document.addEventListener('DOMContentLoaded', () => {
      SlidingCart.initialize.call(SlidingCart);
    });
  } else {
    SlidingCart.initialize.call(SlidingCart);
  }
})();
