export interface Product {
  id: string
  name: string
  description: string
  type: string
  price: number
  image?: string
  available?: boolean
}

export interface BookingSlot {
  date: string
  startTime: string
  endTime: string
  available: boolean
}

export interface CartItem extends Product {
  quantity: number
  selectedDate?: string
  selectedTime?: string
  // New fields for daily booking
  startDate?: string
  endDate?: string
  numberOfDays?: number
  totalPrice?: number
}

export interface Order {
  id: string
  items: CartItem[]
  customerInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  totalAmount: number
  status: "pending" | "confirmed" | "completed" | "cancelled"
  createdAt: string
  bookingDate?: string
  bookingTime?: string
}

export interface Booking {
  productId: string
  productName: string
  startTime: string
  endTime: string
  customerEmail: string
  customerName: string
  status: "confirmed" | "pending" | "cancelled"
  price: number
}
