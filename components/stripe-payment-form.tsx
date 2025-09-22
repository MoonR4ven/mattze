"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, CreditCard, AlertCircle } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useRouter } from "next/navigation"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
  notes: string
}

interface StripePaymentFormProps {
  customerInfo: CustomerInfo
  onBack: () => void
}

function PaymentForm({ customerInfo, onBack }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { items, getTotalPrice, clearCart } = useCart()
  const router = useRouter()

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const totalAmount = getTotalPrice() * 1.21 // Including 21% VAT

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent()
  }, [])

  const createPaymentIntent = async () => {
    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: "eur",
          customerInfo,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            selectedDate: item.selectedDate,
            selectedTime: item.selectedTime,
          })),
        }),
      })

      const data = await response.json()

      if (data.clientSecret) {
        setClientSecret(data.clientSecret)
      } else {
        setError("Failed to initialize payment")
      }
    } catch (err) {
      setError("Failed to initialize payment")
      console.error("Payment intent creation failed:", err)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setProcessing(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setError("Card element not found")
      setProcessing(false)
      return
    }

    // Confirm payment
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: {
            line1: customerInfo.address,
            city: customerInfo.city,
            postal_code: customerInfo.postalCode,
            country: customerInfo.country.toLowerCase(),
          },
        },
      },
    })

    if (stripeError) {
      setError(stripeError.message || "Payment failed")
      setProcessing(false)
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // Confirm payment on server and create order
      try {
        const response = await fetch("/api/confirm-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
          }),
        })

        const result = await response.json()

        if (result.success) {
          clearCart()
          router.push(`/checkout/success?orderId=${result.orderId}`)
        } else {
          setError("Failed to process order")
        }
      } catch (err) {
        setError("Failed to process order")
        console.error("Order creation failed:", err)
      }

      setProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "hsl(var(--foreground))",
        "::placeholder": {
          color: "hsl(var(--muted-foreground))",
        },
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Card Details</label>
            <div className="p-3 border rounded-md bg-background">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1 mb-2">
              <Lock className="h-3 w-3" />
              <span>Your payment information is secure and encrypted</span>
            </div>
            <p>We accept Visa, Mastercard, American Express, and other major cards.</p>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1 bg-transparent"
              disabled={processing}
            >
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={!stripe || processing || !clientSecret}>
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Pay €{totalAmount.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function StripePaymentForm({ customerInfo, onBack }: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm customerInfo={customerInfo} onBack={onBack} />
    </Elements>
  )
}
