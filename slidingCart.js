// src/scripts/slidingCart.js
// HMStudio Sliding Cart v1.4.0
// the logs cleaned up version(from v1.3.9 last and not logs cleaned up)

;(() => {
  const styleSheet = document.createElement("style")
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(styleSheet)

  const couponMessages = {
    invalidCoupon: {
      ar: "القسيمة غير صالحة",
      en: "Invalid coupon code",
    },
    expiredCoupon: {
      ar: "انتهت صلاحية القسيمة",
      en: "Coupon has expired",
    },
    productNotEligible: {
      ar: "هذه القسيمة غير متوفرة للمنتجات المختارة",
      en: "This coupon is not available for the selected products",
    },
    minimumNotMet: {
      ar: "لم يتم الوصول إلى الحد الأدنى للطلب",
      en: "Minimum order amount not met",
    },
    alreadyUsed: {
      ar: "تم استخدام هذه القسيمة من قبل",
      en: "This coupon has already been used",
    },
    success: {
      ar: "تم تطبيق القسيمة بنجاح",
      en: "Coupon applied successfully",
    },
  }

  function getStoreIdFromUrl() {
    const scriptTag = document.currentScript
    const scriptUrl = new URL(scriptTag.src)
    const storeId = scriptUrl.searchParams.get("storeId")
    return storeId ? storeId.split("?")[0] : null
  }

  function getCurrentLanguage() {
    return document.documentElement.lang || "ar"
  }

  const storeId = getStoreIdFromUrl()
  if (!storeId) {
    return
  }

  // Placeholder for zid import.  This needs to be replaced with the actual import statement.
  const zid = {} // Replace with actual import of zid

  const SlidingCart = {
    cartElement: null,
    isOpen: false,

    fetchSettings: async () => {
      try {
        const response = await fetch(
          `https://europe-west3-hmstudio-85f42.cloudfunctions.net/getSlidingCartSettings?storeId=${storeId}`,
        )
        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.statusText}`)
        }
        const data = await response.json()
        return data
      } catch (error) {
        return null
      }
    },

    createCartStructure: function () {
      const currentLang = getCurrentLanguage()
      const isRTL = currentLang === "ar"

      const container = document.createElement("div")
      container.id = "hmstudio-sliding-cart"
      container.className = "hmstudio-cart-container"
      container.style.cssText = `
        position: fixed;
        top: 0;
        ${isRTL ? "right" : "left"}: 100%;
        width: 400px;
        height: 100vh;
        background: #fff;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
        transition: transform 300ms ease;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        direction: ${isRTL ? "rtl" : "ltr"};
      `

      const header = document.createElement("div")
      header.className = "hmstudio-cart-header"
      header.style.cssText = `
        padding: 20px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      `

      const title = document.createElement("h2")
      title.className = "hmstudio-cart-title"
      title.textContent = currentLang === "ar" ? "سلة التسوق" : "Shopping Cart"
      title.style.cssText = `
        margin: 0;
        font-size: 1.25rem;
        font-weight: bold;
      `

      const closeButton = document.createElement("button")
      closeButton.className = "hmstudio-cart-close"
      closeButton.innerHTML = "✕"
      closeButton.style.cssText = `
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 5px;
        opacity: 0.6;
        transition: opacity 0.3s;
      `
      closeButton.addEventListener("mouseover", () => (closeButton.style.opacity = "1"))
      closeButton.addEventListener("mouseout", () => (closeButton.style.opacity = "0.6"))
      closeButton.addEventListener("click", () => this.closeCart())

      header.appendChild(title)
      header.appendChild(closeButton)

      const content = document.createElement("div")
      content.className = "hmstudio-cart-content"
      content.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      `

      const footer = document.createElement("div")
      footer.className = "hmstudio-cart-footer"
      footer.style.cssText = `
        padding: 20px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
      `

      container.appendChild(header)
      container.appendChild(content)
      container.appendChild(footer)

      const backdrop = document.createElement("div")
      backdrop.id = "hmstudio-sliding-cart-backdrop"
      backdrop.className = "hmstudio-cart-backdrop"
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
      `

      backdrop.addEventListener("click", () => this.closeCart())

      document.body.appendChild(backdrop)
      document.body.appendChild(container)

      this.cartElement = {
        container,
        content,
        footer,
        backdrop,
      }

      return this.cartElement
    },
    fetchCartData: async () => {
      try {
        const response = await zid.store.cart.fetch()
        if (response.status === "success") {
          return response.data.cart
        }
        throw new Error("Failed to fetch cart data")
      } catch (error) {
        return null
      }
    },

    updateItemQuantity: async function (cartProductId, productId, newQuantity) {
      try {
        await zid.store.cart.updateProduct(cartProductId, newQuantity, productId)
        await this.updateCartDisplay()
      } catch (error) {}
    },

    removeItem: async function (cartProductId, productId) {
      try {
        await zid.store.cart.removeProduct(cartProductId, productId)
        await this.updateCartDisplay()
      } catch (error) {}
    },

    createCartItem: function (item, currentLang) {
      const isArabic = currentLang === "ar"

      const itemElement = document.createElement("div")
      itemElement.className = "hmstudio-cart-item"
      itemElement.style.cssText = `
        display: flex;
        gap: 15px;
        padding: 15px 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        direction: ${isArabic ? "rtl" : "ltr"};
      `

      const imageElement = document.createElement("img")
      imageElement.className = "hmstudio-cart-item-image"
      imageElement.src = item.images?.[0]?.origin || item.images?.[0]?.thumbnail || "/path/to/default-image.jpg"
      imageElement.alt = item.name || ""
      imageElement.style.cssText = `
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 4px;
      `

      const details = document.createElement("div")
      details.className = "hmstudio-cart-item-details"
      details.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 5px;
      `

      const name = document.createElement("h3")
      name.className = "hmstudio-cart-item-name"
      name.textContent = item.name || ""
      name.style.cssText = `
        margin: 0;
        font-size: 0.9rem;
        font-weight: 500;
      `

      const priceContainer = document.createElement("div")
      priceContainer.className = "hmstudio-cart-item-price-container"
      priceContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        flex-direction: ${isArabic ? "row-reverse" : "row"};
      `

      if (item.gross_sale_price && item.gross_price !== item.gross_sale_price) {
        const salePrice = document.createElement("div")
        salePrice.className = "hmstudio-cart-item-sale-price"
        const formattedSalePrice = isArabic
          ? `${item.gross_sale_price.toFixed(2)} ${currentLang === "en" ? "SAR" : "ر.س"}`
          : `${currentLang === "en" ? "SAR" : "ر.س"} ${item.gross_sale_price.toFixed(2)}`
        salePrice.textContent = formattedSalePrice
        salePrice.style.cssText = `
          font-weight: bold;
          color: var(--theme-primary, #00b286);
        `

        const originalPrice = document.createElement("div")
        originalPrice.className = "hmstudio-cart-item-original-price"
        const formattedOriginalPrice = isArabic
          ? `${item.gross_price.toFixed(2)} ${currentLang === "en" ? "SAR" : "ر.س"}`
          : `${currentLang === "en" ? "SAR" : "ر.س"} ${item.gross_price.toFixed(2)}`
        originalPrice.textContent = formattedOriginalPrice
        originalPrice.style.cssText = `
          text-decoration: line-through;
          color: #999;
          font-size: 0.9em;
          margin-${isArabic ? "left" : "right"}: 8px;
        `

        if (isArabic) {
          priceContainer.appendChild(originalPrice)
          priceContainer.appendChild(salePrice)
        } else {
          priceContainer.appendChild(salePrice)
          priceContainer.appendChild(originalPrice)
        }
      } else {
        const price = document.createElement("div")
        price.className = "hmstudio-cart-item-price"
        const priceValue = item.gross_price || item.price
        const formattedPrice = isArabic
          ? `${priceValue.toFixed(2)} ${currentLang === "en" ? "SAR" : "ر.س"}`
          : `${currentLang === "en" ? "SAR" : "ر.س"} ${priceValue.toFixed(2)}`
        price.textContent = formattedPrice
        price.style.cssText = `
          font-weight: bold;
          color: var(--theme-primary, #00b286);
        `
        priceContainer.appendChild(price)
      }

      const quantityControls = document.createElement("div")
      quantityControls.className = "hmstudio-cart-item-quantity"
      quantityControls.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: auto;
      `

      const createButton = (text, onClick) => {
        const btn = document.createElement("button")
        btn.className = `hmstudio-cart-quantity-${text === "+" ? "increase" : "decrease"}`
        btn.textContent = text
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
          transition: background-color 0.3s;
        `
        btn.addEventListener("mouseover", () => {
          btn.style.backgroundColor = "#f0f0f0"
        })
        btn.addEventListener("mouseout", () => {
          btn.style.backgroundColor = "transparent"
        })
        btn.addEventListener("click", onClick.bind(this))
        return btn
      }

      const decreaseBtn = createButton("-", () => {
        if (item.quantity > 1) {
          this.updateItemQuantity(item.id, item.product_id, item.quantity - 1)
        }
      })

      const quantity = document.createElement("span")
      quantity.className = "hmstudio-cart-quantity-value"
      quantity.textContent = item.quantity
      quantity.style.cssText = `
        min-width: 20px;
        text-align: center;
      `

      const increaseBtn = createButton("+", () => {
        this.updateItemQuantity(item.id, item.product_id, item.quantity + 1)
      })

      const removeBtn = document.createElement("button")
      removeBtn.className = "hmstudio-cart-item-remove"
      removeBtn.innerHTML = "🗑️"
      removeBtn.style.cssText = `
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
        margin-${isArabic ? "right" : "left"}: auto;
        font-size: 1.2rem;
        opacity: 0.7;
        transition: opacity 0.3s;
      `
      removeBtn.addEventListener("mouseover", () => {
        removeBtn.style.opacity = "1"
      })
      removeBtn.addEventListener("mouseout", () => {
        removeBtn.style.opacity = "0.7"
      })
      removeBtn.addEventListener("click", () => {
        this.removeItem(item.id, item.product_id)
      })

      quantityControls.appendChild(decreaseBtn)
      quantityControls.appendChild(quantity)
      quantityControls.appendChild(increaseBtn)

      details.appendChild(name)
      details.appendChild(priceContainer)
      details.appendChild(quantityControls)

      itemElement.appendChild(imageElement)
      itemElement.appendChild(details)
      itemElement.appendChild(removeBtn)

      return itemElement
    },
    createFooterContent: function (cartData, currentLang) {
      const isArabic = currentLang === "ar"
      const currencySymbol = currentLang === "en" ? "SAR" : "ر.س"

      const footer = document.createElement("div")
      footer.className = "hmstudio-cart-footer-content"
      footer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 15px;
        direction: ${isArabic ? "rtl" : "ltr"};
      `

      function getErrorType(response) {
        const errorMessage = (response.data?.message || "").toLowerCase()

        if (
          errorMessage.includes("فترة إستخدام الكوبون لم تبدأ بعد أو أنها انتهت") ||
          errorMessage.includes("لم تبدأ بعد أو أنها انتهت") ||
          errorMessage.includes("منتهية الصلاحية") ||
          errorMessage.includes("expired")
        ) {
          return "expiredCoupon"
        }

        if (
          errorMessage.includes("قيمة منتجات") ||
          errorMessage.includes("حد أدنى") ||
          errorMessage.includes("200.00") ||
          errorMessage.includes("يتطلب حد")
        ) {
          return "minimumNotMet"
        }

        if (
          errorMessage.includes("السلة لا تحتوي أي منتج من المنتجات المشمولة") ||
          errorMessage.includes("not eligible") ||
          errorMessage.includes("not applicable")
        ) {
          return "productNotEligible"
        }

        if (
          errorMessage.includes("تم استخدام") ||
          errorMessage.includes("مستخدمة مسبقا") ||
          errorMessage.includes("already used") ||
          errorMessage.includes("used before")
        ) {
          return "alreadyUsed"
        }

        return "invalidCoupon"
      }

      const couponSection = document.createElement("div")
      couponSection.className = "hmstudio-cart-coupon-section"
      couponSection.style.cssText = `
        padding: 15px 0;
      `

      const couponForm = document.createElement("form")
      couponForm.className = "hmstudio-cart-coupon-form"
      couponForm.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px;
      `

      couponForm.addEventListener("submit", (e) => {
        e.preventDefault()
      })

      const couponMessage = document.createElement("div")
      couponMessage.className = "hmstudio-cart-coupon-message"
      couponMessage.style.cssText = `
        font-size: 0.9rem;
        display: none;
        padding: 8px 12px;
        border-radius: 4px;
        margin-top: 8px;
      `

      const inputContainer = document.createElement("div")
      inputContainer.className = "hmstudio-cart-coupon-input-container"
      inputContainer.style.cssText = `
        display: flex;
        gap: 10px;
      `

      const couponInput = document.createElement("input")
      couponInput.className = "hmstudio-cart-coupon-input"
      couponInput.type = "text"
      couponInput.placeholder = isArabic ? "أدخل رمز القسيمة" : "Enter coupon code"
      couponInput.style.cssText = `
        flex: 1;
        padding: 8px 12px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        font-size: 0.9rem;
        transition: border-color 0.3s;
      `

      couponInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          applyButton.click()
        }
      })

      couponInput.addEventListener("focus", () => {
        couponInput.style.borderColor = "var(--theme-primary, #00b286)"
      })

      couponInput.addEventListener("blur", () => {
        couponInput.style.borderColor = "rgba(0, 0, 0, 0.1)"
      })

      function showCouponMessage(type, isArabic) {
        const message = couponMessages[type][isArabic ? "ar" : "en"]
        couponMessage.style.display = "block"
        couponMessage.textContent = message

        if (type === "success") {
          couponMessage.style.cssText = `
            display: block;
            padding: 8px 12px;
            border-radius: 4px;
            margin-top: 8px;
            background-color: rgba(0, 178, 134, 0.1);
            color: var(--theme-primary, #00b286);
          `
          couponInput.value = ""
        } else {
          couponMessage.style.cssText = `
            display: block;
            padding: 8px 12px;
            border-radius: 4px;
            margin-top: 8px;
            background-color: rgba(220, 53, 69, 0.1);
            color: #dc3545;
          `
        }
      }

      const applyButton = document.createElement("button")
      applyButton.className = "hmstudio-cart-coupon-apply"
      applyButton.type = "button"
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
        transition: opacity 0.3s, background-color 0.3s;
      `

      applyButton.addEventListener("mouseover", () => {
        if (!applyButton.disabled) {
          applyButton.style.opacity = "0.9"
        }
      })

      applyButton.addEventListener("mouseout", () => {
        if (!applyButton.disabled) {
          applyButton.style.opacity = "1"
        }
      })

      const spinner = document.createElement("div")
      spinner.className = "hmstudio-cart-coupon-spinner"
      spinner.style.cssText = `
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-right-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        display: none;
      `

      const buttonText = document.createElement("span")
      buttonText.className = "hmstudio-cart-coupon-button-text"
      buttonText.textContent = isArabic ? "تطبيق" : "Apply"

      applyButton.appendChild(spinner)
      applyButton.appendChild(buttonText)

      applyButton.addEventListener("click", async () => {
        const couponCode = couponInput.value.trim()
        if (!couponCode) return

        spinner.style.display = "block"
        couponInput.disabled = true
        applyButton.disabled = true
        buttonText.style.opacity = "0.7"

        try {
          const response = await zid.store.cart.redeemCoupon(couponCode)

          if (response.status === "success") {
            showCouponMessage("success", isArabic)
            this.updateCartDisplay()
          } else {
            const errorType = getErrorType(response)
            showCouponMessage(errorType, isArabic)
          }
        } catch (error) {
          const errorResponse = {
            data: { message: error.message || "" },
            status: "error",
          }
          const errorType = getErrorType(errorResponse)
          showCouponMessage(errorType, isArabic)
        } finally {
          spinner.style.display = "none"
          couponInput.disabled = false
          applyButton.disabled = false
          buttonText.style.opacity = "1"
        }
      })

      inputContainer.appendChild(couponInput)
      inputContainer.appendChild(applyButton)
      couponForm.appendChild(inputContainer)
      couponForm.appendChild(couponMessage)
      couponSection.appendChild(couponForm)

      if (cartData.coupon) {
        const appliedCouponContainer = document.createElement("div")
        appliedCouponContainer.className = "hmstudio-cart-applied-coupon"
        appliedCouponContainer.style.cssText = `
          margin-top: 10px;
          padding: 12px;
          background-color: rgba(0, 178, 134, 0.1);
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        `

        const couponInfo = document.createElement("div")
        couponInfo.className = "hmstudio-cart-coupon-info"
        couponInfo.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 4px;
        `

        const couponTitle = document.createElement("span")
        couponTitle.className = "hmstudio-cart-coupon-title"
        couponTitle.textContent = isArabic ? "القسيمة المطبقة:" : "Applied Coupon:"
        couponTitle.style.cssText = `
          font-size: 0.8rem;
          color: #666;
        `

        const couponCode = document.createElement("span")
        couponCode.className = "hmstudio-cart-coupon-code"
        couponCode.textContent = cartData.coupon.code
        couponCode.style.cssText = `
          font-weight: 500;
          color: var(--theme-primary, #00b286);
        `

        const removeButton = document.createElement("button")
        removeButton.className = "hmstudio-cart-coupon-remove"
        removeButton.innerHTML = "✕"
        removeButton.style.cssText = `
          border: none;
          background: none;
          color: #666;
          cursor: pointer;
          padding: 5px;
          font-size: 1.1rem;
          opacity: 0.7;
          transition: opacity 0.3s;
        `

        removeButton.addEventListener("mouseover", () => {
          removeButton.style.opacity = "1"
        })

        removeButton.addEventListener("mouseout", () => {
          removeButton.style.opacity = "0.7"
        })

        removeButton.addEventListener("click", async (e) => {
          e.preventDefault()
          try {
            await zid.store.cart.removeCoupon()
            await this.updateCartDisplay()
          } catch (error) {}
        })

        couponInfo.appendChild(couponTitle)
        couponInfo.appendChild(couponCode)
        appliedCouponContainer.appendChild(couponInfo)
        appliedCouponContainer.appendChild(removeButton)
        couponForm.appendChild(appliedCouponContainer)
      }

      const originalSubtotal = cartData.products.reduce((acc, product) => {
        const originalPrice = product.gross_price || product.price
        return acc + originalPrice * product.quantity
      }, 0)

      const subtotal = document.createElement("div")
      subtotal.className = "hmstudio-cart-subtotal"
      subtotal.style.cssText = `
        display: flex;
        justify-content: space-between;
        color: #666;
        font-size: 0.9rem;
        margin-top: 15px;
      `

      const subTotalFormatted = isArabic
        ? `${originalSubtotal.toFixed(2)} ${currencySymbol}`
        : `${currencySymbol} ${originalSubtotal.toFixed(2)}`

      subtotal.innerHTML = `
        <span>${isArabic ? "المجموع الفرعي:" : "Subtotal:"}</span>
        <span>${subTotalFormatted}</span>
      `

      footer.appendChild(subtotal)

      const calculateTotalDiscount = () => {
        let totalDiscount = 0

        cartData.products.forEach((product) => {
          if (product.gross_sale_price && product.gross_sale_price !== product.gross_price) {
            const regularPrice = product.gross_price || 0
            const salePrice = product.gross_sale_price || regularPrice
            totalDiscount += (regularPrice - salePrice) * product.quantity
          }
        })

        if (cartData.coupon && cartData.coupon.discount_amount) {
          totalDiscount += Number.parseFloat(cartData.coupon.discount_amount)
        }

        return totalDiscount
      }

      const totalDiscount = calculateTotalDiscount()
      if (totalDiscount > 0 || (cartData.coupon && cartData.coupon.discount_amount > 0)) {
        const discountInfo = document.createElement("div")
        discountInfo.className = "hmstudio-cart-discount-info"
        discountInfo.style.cssText = `
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          color: var(--theme-primary, #00b286);
          font-size: 0.9rem;
        `

        const formattedDiscount = isArabic
          ? `${totalDiscount.toFixed(2)} ${currencySymbol}`
          : `${currencySymbol} ${totalDiscount.toFixed(2)}`

        discountInfo.innerHTML = `
          <span>${isArabic ? "قيمة الخصم:" : "Discount:"}</span>
          <span>${formattedDiscount}</span>
        `

        footer.appendChild(discountInfo)
      }

      if (cartData.tax_percentage > 0) {
        const taxInfo = document.createElement("div")
        taxInfo.className = "hmstudio-cart-tax-info"
        taxInfo.style.cssText = `
          display: flex;
          justify-content: space-between;
          color: #666;
          font-size: 0.9rem;
          padding: 5px 0;
        `

        const taxAmount = (cartData.products_subtotal * (cartData.tax_percentage / 100)).toFixed(2)
        const formattedTax = isArabic
          ? `${taxAmount} ${currencySymbol} (${cartData.tax_percentage}٪)`
          : `${currencySymbol} ${taxAmount} (${cartData.tax_percentage}%)`

        taxInfo.innerHTML = `
          <span>${isArabic ? "الضريبة:" : "Tax:"}</span>
          <span>${formattedTax}</span>
        `

        footer.appendChild(taxInfo)
      }

      const total = document.createElement("div")
      total.className = "hmstudio-cart-total"
      total.style.cssText = `
        display: flex;
        justify-content: space-between;
        font-weight: bold;
        font-size: 1.1rem;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
      `

      const formattedTotal = isArabic
        ? `${cartData.total.value.toFixed(2)} ${currencySymbol}`
        : `${currencySymbol} ${cartData.total.value.toFixed(2)}`

      total.innerHTML = `
        <span>${isArabic ? "المجموع:" : "Total:"}</span>
        <span>${formattedTotal}</span>
      `

      footer.appendChild(total)

      const checkoutBtn = document.createElement("button")
      checkoutBtn.className = "hmstudio-cart-checkout-button"
      checkoutBtn.textContent = isArabic ? "إتمام الطلب" : "Checkout"
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
       margin-top: 15px;
     `

      checkoutBtn.addEventListener("mouseover", () => {
        checkoutBtn.style.opacity = "0.9"
      })

      checkoutBtn.addEventListener("mouseout", () => {
        checkoutBtn.style.opacity = "1"
      })

      checkoutBtn.addEventListener("click", () => {
        const checkoutLink = document.querySelector('a[href="/checkout/choose-address-and-shipping"]')

        if (!checkoutLink || checkoutLink.style.display === "none") {
          const redirectUrl = encodeURIComponent("/checkout/choose-address-and-shipping")
          window.location.href = `/auth/login?redirect_to=${redirectUrl}`
        } else {
          checkoutLink.click()
        }
      })

      footer.appendChild(couponSection)
      footer.appendChild(checkoutBtn)

      return footer
    },

    updateCartDisplay: async function () {
      const cartData = await this.fetchCartData()
      if (!cartData) return

      const currentLang = getCurrentLanguage()
      const { content, footer } = this.cartElement

      content.innerHTML = ""

      if (!cartData.products || cartData.products.length === 0) {
        const emptyMessage = document.createElement("div")
        emptyMessage.className = "hmstudio-cart-empty-message"
        emptyMessage.style.cssText = `
         text-align: center;
         padding: 40px 20px;
         color: rgba(0, 0, 0, 0.5);
       `
        emptyMessage.textContent = currentLang === "ar" ? "سلة التسوق فارغة" : "Your cart is empty"
        content.appendChild(emptyMessage)

        footer.style.display = "none"
      } else {
        cartData.products.forEach((item) => {
          content.appendChild(this.createCartItem(item, currentLang))
        })

        footer.style.display = "block"
        footer.innerHTML = ""
        footer.appendChild(this.createFooterContent(cartData, currentLang))
      }
    },

    openCart: function () {
      if (this.isOpen) return

      const currentLang = getCurrentLanguage()
      const isRTL = currentLang === "ar"

      this.cartElement.container.style.transform = `translateX(${isRTL ? "100%" : "-100%"})`
      this.cartElement.backdrop.style.opacity = "1"
      this.cartElement.backdrop.style.visibility = "visible"
      document.body.style.overflow = "hidden"
      this.isOpen = true

      this.updateCartDisplay()
    },

    closeCart: function () {
      if (!this.isOpen) return

      this.cartElement.container.style.transform = "translateX(0)"
      this.cartElement.backdrop.style.opacity = "0"
      this.cartElement.backdrop.style.visibility = "hidden"
      document.body.style.overflow = ""
      this.isOpen = false
    },

    handleCartUpdates: function () {
      const self = this

      if (typeof zid === "undefined" || !zid.store || !zid.store.cart) {
        const checkZid = setInterval(() => {
          if (typeof zid !== "undefined" && zid.store && zid.store.cart) {
            clearInterval(checkZid)
            initializeCartHandler()
          }
        }, 100)

        return
      }

      initializeCartHandler()

      function initializeCartHandler() {
        const originalAddProduct = zid.store.cart.addProduct
        zid.store.cart.addProduct = async (...args) => {
          try {
            const result = await originalAddProduct.apply(zid.store.cart, args)
            if (result.status === "success") {
              setTimeout(() => {
                self.openCart()
                self.updateCartDisplay()
              }, 100)
            }
            return result
          } catch (error) {
            throw error
          }
        }
      }
    },

    setupCartButton: function () {
      const headerCart = document.querySelector(".header-cart")
      if (headerCart) {
        headerCart.addEventListener("click", (e) => {
          e.preventDefault()
          e.stopPropagation()
          this.openCart()
        })
      }
      const cartButtons = document.querySelectorAll(".a-shopping-cart, .a-shopping-cart")
      cartButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
          e.preventDefault()
          e.stopPropagation()
          this.openCart()
        })
      })
    },

    initialize: async function () {
      const settings = await this.fetchSettings()
      if (!settings?.enabled) {
        return
      }

      this.createCartStructure()

      const waitForZid = () => {
        if (typeof zid !== "undefined" && zid.store && zid.store.cart) {
          this.handleCartUpdates()
          this.setupCartButton()

          const self = this
          const observer = new MutationObserver(() => {
            self.setupCartButton()
          })

          observer.observe(document.body, {
            childList: true,
            subtree: true,
          })
        } else {
          setTimeout(waitForZid, 100)
        }
      }

      waitForZid()
    },
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      SlidingCart.initialize.call(SlidingCart)
    })
  } else {
    SlidingCart.initialize.call(SlidingCart)
  }
})()
