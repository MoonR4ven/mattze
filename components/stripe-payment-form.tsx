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
import { useI18n } from "@/contexts/i18n-context"
import { getSettings, type AppSettings } from "@/lib/settings"
import { calculateSubtotal, calculateTaxTotal } from "@/lib/cart-pricing"

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

function getLocalizedPaymentError(message: string | undefined, t: (key: string) => string): string {
  if (!message) return t("checkout.paymentFailed")

  const normalized = message.toLowerCase()
  if (normalized.includes("used a known test card")) {
    return t("checkout.paymentKnownTestCard")
  }
  if (normalized.includes("card was declined")) {
    return t("checkout.cardDeclined")
  }

  return message
}

function PaymentForm({ customerInfo, onBack }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { t } = useI18n()
  const { items, clearCart, deliveryFee, fulfillmentOption, deliveryDistanceKm, pickupLocations } = useCart()
  const router = useRouter()
  const [settings, setSettings] = useState<AppSettings | null>(null)

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings(null))
  }, [])

  const subtotal = calculateSubtotal(items)
  const vatRate = settings?.vatRate ?? 21
  const tax = calculateTaxTotal(items, vatRate)
  const deliveryTotal = deliveryFee ?? 0
  const totalAmount = subtotal + tax + deliveryTotal

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
        setError(getLocalizedPaymentError(stripeError.message, t))
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
            // Store order data in sessionStorage for success page
            sessionStorage.setItem("lastOrder", JSON.stringify({
              customerInfo,
              items,
              fulfillmentOption,
              deliveryDistanceKm,
              deliveryFee: deliveryTotal,
              pickupLocations,
              pricing: {
                subtotal,
                tax,
                vatRate,
                deliveryFee: deliveryTotal,
                total: totalAmount,
              },
            }))
            clearCart()
            router.push("/checkout/success")
          } else {
            setError(t("checkout.orderConfirmationFailed"))
          }
        } catch (err) {
          setError(t("checkout.orderConfirmationFailed"))
          console.error("Order confirmation failed:", err)
        }
      }
    } catch (err) {
      const fallbackMessage = err instanceof Error ? err.message : undefined
      setError(getLocalizedPaymentError(fallbackMessage, t))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card className="bg-slate-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t("checkout.paymentInformation")}
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
            <label className="text-sm font-medium">{t("checkout.cardDetails")}</label>
            <PaymentElement />
          </div>

          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1 mb-2">
              <Lock className="h-3 w-3" />
              <span>{t("checkout.secure")}</span>
            </div>
            <p>{t("checkout.acceptedCards")}</p>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1 bg-transparent"
              disabled={processing}
            >
              {t("checkout.back")}
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-[rgb(var(--mavi-dark-teal))] font-semibold hover:text-black shadow-lg transition-all" disabled={!stripe || processing}>
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  {t("checkout.processing")}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  {t("checkout.pay")} €{totalAmount.toFixed(2)}
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
  const { items, deliveryFee, fulfillmentOption, deliveryDistanceKm, pickupLocations } = useCart()
  const { locale, t } = useI18n()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings(null))
  }, [])

  const subtotal = calculateSubtotal(items)
  const vatRate = settings?.vatRate ?? 21
  const tax = calculateTaxTotal(items, vatRate)
  const deliveryTotal = deliveryFee ?? 0
  const totalAmount = subtotal + tax + deliveryTotal

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
            locale: locale,
            deliveryInfo: {
              fulfillmentOption,
              distanceKm: deliveryDistanceKm,
              fee: deliveryTotal,
              pickupLocations,
            },
            pricing: {
              subtotal,
              tax,
              vatRate,
              deliveryFee: deliveryTotal,
              total: totalAmount,
            },
          }),
        })

        const { clientSecret: secret, error: err } = await response.json()

        if (!response.ok || err) {
          throw new Error(err || t("checkout.paymentInitFailed"))
        }

        setClientSecret(secret)
      } catch (err) {
        setError(err instanceof Error ? err.message : t("checkout.paymentInitFailed"))
      } finally {
        setLoading(false)
      }
    }

    createPaymentIntent()
  }, [
    items,
    customerInfo,
    totalAmount,
    fulfillmentOption,
    deliveryDistanceKm,
    deliveryTotal,
    pickupLocations,
    locale,
    subtotal,
    tax,
    vatRate,
    t,
  ])

  if (loading) {
    return (
      <Card className="bg-slate-100">
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
      <Card className="bg-slate-100">
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
