"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
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

  const totalAmount = getTotalPrice() * 1.21 // Including 21% VAT

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Confirm payment with Payment Element
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      })

      if (stripeError) {
        setError(stripeError.message || "Payment failed")
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment succeeded - call confirm-payment to sync to Billbee/Calendar
        try {
          const confirmResponse = await fetch("/api/confirm-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
            }),
          })

          const result = await confirmResponse.json()

          if (result.success) {
            clearCart()
            router.push("/checkout/success")
          } else {
            setError("Payment processed but order confirmation failed")
          }
        } catch (err) {
          setError("Payment processed but order confirmation failed")
          console.error("Order confirmation failed:", err)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed")
    } finally {
      setProcessing(false)
    }
  }

  const cardElementOptions = {
    layout: "tabs",
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
            <PaymentElement />
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
            <Button type="submit" className="flex-1" disabled={!stripe || processing}>
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
  const { items, getTotalPrice } = useCart()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const totalAmount = getTotalPrice() * 1.21 // Including 21% VAT

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Math.round(totalAmount * 100),
            currency: "eur",
            customerInfo,
            items: items,
          }),
        })

        const { clientSecret: secret, error: err } = await response.json()

        if (!response.ok || err) {
          throw new Error(err || "Failed to create payment intent")
        }

        setClientSecret(secret)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize payment")
      } finally {
        setLoading(false)
      }
    }

    createPaymentIntent()
  }, [items, customerInfo, totalAmount])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!clientSecret) {
    return null
  }

  return (
    <Elements stripe={stripePromise} key={clientSecret} options={{ clientSecret }}>
      <PaymentForm customerInfo={customerInfo} onBack={onBack} />
    </Elements>
  )
}
