"use client"

import { useSearchParams } from "next/navigation"
import { CheckCircle, Calendar, Mail, Phone, Package, Clock, AlertCircle, MapPin, User, DollarSign, Zap, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useI18n } from "@/contexts/i18n-context"
import Link from "next/link"
import { format } from "date-fns"
import Image from "next/image"

export default function CheckoutSuccessPage() {
  const { t, locale } = useI18n()
  const searchParams = useSearchParams()
  const paymentIntentId = searchParams.get("payment_intent")
  
  // Try to get order data from sessionStorage (passed from checkout)
  const orderData = typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("lastOrder") || "{}") : {}
  
  // Calculate totals if we have order data
  const subtotal = orderData.items?.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0) || 0
  const taxRate = 0.21
  const tax = subtotal * taxRate
  const total = subtotal + tax

  // Generate calendar links for items
  const generateCalendarLinks = (item: any) => {
    const startDate = item.startDate || item.selectedDate
    const endDate = item.endDate || item.selectedDate
    const startTime = item.startTime || item.selectedTime || "00:00"
    
    if (!startDate || !endDate) return null

    const [year, month, day] = startDate.split("-")
    const [hours, minutes] = startTime.split(":")
    const startDateTime = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`)
    
    let endDateTime: Date
    if (startDate === endDate) {
      endDateTime = new Date(startDateTime)
      endDateTime.setHours(endDateTime.getHours() + 1)
    } else {
      endDateTime = new Date(endDate + "T" + startTime)
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
      ? `Mietdauer für ${item.name}. Bei Fragen kontaktieren Sie uns gerne.`
      : `Rental period for ${item.name}. Please contact us if you have any questions.`

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${startFormatted}/${endFormatted}&details=${encodeURIComponent(
      description
    )}&location=MaVi%20Rental&sf=true&output=xml`

    const outlookUrl = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
      title
    )}&startdt=${startDateTime.toISOString()}&enddt=${endDateTime.toISOString()}&body=${encodeURIComponent(
      description
    )}&location=MaVi%20Rental`

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
          {t("success.orderConfirmed") || "Order Confirmed!"}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("success.thankYou") || "Thank you for your booking. Your payment has been processed successfully."}
        </p>
      </div>

      {/* Order ID */}
      {paymentIntentId && (
        <Card className="mb-6 bg-slate-100 border-2 border-[rgb(var(--mavi-blue))]/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">{t("success.orderReference") || "Order Reference"}</p>
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
              {t("success.rentalDetails") || "Rental Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {orderData.items.map((item: any, index: number) => (
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
                            <span>{item.numberOfDays} {item.numberOfDays === 1 ? t("success.day") || "day" : t("success.days") || "days"}</span>
                          </div>
                        )}
                        {item.selectedTime && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 text-[rgb(var(--mavi-deep-teal))]" />
                            <span>{item.selectedTime}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {item.quantity > 1 && (
                      <div className="text-sm text-muted-foreground mt-2">
                        {t("success.quantity") || "Quantity"}: {item.quantity}
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
      {orderData.items && orderData.items.length > 0 && orderData.items.some((item: any) => item.startDate || item.selectedDate) && (
        <Card className="mb-8 bg-slate-100 border-2 border-[rgb(var(--mavi-blue))]/20 overflow-hidden hover:border-[rgb(var(--mavi-blue))]/40 transition-all">
          <CardHeader className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/5 to-[rgb(var(--mavi-turquoise))]/5 border-b-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
              {t("success.addToCalendar") || "Add to Your Calendar"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <p className="text-sm text-muted-foreground">
              {t("success.calendarDescription") || "Click below to add your rental dates to your calendar"}
            </p>
            {orderData.items.map((item: any, index: number) => {
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
                      {locale === "de" ? "Google Kalender" : "Google Calendar"}
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
            {t("success.whatHappensNext") || "What Happens Next?"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[
            { icon: "✓", color: "bg-green-500", title: t("success.step1Title") || "Payment Confirmed", desc: t("success.step1Desc") || "Your payment has been securely processed through Stripe and your order is being created." },
            { icon: "2", color: "bg-purple-500", title: t("success.step2Title") || "Calendar Updated", desc: t("success.step2Desc") || "Your booking dates and times have been added to our calendar system for scheduling." },
            { icon: "3", color: "bg-[rgb(var(--mavi-blue))]", title: t("success.step3Title") || "Confirmation Email", desc: t("success.step3Desc") || "You'll receive a confirmation email with your complete order details within 5 minutes." }
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
            {t("success.needHelp") || "Need Help?"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3 group">
            <Mail className="h-5 w-5 text-[rgb(var(--mavi-blue))] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-medium">{t("success.emailSupport") || "Email Support"}</h3>
              <p className="text-sm text-muted-foreground">
                mavi.ostercappeln@gmail.com
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3 group">
            <Phone className="h-5 w-5 text-[rgb(var(--mavi-turquoise))] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-medium">{t("success.ourTeam") || "Our Team"}</h3>
              <p className="text-sm text-muted-foreground">
                {t("success.responseTime") || "We typically respond within 24 hours during business hours."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center flex-wrap mb-8">
        <Button asChild variant="outline" size="lg" className="border-2 hover:border-[rgb(var(--mavi-blue))]/50">
          <Link href="/">{t("success.backToHome") || "Back to Home"}</Link>
        </Button>
        <Button asChild size="lg" className="bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-[rgb(var(--mavi-dark-teal))] font-semibold hover:text-black">
          <Link href="/products">{t("success.browseMore") || "Browse More Products"}</Link>
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/5 to-[rgb(var(--mavi-turquoise))]/5 border-2 border-[rgb(var(--mavi-blue))]/20">
        <AlertCircle className="h-4 w-4 text-[rgb(var(--mavi-blue))]" />
        <AlertDescription className="text-[rgb(var(--mavi-blue))] ml-2">
          {t("success.emailSent") || "Your order information has been sent to your email. Check your inbox (and spam folder) for a confirmation email with all your booking details."}
        </AlertDescription>
      </Alert>
    </div>
  )
}
