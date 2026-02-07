interface BillbeeCustomer {
  Name: string
  Email: string
  Tel1: string
  Street: string
  City: string
  Zip: string
  CountryCode: string
}

interface BillbeeOrderItem {
  SKU: string
  Title: string
  Quantity: number
  TotalPrice: number
  TaxRate: number
  TaxAmount: number
}

interface BillbeeComment {
  Text: string
}

interface BillbeeOrder {
  ExternalId: string
  ExternalReference: string
  OrderNumber: string
  State: number // 1 = Confirmed
  CreatedAt: string
  Customer: BillbeeCustomer
  OrderItems: BillbeeOrderItem[]
  TotalGross: number
  TotalNet: number
  Currency: string
  PaymentMethod: string
  ShippingCost: number
  Comments: BillbeeComment[]
}

// Helper function to generate calendar links
function generateCalendarLinks(
  productName: string,
  startDate: string,
  startTime: string,
  endDate: string,
  customerEmail: string,
  customerName: string,
  locale: string = "en",
  endTime?: string
): string {
  // Parse dates
  const [year, month, day] = startDate.split("-")
  const [hours, minutes] = startTime.split(":")
  const startDateTime = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`)
  
  // Calculate end time
  let endDateTime: Date
  if (endTime) {
    // Use provided end time
    const [endYear, endMonth, endDay] = endDate.split("-")
    const [endHours, endMinutes] = endTime.split(":")
    endDateTime = new Date(`${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}:00`)
  } else if (startDate === endDate) {
    // Single day booking - add 1 hour to start time
    endDateTime = new Date(startDateTime)
    endDateTime.setHours(endDateTime.getHours() + 1)
  } else {
    // Multi-day booking - use end date with same time as start
    endDateTime = new Date(endDate + "T" + startTime)
  }

  // Format dates for calendar (YYYYMMDDTHHMMSS format)
  const formatCalendarDate = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, "0")
    return (
      date.getFullYear() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      "00"
    )
  }

  const startFormatted = formatCalendarDate(startDateTime)
  const endFormatted = formatCalendarDate(endDateTime)

  // Translations for calendar text
  const translations = {
    en: {
      title: "Rental",
      description: "Rental period for {product}. Please contact us if you have any questions.",
      header: "📅 ADD TO YOUR CALENDAR:",
      googleCalendar: "Google Calendar",
      icalNote: "Or copy this iCal data for other calendar apps:",
    },
    de: {
      title: "Mietdauer",
      description: "Mietdauer für {product}. Bei Fragen kontaktieren Sie uns gerne.",
      header: "📅 ZU IHREM KALENDER HINZUFÜGEN:",
      googleCalendar: "Google Kalender",
      icalNote: "Oder kopieren Sie diese iCal-Daten für andere Kalender-Apps:",
    },
  }

  const t = translations[locale as keyof typeof translations] || translations.en
  const title = `${t.title}: ${productName}`
  const description = t.description.replace("{product}", productName)

  // Generate Google Calendar link
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${startFormatted}/${endFormatted}&details=${encodeURIComponent(
    description
  )}&location=MaVi%20Rental&sf=true&output=xml`

  // Generate Outlook/Office 365 link
  const outlookUrl = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
    title
  )}&startdt=${startDateTime.toISOString()}&enddt=${endDateTime.toISOString()}&body=${encodeURIComponent(
    description
  )}&location=MaVi%20Rental`

  // Generate iCal data (for download)
  const icalData = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//MaVi Rental//Booking//${locale.toUpperCase()}`,
    "BEGIN:VEVENT",
    `UID:${Date.now()}@mavirental.com`,
    `DTSTAMP:${formatCalendarDate(new Date())}Z`,
    `DTSTART:${startFormatted}Z`,
    `DTEND:${endFormatted}Z`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    "LOCATION:MaVi Rental",
    `ORGANIZER:mailto:info@mavirental.com`,
    `ATTENDEE:mailto:${customerEmail}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")

  return `${t.header}\n\n` +
    `${t.googleCalendar}: ${googleCalendarUrl}\n\n` +
    `Outlook/Office 365: ${outlookUrl}\n\n` +
    `${t.icalNote}\n${icalData}`
}

export class BillbeeAPI {
  private baseUrl = "https://app.billbee.io/api/v1"
  private apiKey: string
  private username: string
  private password: string

  constructor() {
    this.apiKey = process.env.BILLBEE_API_KEY!
    this.username = process.env.BILLBEE_USERNAME!
    this.password = process.env.BILLBEE_PASSWORD!
  }

  private getCountryCode(countryName: string): string {
    // Map country names to ISO 3166-1 alpha-2 codes
    const countryMap: { [key: string]: string } = {
      netherlands: "NL",
      germany: "DE",
      belgium: "BE",
      france: "FR",
      uk: "GB",
      "united kingdom": "GB",
      usa: "US",
      "united states": "US",
      italy: "IT",
      spain: "ES",
      poland: "PL",
      czech: "CZ",
      austria: "AT",
      sweden: "SE",
      denmark: "DK",
      norway: "NO",
      switzerland: "CH",
    }

    const normalized = countryName.toLowerCase().trim()
    return countryMap[normalized] || normalized.toUpperCase().slice(0, 2) || "NL"
  }

  private getAuthHeaders() {
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString("base64")
    return {
      Authorization: `Basic ${credentials}`,
      "X-Billbee-Api-Key": this.apiKey,
      "Content-Type": "application/json",
    }
  }

  async createOrder(orderData: {
    orderId: string
    paymentIntentId: string
    customerInfo: {
      firstName: string
      lastName: string
      email: string
      phone: string
      address?: string
      city?: string
      postalCode?: string
      country?: string
    }
    items: Array<{
      id: string
      name: string
      price: number
      quantity: number
      selectedDate?: string
      selectedTime?: string
      startDate?: string
      endDate?: string
      startTime?: string
      endTime?: string
      numberOfDays?: number
      taxRate?: number
      totalPrice?: number
    }>
    totalAmount: number
    currency: string
    locale?: string
    paymentMethod?: string
    deliveryInfo?: {
      fulfillmentOption?: string
      distanceKm?: number
      fee?: number
      pickupLocations?: Array<{ id: string; name: string; address: string }>
    }
    vatRate?: number
    paymentDate?: string
  }): Promise<{ success: boolean; billbeeOrderId?: string; error?: string }> {
    try {
      const defaultVatRate = (orderData.vatRate ?? 21) / 100
      const totalNet = orderData.totalAmount / (1 + defaultVatRate)
      const totalTax = orderData.totalAmount - totalNet

      console.log("📊 Billbee Order Data:", {
        items: orderData.items.length,
        totalAmount: orderData.totalAmount,
        currency: orderData.currency,
        customer: {
          name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
          email: orderData.customerInfo.email,
          phone: orderData.customerInfo.phone,
        }
      })

      // Map order items with the correct structure
      const orderItems = orderData.items.map((item, index) => {
        // Calculate total price: price per day * number of days * quantity
        const numberOfDays = (item as any).numberOfDays || 1
        const itemGross = item.totalPrice ?? item.price * numberOfDays * item.quantity
        const itemVatRate = (item.taxRate ?? orderData.vatRate ?? 21) / 100
        const itemTax = Math.round((itemGross * itemVatRate) * 100) / 100

        // Generate calendar link for this item
        let calendarNote = ""
        const hasDateRange = item.startDate && item.endDate
        const hasSingleDate = item.selectedDate && item.selectedTime
        
        if (hasDateRange || hasSingleDate) {
          const startDate = item.startDate || item.selectedDate
          const endDate = item.endDate || item.selectedDate
          const startTime = item.startTime || item.selectedTime || "00:00"
          const endTime = item.endTime
          
          if (startDate && endDate) {
            const calendarLinks = generateCalendarLinks(
              item.name,
              startDate,
              startTime,
              endDate,
              orderData.customerInfo.email,
              `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
              orderData.locale || "en",
              endTime
            )
            calendarNote = `\n\n${calendarLinks}`
          }
        }

        return {
          Product: {
            Title: item.selectedDate && item.selectedTime
                    ? `${item.name} (${item.selectedDate} at ${item.selectedTime}) - ${numberOfDays} day${numberOfDays > 1 ? 's' : ''}`
                    : `${item.name} - ${numberOfDays} day${numberOfDays > 1 ? 's' : ''}`,
            SkuOrId: item.id || `RENTAL-${Date.now()}`,
          },
          Quantity: item.quantity,
          TotalPrice: Math.round(itemGross * 100) / 100,
          TaxAmount: itemTax,
          TaxIndex: Math.round((itemVatRate * 100)) || 0,
          Attributes: calendarNote ? [
            {
              Name: "Calendar Links",
              Value: calendarNote
            }
          ] : undefined
        }
      })

      // Generate calendar links for all items with dates
      const locale = orderData.locale || "en"
      const calendarComments: BillbeeComment[] = []
      let calendarLinksText = ""
      
      orderData.items.forEach((item) => {
        // Check for date range bookings (startDate/endDate) or single date bookings (selectedDate)
        const hasDateRange = item.startDate && item.endDate
        const hasSingleDate = item.selectedDate && item.selectedTime
        
        if (hasDateRange || hasSingleDate) {
          const startDate = item.startDate || item.selectedDate
          const endDate = item.endDate || item.selectedDate
          const startTime = item.startTime || item.selectedTime || "00:00"
          const endTime = item.endTime // Can be undefined
          
          if (startDate && endDate) {
            const calendarLinks = generateCalendarLinks(
              item.name,
              startDate,
              startTime,
              endDate,
              orderData.customerInfo.email,
              `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
              locale,
              endTime
            )
            
            // Store as plain text instead of in comments array
            if (calendarLinksText) {
              calendarLinksText += "\n\n---\n\n"
            }
            calendarLinksText += calendarLinks
          }
        }
      })

      // Add a helpful message at the start if we have calendar links
      if (calendarLinksText) {
        const welcomeMessage = locale === "de"
          ? "🎉 Vielen Dank für Ihre Buchung! Klicken Sie auf die Links unten, um Ihre Mietdaten zu Ihrem Kalender hinzuzufügen:"
          : "🎉 Thank you for your rental! Click the links below to add your rental dates to your calendar:"
        
        calendarLinksText = welcomeMessage + "\n\n" + calendarLinksText
        
        // Add as a single comment
        calendarComments.push({
          Text: calendarLinksText
        })
      }

      const billbeeOrder = {
        OrderNumber: orderData.orderId,
        ExternalReference: orderData.paymentIntentId,
        State: 1,
        CreatedAt: orderData.paymentDate || new Date().toISOString(),
        PaymentDate: orderData.paymentDate || new Date().toISOString(),
        PaymentMethod: 1, // Billbee numeric code
        PaymentMethodName: orderData.paymentMethod || "Online Payment",
        ShippingCost: Math.round(((orderData.deliveryInfo?.fee ?? 0)) * 100) / 100,
        Currency: "EUR",
        TotalCost: Math.round(orderItems.reduce((sum, item) => sum + item.TotalPrice, 0) * 100) / 100,
        OrderItems: orderItems,
        // Comments: calendarComments.length > 0 ? calendarComments : undefined, // Temporarily disabled - causing SQL DateTime error
        Customer: {
          FirstName: orderData.customerInfo.firstName,
          LastName: orderData.customerInfo.lastName,
          Email: orderData.customerInfo.email,
          Tel1: orderData.customerInfo.phone || "",
          Street: orderData.customerInfo.address || "N/A",
          HouseNumber: "",
          Zip: orderData.customerInfo.postalCode || "1000",
          City: orderData.customerInfo.city || "Amsterdam",
          CountryISO2: this.getCountryCode(orderData.customerInfo.country || "NL"),
        },
        InvoiceAddress: {
          FirstName: orderData.customerInfo.firstName,
          LastName: orderData.customerInfo.lastName,
          Email: orderData.customerInfo.email,
          Tel1: orderData.customerInfo.phone || "",
          Street: orderData.customerInfo.address || "N/A",
          HouseNumber: "",
          Zip: orderData.customerInfo.postalCode || "1000",
          City: orderData.customerInfo.city || "Amsterdam",
          CountryISO2: this.getCountryCode(orderData.customerInfo.country || "NL"),
        },
        ShippingAddress: {
          FirstName: orderData.customerInfo.firstName,
          LastName: orderData.customerInfo.lastName,
          Email: orderData.customerInfo.email,
          Tel1: orderData.customerInfo.phone || "",
          Street: orderData.customerInfo.address || "N/A",
          HouseNumber: "",
          Zip: orderData.customerInfo.postalCode || "1000",
          City: orderData.customerInfo.city || "Amsterdam",
          CountryISO2: this.getCountryCode(orderData.customerInfo.country || "NL"),
        },
      }

      console.log("📤 Billbee Request Payload:", JSON.stringify(billbeeOrder, null, 2))

      const response = await fetch(`${this.baseUrl}/orders`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(billbeeOrder),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Billbee API error:", response.status, errorText)
        
        // Try to parse error details
        try {
          const errorJson = JSON.parse(errorText)
          console.error("❌ Billbee Error Details:", {
            code: errorJson.ErrorCode,
            message: errorJson.ErrorMessage,
            description: errorJson.ErrorDescription,
          })
        } catch {
          // Not JSON, ignore
        }
        
        return {
          success: false,
          error: `Billbee API error: ${response.status} ${errorText}`,
        }
      }

      const result = await response.json()
      console.log("✅ Billbee Response:", result)

      return {
        success: true,
        billbeeOrderId: result.Data?.BillBeeOrderId || result.Data?.Id,
      }
    } catch (error) {
      console.error("Error creating Billbee order:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getOrder(billbeeOrderId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${billbeeOrderId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Billbee API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching Billbee order:", error)
      throw error
    }
  }

  async updateOrderState(billbeeOrderId: string, state: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${billbeeOrderId}/orderstate`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ NewStateId: state }),
      })

      return response.ok
    } catch (error) {
      console.error("Error updating Billbee order state:", error)
      return false
    }
  }

  async createInvoice(billbeeOrderId: string): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${billbeeOrderId}/invoice`, {
        method: "POST",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to create invoice: ${response.status} ${errorText}`,
        }
      }

      const result = await response.json()

      return {
        success: true,
        invoiceId: result.Data?.Id || result.Id,
      }
    } catch (error) {
      console.error("Error creating Billbee invoice:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async addShipment(
    billbeeOrderId: string,
    shipmentData: {
      shippingId?: string
      comment?: string
      shippingProviderId?: number
      shippingProviderProductId?: number
      carrierId?: number
      shipmentType?: number
      trackingNumber?: string
    }
  ): Promise<{ success: boolean; shipmentId?: string; error?: string }> {
    try {
      const body = {
        ShippingId: shipmentData.shippingId,
        Comment: shipmentData.comment || "",
        ShippingProviderId: shipmentData.shippingProviderId || 0,
        ShippingProviderProductId: shipmentData.shippingProviderProductId || 0,
        CarrierId: shipmentData.carrierId || 0,
        ShipmentType: shipmentData.shipmentType || 0,
      }

      const response = await fetch(`${this.baseUrl}/orders/${billbeeOrderId}/shipment`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to add shipment: ${response.status} ${errorText}`,
        }
      }

      const result = await response.json()

      return {
        success: true,
        shipmentId: result.Data?.Id || result.Id,
      }
    } catch (error) {
      console.error("Error adding Billbee shipment:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async listOrders(options?: {
    page?: number
    pageSize?: number
    minOrderDate?: string
    maxOrderDate?: string
    states?: number[]
  }): Promise<{ success: boolean; orders?: any[]; totalCount?: number; error?: string }> {
    try {
      const params = new URLSearchParams()
      if (options?.page) params.append("page", options.page.toString())
      if (options?.pageSize) params.append("pageSize", options.pageSize.toString())
      if (options?.minOrderDate) params.append("minOrderDate", options.minOrderDate)
      if (options?.maxOrderDate) params.append("maxOrderDate", options.maxOrderDate)
      if (options?.states) params.append("orderStates", options.states.join(","))

      const url = `${this.baseUrl}/orders?${params.toString()}`

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Billbee API error: ${response.status} ${errorText}`,
        }
      }

      const result = await response.json()

      return {
        success: true,
        orders: result.Data || [],
        totalCount: result.TotalCount || 0,
      }
    } catch (error) {
      console.error("Error listing Billbee orders:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getProducts(options?: {
    page?: number
    pageSize?: number
  }): Promise<{ success: boolean; products?: any[]; totalCount?: number; error?: string }> {
    try {
      const params = new URLSearchParams()
      if (options?.page) params.append("page", options.page.toString())
      if (options?.pageSize) params.append("pageSize", options.pageSize.toString())

      const url = `${this.baseUrl}/products?${params.toString()}`

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Billbee API error: ${response.status} ${errorText}`,
        }
      }

      const result = await response.json()

      return {
        success: true,
        products: result.Data || [],
        totalCount: result.TotalCount || 0,
      }
    } catch (error) {
      console.error("Error listing Billbee products:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async createProduct(productData: {
    sku: string
    title: string
    description?: string
    price: number
    vatRate?: number
    stockQuantity?: number
  }): Promise<{ success: boolean; productId?: string; error?: string }> {
    try {
      const body = {
        SKU: productData.sku,
        Title: productData.title,
        Description: productData.description || "",
        Price: productData.price,
        VatRate: productData.vatRate || 0.21,
        StockQuantity: productData.stockQuantity || 0,
      }

      const response = await fetch(`${this.baseUrl}/products`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to create product: ${response.status} ${errorText}`,
        }
      }

      const result = await response.json()

      return {
        success: true,
        productId: result.Data?.Id || result.Id,
      }
    } catch (error) {
      console.error("Error creating Billbee product:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getCustomers(pageSize: number = 50): Promise<{ success: boolean; customers?: any[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/customers?pageSize=${pageSize}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Billbee Get Customers error:", response.status, errorText)
        return {
          success: false,
          error: `Billbee API error: ${response.status}`,
        }
      }

      const result = await response.json()
      if (result.Success && result.Data) {
        return {
          success: true,
          customers: result.Data,
        }
      }

      return {
        success: false,
        error: result.ErrorMessage || "Failed to fetch customers",
      }
    } catch (error) {
      console.error("❌ Error fetching Billbee customers:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async updateCustomer(customerData: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address?: string
    city?: string
    postalCode?: string
    country?: string
  }): Promise<{ success: boolean; customerId?: string; error?: string }> {
    try {
      console.log("👤 Updating Billbee customer:", {
        name: `${customerData.firstName} ${customerData.lastName}`,
        email: customerData.email,
        phone: customerData.phone,
      })

      // First, find existing customer by name (matching how Billbee stores them)
      const customersResult = await this.getCustomers(100)
      let existingCustomer = null
      
      if (customersResult.success && customersResult.customers) {
        const fullName = `${customerData.firstName} ${customerData.lastName}`
        existingCustomer = customersResult.customers.find(
          (c: any) => c.Name?.toLowerCase() === fullName.toLowerCase()
        )
        if (existingCustomer) {
          console.log(`📍 Found existing customer: ${existingCustomer.Id} (${existingCustomer.Name})`)
        }
      }

      // If customer exists, try to update their email and phone
      if (existingCustomer?.Id) {
        const updatePayload = {
          Email: customerData.email,
          Tel1: customerData.phone || "",
        }

        console.log(`🔄 Updating customer ${existingCustomer.Id} with email/phone:`, updatePayload)

        const response = await fetch(`${this.baseUrl}/customers/${existingCustomer.Id}`, {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(updatePayload),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ Billbee customer update error:`, response.status, errorText)
          return {
            success: false,
            error: `Update failed: ${response.status}`,
          }
        }

        const result = await response.json()
        console.log("✅ Customer updated:", JSON.stringify(result, null, 2))
        
        if (result.Success) {
          console.log(`✅ Billbee customer email/phone saved: ${existingCustomer.Id}`)
          return {
            success: true,
            customerId: existingCustomer.Id,
          }
        }
      } else {
        console.log("ℹ️ New customer - email will be saved when order is created")
        return {
          success: true,
        }
      }

      // Should not reach here, but if we do for existing customers not updated
      return {
        success: true,
        customerId: existingCustomer?.Id,
      }
    } catch (error) {
      console.error("❌ Error updating Billbee customer:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
