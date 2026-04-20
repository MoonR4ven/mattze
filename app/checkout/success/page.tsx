"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Calendar, Mail, Phone, Package, Clock, AlertCircle, Zap, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useI18n } from "@/contexts/i18n-context"
import Link from "next/link"
import { format } from "date-fns"
import Image from "next/image"
import { getSettings, type AppSettings } from "@/lib/settings"

type FulfillmentOption = "self-collection" | "delivery-collection" | "delivery-assembly"

interface PickupLocation {
  id: string
  name: string
  address: string
}

interface OrderCustomerInfo {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
}

interface OrderItem {
  id?: string
  name: string
  type?: string
  image?: string
  price?: number
  quantity?: number
  totalPrice?: number
  numberOfDays?: number
  startDate?: string
  endDate?: string
  selectedDate?: string
  selectedTime?: string
  startTime?: string
  endTime?: string
  endDayOffset?: number
}

interface LastOrderData {
  items: OrderItem[]
  customerInfo?: OrderCustomerInfo
  fulfillmentOption?: FulfillmentOption
  pickupLocations?: PickupLocation[]
  deliveryFee?: number
  pricing?: {
    tax?: number
  }
}

export default function CheckoutSuccessPage() {
  const { t, locale } = useI18n()
  const searchParams = useSearchParams()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isFinalizingPayment, setIsFinalizingPayment] = useState(false)
  const [paymentFinalizationError, setPaymentFinalizationError] = useState<string | null>(null)
  const finalizedPaymentIntentRef = useRef<string | null>(null)
  const paymentIntentId = searchParams.get("payment_intent")

  const getLastOrderData = (): LastOrderData => {
    if (typeof window === "undefined") {
      return { items: [] }
    }

    try {
      const raw = window.sessionStorage.getItem("lastOrder")
      if (!raw) {
        return { items: [] }
      }

      const parsed = JSON.parse(raw) as Partial<LastOrderData>
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        customerInfo: parsed.customerInfo,
        fulfillmentOption: parsed.fulfillmentOption,
        pickupLocations: Array.isArray(parsed.pickupLocations) ? parsed.pickupLocations : [],
        deliveryFee: parsed.deliveryFee,
        pricing: parsed.pricing,
      }
    } catch {
      return { items: [] }
    }
  }
  
  // Try to get order data from sessionStorage (passed from checkout)
  const orderData = getLastOrderData()
  
  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings(null))
  }, [])

  useEffect(() => {
    if (!paymentIntentId) {
      return
    }

    if (finalizedPaymentIntentRef.current === paymentIntentId) {
      return
    }

    const storageKey = `payment-finalized:${paymentIntentId}`
    if (typeof window !== "undefined" && window.sessionStorage.getItem(storageKey) === "1") {
      finalizedPaymentIntentRef.current = paymentIntentId
      return
    }

    finalizedPaymentIntentRef.current = paymentIntentId
    let cancelled = false

    const replayPaymentFinalization = async () => {
      setIsFinalizingPayment(true)
      setPaymentFinalizationError(null)

      try {
        const response = await fetch("/api/confirm-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentIntentId,
          }),
        })

        const result = await response.json().catch(() => ({})) as { success?: boolean; error?: string }
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to confirm payment")
        }

        if (!cancelled) {
          window.sessionStorage.setItem(storageKey, "1")
        }
      } catch (error) {
        console.error("Payment finalization replay failed:", error)
        if (!cancelled) {
          setPaymentFinalizationError(t("checkout.orderConfirmationFailed"))
        }
      } finally {
        if (!cancelled) {
          setIsFinalizingPayment(false)
        }
      }
    }

    void replayPaymentFinalization()

    return () => {
      cancelled = true
    }
  }, [paymentIntentId, t])

  // Generate calendar links for items
  const generateCalendarLinks = (item: OrderItem) => {
    const startDate = item.startDate || item.selectedDate
    const startTime = item.startTime || item.selectedTime || "00:00"
    const baseEndDate = item.endDate || item.selectedDate || startDate
    const endDayOffset = Number.isFinite(Number(item.endDayOffset)) ? Number(item.endDayOffset) : 0
    const endTime = item.endTime || (() => {
      const [h, m] = startTime.split(":").map(Number)
      return `${String(((Number.isFinite(h) ? h : 10) + 1) % 24).padStart(2, "0")}:${String(Number.isFinite(m) ? m : 0).padStart(2, "0")}`
    })()

    const addDaysToDateString = (dateString: string, days: number): string => {
      const [y, m, d] = dateString.split("-").map(Number)
      const date = new Date(y, m - 1, d)
      date.setDate(date.getDate() + days)
      return format(date, "yyyy-MM-dd")
    }

    const getFulfillmentLocation = () => {
      if (orderData.fulfillmentOption === "self-collection") {
        if (Array.isArray(orderData.pickupLocations) && orderData.pickupLocations.length > 0) {
          return orderData.pickupLocations.map((location) => `${location.name} (${location.address})`).join(" | ")
        }
        return t("success.selfCollection")
      }

      const customer = orderData.customerInfo || {}
      const destination = [customer.address, customer.postalCode, customer.city, customer.country].filter(Boolean).join(" ")
      if (orderData.fulfillmentOption === "delivery-assembly") {
        return destination ? `${t("success.deliveryAssembly")}: ${destination}` : t("success.deliveryAssembly")
      }
      if (orderData.fulfillmentOption === "delivery-collection") {
        return destination ? `${t("success.deliveryCollection")}: ${destination}` : t("success.deliveryCollection")
      }
      return destination || t("success.deliveryPickup")
    }

    const endDate = baseEndDate ? addDaysToDateString(baseEndDate, endDayOffset) : undefined
    const location = getFulfillmentLocation()
    
    if (!startDate || !endDate) return null

    const [year, month, day] = startDate.split("-")
    const [hours, minutes] = startTime.split(":")
    const startDateTime = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`)
    
    let endDateTime = new Date(`${endDate}T${endTime}:00`)
    if (endDateTime <= startDateTime) {
      endDateTime = new Date(startDateTime)
      endDateTime.setHours(endDateTime.getHours() + 1)
    }

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

    const title = locale === "de" ? `Mietdauer: ${item.name}` : `Rental: ${item.name}`
    const description = locale === "de" 
      ? `Mietdauer für ${item.name}. Ort: ${location}. Bei Fragen kontaktieren Sie uns gerne.`
      : `Rental period for ${item.name}. Location: ${location}. Please contact us if you have any questions.`

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${startFormatted}/${endFormatted}&details=${encodeURIComponent(
      description
    )}&location=${encodeURIComponent(location)}&sf=true&output=xml`

    const outlookUrl = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
      title
    )}&startdt=${startDateTime.toISOString()}&enddt=${endDateTime.toISOString()}&body=${encodeURIComponent(
      description
    )}&location=${encodeURIComponent(location)}`

    return { googleCalendarUrl, outlookUrl }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Success Header */}
      <div className="text-center mb-12">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] opacity-20 rounded-full blur-2xl"></div>
            <CheckCircle className="h-24 w-24 text-green-500 relative" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
          {t("success.orderConfirmed")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("success.thankYou")}
        </p>
      </div>

      {/* Order ID */}
      {isFinalizingPayment && (
        <Alert className="mb-6 border-2 border-[rgb(var(--mavi-blue))]/20 bg-slate-100">
          <AlertCircle className="h-4 w-4 text-[rgb(var(--mavi-blue))]" />
          <AlertDescription className="text-[rgb(var(--mavi-blue))]">
            {t("checkout.processing")}
          </AlertDescription>
        </Alert>
      )}

      {paymentFinalizationError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{paymentFinalizationError}</AlertDescription>
        </Alert>
      )}

      {paymentIntentId && (
        <Card className="mb-6 bg-slate-100 border-2 border-[rgb(var(--mavi-blue))]/20">
          <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">{t("success.orderReference")}</p>
            <p className="font-mono text-sm font-semibold break-all text-[rgb(var(--mavi-blue))]">{paymentIntentId}</p>
          </CardContent>
        </Card>
      )}

      {/* Order Items / Rental Details */}
      {orderData.items && orderData.items.length > 0 && (
        <Card className="mb-8 bg-slate-100 border-2 border-[rgb(var(--mavi-blue))]/20 overflow-hidden hover:border-[rgb(var(--mavi-blue))]/40 transition-all">
          <CardHeader className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/5 to-[rgb(var(--mavi-turquoise))]/5 border-b-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
              {t("success.rentalDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {orderData.items.map((item: OrderItem, index: number) => (
              <div key={index}>
                <div className="flex gap-4">
                  {item.image && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border-2 border-[rgb(var(--mavi-blue))]/10">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.type}</p>
                      </div>
                      <Badge className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] text-white">
                        €{item.totalPrice?.toFixed(2) || item.price?.toFixed(2)}
                      </Badge>
                    </div>
                    
                    {/* Rental Dates */}
                    {(item.startDate || item.selectedDate) && (
                      <div className="flex flex-wrap gap-3 text-sm mt-3 pt-3 border-t border-[rgb(var(--mavi-blue))]/10">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 text-[rgb(var(--mavi-blue))]" />
                          <span>
                            {item.startDate
                              ? `${format(new Date(item.startDate), "MMM dd")} - ${format(new Date(item.endDate), "MMM dd, yyyy")}`
                              : format(new Date(item.selectedDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                        {item.numberOfDays && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 text-[rgb(var(--mavi-turquoise))]" />
                            <span>{item.numberOfDays} {item.numberOfDays === 1 ? t("success.day") : t("success.days")}</span>
                          </div>
                        )}
                        {(item.startTime || item.selectedTime) && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 text-[rgb(var(--mavi-deep-teal))]" />
                            <span>
                              {(item.startTime || item.selectedTime)}
                              {item.endTime ? ` - ${item.endTime}` : ""}
                              {(Number(item.endDayOffset) || 0) > 0 ? " (+1 day)" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {item.quantity > 1 && (
                      <div className="text-sm text-muted-foreground mt-2">
                        {t("success.quantity")}: {item.quantity}
                      </div>
                    )}
                  </div>
                </div>
                {index < orderData.items.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add to Calendar Section */}
      {orderData.items && orderData.items.length > 0 && orderData.items.some((item: OrderItem) => item.startDate || item.selectedDate) && (
        <Card className="mb-8 bg-slate-100 border-2 border-[rgb(var(--mavi-blue))]/20 overflow-hidden hover:border-[rgb(var(--mavi-blue))]/40 transition-all">
          <CardHeader className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/5 to-[rgb(var(--mavi-turquoise))]/5 border-b-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
              {t("success.addToCalendar")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <p className="text-sm text-muted-foreground">
              {t("success.calendarDescription")}
            </p>
            {orderData.items.map((item: OrderItem, index: number) => {
              const calendarLinks = generateCalendarLinks(item)
              if (!calendarLinks) return null

              return (
                <div key={index} className="p-4 bg-white rounded-lg border-2 border-[rgb(var(--mavi-blue))]/10 space-y-3">
                  <h4 className="font-semibold text-sm">{item.name}</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-2 hover:bg-[rgb(var(--mavi-blue))]/10 hover:border-[rgb(var(--mavi-blue))]/30"
                      onClick={() => window.open(calendarLinks.googleCalendarUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t("success.googleCalendar")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-2 hover:bg-[rgb(var(--mavi-blue))]/10 hover:border-[rgb(var(--mavi-blue))]/30"
                      onClick={() => window.open(calendarLinks.outlookUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Outlook
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* What Happens Next */}
      <Card className="mb-8 bg-slate-100 border-2 border-[rgb(var(--mavi-blue))]/20 overflow-hidden hover:border-[rgb(var(--mavi-blue))]/40 transition-all">
        <CardHeader className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/5 to-[rgb(var(--mavi-turquoise))]/5 border-b-2">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
            {t("success.whatHappensNext")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[
            { icon: "✓", color: "bg-green-500", title: t("success.step1Title"), desc: t("success.step1Desc") },
            { icon: "2", color: "bg-purple-500", title: t("success.step2Title"), desc: t("success.step2Desc") },
            { icon: "3", color: "bg-[rgb(var(--mavi-blue))]", title: t("success.step3Title"), desc: t("success.step3Desc") }
          ].map((step, idx) => (
            <div key={idx} className="flex gap-4 group">
              <div className="flex flex-col items-center">
                <div className={`h-10 w-10 rounded-full ${step.color} text-white flex items-center justify-center font-bold text-sm flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  {step.icon}
                </div>
                {idx < 2 && <div className="w-0.5 h-12 bg-muted mt-2"></div>}
              </div>
              <div className="pb-8">
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="mb-8 bg-slate-100 border-2 border-[rgb(var(--mavi-turquoise))]/20 overflow-hidden hover:border-[rgb(var(--mavi-turquoise))]/40 transition-all">
        <CardHeader className="bg-gradient-to-r from-[rgb(var(--mavi-turquoise))]/5 to-[rgb(var(--mavi-blue))]/5 border-b-2">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[rgb(var(--mavi-turquoise))]" />
            {t("success.needHelp")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3 group">
            <Mail className="h-5 w-5 text-[rgb(var(--mavi-blue))] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-medium">{t("success.emailSupport")}</h3>
              <p className="text-sm text-muted-foreground">
                {settings?.sellerContact?.email || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@example.com"}
              </p>
              {settings?.sellerContact?.companyName ? (
                <p className="text-xs text-muted-foreground mt-1">{settings.sellerContact.companyName}</p>
              ) : null}
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3 group">
            <Phone className="h-5 w-5 text-[rgb(var(--mavi-turquoise))] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-medium">{t("success.ourTeam")}</h3>
              {settings?.sellerContact?.phone ? (
                <p className="text-sm text-muted-foreground">{settings.sellerContact.phone}</p>
              ) : null}
              {settings?.sellerContact?.address ? (
                <p className="text-xs text-muted-foreground mt-1">{settings.sellerContact.address}</p>
              ) : null}
              <p className="text-sm text-muted-foreground mt-1">
                {t("success.responseTime")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center flex-wrap mb-8">
        <Button asChild variant="outline" size="lg" className="border-2 hover:border-[rgb(var(--mavi-blue))]/50">
          <Link href="/">{t("success.backToHome")}</Link>
        </Button>
        <Button asChild size="lg" className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-[rgb(var(--mavi-dark-teal))] font-semibold hover:text-black">
          <Link href="/products">{t("success.browseMore")}</Link>
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/5 to-[rgb(var(--mavi-turquoise))]/5 border-2 border-[rgb(var(--mavi-blue))]/20">
        <AlertCircle className="h-4 w-4 text-[rgb(var(--mavi-blue))]" />
        <AlertDescription className="text-[rgb(var(--mavi-blue))] ml-2">
          {t("success.emailSent")}
        </AlertDescription>
      </Alert>
    </div>
  )
}
