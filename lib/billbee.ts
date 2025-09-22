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
  Comments: string
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
    }>
    totalAmount: number
    currency: string
  }): Promise<{ success: boolean; billbeeOrderId?: string; error?: string }> {
    try {
      const taxRate = 0.21 // 21% VAT
      const totalNet = orderData.totalAmount / (1 + taxRate)
      const totalTax = orderData.totalAmount - totalNet

      const billbeeOrder: BillbeeOrder = {
        ExternalId: orderData.orderId,
        ExternalReference: orderData.paymentIntentId,
        OrderNumber: `REN-${orderData.orderId.slice(-8).toUpperCase()}`,
        State: 1, // Confirmed
        CreatedAt: new Date().toISOString(),
        Customer: {
          Name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`,
          Email: orderData.customerInfo.email,
          Tel1: orderData.customerInfo.phone,
          Street: orderData.customerInfo.address || "",
          City: orderData.customerInfo.city || "",
          Zip: orderData.customerInfo.postalCode || "",
          CountryCode: orderData.customerInfo.country?.toUpperCase() || "NL",
        },
        OrderItems: orderData.items.map((item) => {
          const itemNet = (item.price * item.quantity) / (1 + taxRate)
          const itemTax = item.price * item.quantity - itemNet

          return {
            SKU: item.id,
            Title:
              item.selectedDate && item.selectedTime
                ? `${item.name} (${item.selectedDate} at ${item.selectedTime})`
                : item.name,
            Quantity: item.quantity,
            TotalPrice: item.price * item.quantity,
            TaxRate: taxRate * 100, // Billbee expects percentage
            TaxAmount: itemTax,
          }
        }),
        TotalGross: orderData.totalAmount,
        TotalNet: totalNet,
        Currency: orderData.currency.toUpperCase(),
        PaymentMethod: "Stripe",
        ShippingCost: 0,
        Comments: `Rental booking order. Payment processed via Stripe (${orderData.paymentIntentId})`,
      }

      const response = await fetch(`${this.baseUrl}/orders`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(billbeeOrder),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Billbee API error:", response.status, errorText)
        return {
          success: false,
          error: `Billbee API error: ${response.status} ${errorText}`,
        }
      }

      const result = await response.json()

      return {
        success: true,
        billbeeOrderId: result.Data?.Id || result.Id,
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
}
