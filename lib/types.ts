export interface PricingTier {
  minDays: number
  pricePerDay: number
}

export interface Product {
  id: string
  name: string
  description: string
  type: string
  category?: string
  price: number
  taxRate?: number
  pricingTiers?: PricingTier[]
  image?: string
  images?: string[]
  available?: boolean
  inventory?: number
  specifications?: {
    material?: string
    uvProtection?: string
    dimensions?: string
    [key: string]: string | undefined
  }
  features?: string[]
  dimensions?: string
  capacity?: string
  pickupLocationIds?: string[]
  bookingStartTime?: string
  bookingEndTime?: string
  bookingEndDayOffset?: number
}

export interface BookingSlot {
  date: string
  startTime: string
  endTime: string
  available: boolean
}

export interface CartItem extends Product {
  quantity: number
  pricePerDay?: number
  selectedDate?: string
  selectedTime?: string
  // New fields for daily booking
  startDate?: string
  endDate?: string
  numberOfDays?: number
  totalPrice?: number
  taxRate?: number
  startTime?: string
  endTime?: string
  endDayOffset?: number
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
  status: "confirmed" | "pending" | "completed" | "blocked" | "cancelled"
  price: number
  startDate?: string
  endDate?: string
  endDayOffset?: number
  location?: string
}
