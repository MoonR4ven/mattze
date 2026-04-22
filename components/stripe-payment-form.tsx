"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Lock, CreditCard, AlertCircle } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useRouter } from "next/navigation"
import { useI18n } from "@/contexts/i18n-context"
import { getSettings, type AppSettings } from "@/lib/settings"
import { calculateSubtotal, calculateTaxTotal } from "@/lib/cart-pricing"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
const TERMS_URL = "https://www.mavi-rent.de/agb/"
const PRIVACY_URL = "https://www.mavi-rent.de/datenschutzerklarung/"

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
  const [showConsentDialog, setShowConsentDialog] = useState(false)
  const [consentAccepted, setConsentAccepted] = useState(false)

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings(null))
  }, [])

  const subtotal = calculateSubtotal(items)
  const vatRate = settings?.vatRate ?? 21
  const tax = calculateTaxTotal(items, vatRate)
  const deliveryTotal = deliveryFee ?? 0
  const totalAmount = subtotal + tax + deliveryTotal

  const persistLastOrder = () => {
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
  }

  const navigateToSuccess = (paymentIntentId?: string) => {
    const search = paymentIntentId ? `?payment_intent=${encodeURIComponent(paymentIntentId)}` : ""
    router.push(`/checkout/success${search}`)
  }

  const finalizeOrderSync = async (paymentIntentId: string): Promise<"success" | "retryable" | "failed"> => {
    try {
      const confirmResponse = await fetch("/api/confirm-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIntentId,
        }),
      })

      const result = await confirmResponse.json().catch(() => ({})) as {
        success?: boolean
        retryable?: boolean
        error?: string
      }

      if (confirmResponse.ok && result.success) {
        return "success"
      }

      if (confirmResponse.status === 202 || result.retryable) {
        return "retryable"
      }

      setError(result.error || t("checkout.orderConfirmationFailed"))
      return "failed"
    } catch (err) {
      console.error("Order confirmation failed:", err)
      setError(t("checkout.orderConfirmationFailed"))
      return "failed"
    }
  }

  const processPayment = async () => {
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
        return
      }

      if (!paymentIntent) {
        return
      }

      persistLastOrder()

      if (paymentIntent.status === "succeeded") {
        const finalizationResult = await finalizeOrderSync(paymentIntent.id)
        if (finalizationResult === "success") {
          clearCart()
          navigateToSuccess(paymentIntent.id)
          return
        }

        if (finalizationResult === "retryable") {
          navigateToSuccess(paymentIntent.id)
        }

        return
      }

      if (paymentIntent.status === "processing" || paymentIntent.status === "requires_action") {
        navigateToSuccess(paymentIntent.id)
        return
      }

      setError(t("checkout.paymentPendingFinalization"))
    } catch (err) {
      const fallbackMessage = err instanceof Error ? err.message : undefined
      setError(getLocalizedPaymentError(fallbackMessage, t))
    } finally {
      setProcessing(false)
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setConsentAccepted(false)
    setShowConsentDialog(true)
  }

  const handleConsentAccept = async () => {
    if (!consentAccepted || processing) {
      return
    }

    setShowConsentDialog(false)
    await processPayment()
  }

  const handleConsentDecline = () => {
    setShowConsentDialog(false)
    setConsentAccepted(false)
    router.push("/cart")
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

        <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("checkout.consentTitle")}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm text-left">
                  <p>{t("checkout.consentIntro")}</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>{t("checkout.consentPointBinding")}</li>
                    <li>
                      {t("checkout.consentPointTerms")} <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="underline">{t("checkout.termsOfService")}</a> · <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="underline">{t("checkout.privacyPolicy")}</a>
                    </li>
                    <li>{t("checkout.consentPointWithdrawal")}</li>
                    <li>{t("checkout.consentPointData")}</li>
                  </ul>
                  <label className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(event) => setConsentAccepted(event.target.checked)}
                    />
                    <span>{t("checkout.consentCheckbox")}</span>
                  </label>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleConsentDecline}>
                {t("checkout.consentDecline")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault()
                  void handleConsentAccept()
                }}
                disabled={!consentAccepted || processing}
              >
                {t("checkout.consentAccept")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
