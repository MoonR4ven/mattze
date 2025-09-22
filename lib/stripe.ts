import { loadStripe } from "@stripe/stripe-js"

export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export interface PaymentIntent {
  id: string
  client_secret: string
  amount: number
  currency: string
  status: string
}

export interface CreatePaymentIntentRequest {
  amount: number
  currency: string
  customerInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
    selectedDate?: string
    selectedTime?: string
  }>
}
