"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { CreditCard, ArrowLeft, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { getSettings, type AppSettings } from "@/lib/settings"
import { calculateSubtotal, calculateTaxTotal } from "@/lib/cart-pricing"
import { useI18n } from "@/contexts/i18n-context"

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

interface PaymentFormProps {
  customerInfo: CustomerInfo
  onBack: () => void
}

export function PaymentForm({ customerInfo, onBack }: PaymentFormProps) {
  const { items, clearCart, deliveryFee } = useCart()
  const router = useRouter()
  const { t } = useI18n()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ideal" | "paypal">("card")
  const [processing, setProcessing] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [cardInfo, setCardInfo] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  })

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings(null))
  }, [])

  const subtotal = calculateSubtotal(items)
  const vatRate = settings?.vatRate ?? 21
  const tax = calculateTaxTotal(items, vatRate)
  const deliveryTotal = deliveryFee ?? 0
  const totalAmount = subtotal + tax + deliveryTotal

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Create order in Firebase (this would be implemented in the next step)
      const orderData = {
        items,
        customerInfo,
        totalAmount: totalAmount, // Including tax and delivery
        paymentMethod,
        status: "confirmed",
      }

      console.log("Order created:", orderData)

      // Clear cart and redirect to success page
      clearCart()
      router.push("/checkout/success")
    } catch (error) {
      console.error("Payment failed:", error)
      // Handle payment error
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
        <form onSubmit={handlePayment} className="space-y-6">
          <div className="space-y-4">
            <Label>{t("checkout.paymentMethod")}</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() => setPaymentMethod("card")}
                className="h-12"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {t("checkout.card")}
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "ideal" ? "default" : "outline"}
                onClick={() => setPaymentMethod("ideal")}
                className="h-12"
              >
                iDEAL
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "paypal" ? "default" : "outline"}
                onClick={() => setPaymentMethod("paypal")}
                className="h-12"
              >
                PayPal
              </Button>
            </div>
          </div>

          {paymentMethod === "card" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardName">{t("checkout.cardholderName")}</Label>
                <Input
                  id="cardName"
                  value={cardInfo.name}
                  onChange={(e) => setCardInfo({ ...cardInfo, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">{t("checkout.cardNumber")}</Label>
                <Input
                  id="cardNumber"
                  value={cardInfo.number}
                  onChange={(e) => setCardInfo({ ...cardInfo, number: e.target.value })}
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">{t("checkout.expiryDate")}</Label>
                  <Input
                    id="expiry"
                    value={cardInfo.expiry}
                    onChange={(e) => setCardInfo({ ...cardInfo, expiry: e.target.value })}
                    placeholder="MM/YY"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    value={cardInfo.cvc}
                    onChange={(e) => setCardInfo({ ...cardInfo, cvc: e.target.value })}
                    placeholder="123"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === "ideal" && (
            <div className="space-y-2">
              <Label>{t("checkout.selectBank")}</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t("checkout.chooseBank")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ing">ING Bank</SelectItem>
                  <SelectItem value="rabobank">Rabobank</SelectItem>
                  <SelectItem value="abn">ABN AMRO</SelectItem>
                  <SelectItem value="sns">SNS Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox id="terms" checked={acceptTerms} onCheckedChange={setAcceptTerms} />
            <Label htmlFor="terms" className="text-sm">
              {t("checkout.acceptTerms")} {" "}
              <a href="#" className="text-primary hover:underline">
                {t("checkout.termsOfService")}
              </a>{" "}
              {t("checkout.and")} {" "}
              <a href="#" className="text-primary hover:underline">
                {t("checkout.privacyPolicy")}
              </a>
            </Label>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("checkout.back")}
            </Button>
            <Button type="submit" disabled={!acceptTerms || processing} className="flex-1">
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {t("checkout.processing")}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  {t("checkout.completeOrder")} €{totalAmount.toFixed(2)}
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <Lock className="h-3 w-3 inline mr-1" />
            {t("checkout.secure")}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
