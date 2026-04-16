"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { useCart } from "@/hooks/use-cart"
import { useI18n } from "@/contexts/i18n-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CheckoutSummary } from "@/components/checkout-summary"
import { StripePaymentForm } from "@/components/stripe-payment-form"
import { ShoppingCart, User, Calendar, Clock, ChevronDown } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { getSettings, type AppSettings } from "@/lib/settings"

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

export function CheckoutPage() {
  const {
    items,
    getTotalItems,
    fulfillmentOption,
    setFulfillmentOption,
    deliveryDistanceKm,
    deliveryFee,
    setDeliveryDetails,
    pickupLocations,
    setPickupLocations,
  } = useCart()
  const { t } = useI18n()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [distanceLoading, setDistanceLoading] = useState(false)
  const [distanceError, setDistanceError] = useState<string | null>(null)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    notes: "",
  })
  const [currentStep, setCurrentStep] = useState<"info" | "payment">("info")
  const [isOrderItemsOpen, setIsOrderItemsOpen] = useState(true)

  const eligiblePickupLocations = useMemo(() => (
    settings?.pickupLocations?.filter((location) =>
      items.every((item) => {
        const allowed = item.pickupLocationIds
        return !allowed || allowed.length === 0 || allowed.includes(location.id)
      }),
    ) || []
  ), [settings?.pickupLocations, items])

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings(null))
  }, [])

  useEffect(() => {
    if (fulfillmentOption !== "self-collection") return
    const allowedIds = new Set(eligiblePickupLocations.map((location) => location.id))
    const filtered = pickupLocations.filter((location) => allowedIds.has(location.id))
    if (filtered.length !== pickupLocations.length) {
      setPickupLocations(filtered)
    }
  }, [fulfillmentOption, eligiblePickupLocations, pickupLocations, setPickupLocations])

  useEffect(() => {
    if (fulfillmentOption === "self-collection") {
      setDistanceError(null)
      setDeliveryDetails({ distanceKm: undefined, fee: 0 })
      return
    }

    const hasAddress = Boolean(customerInfo.address && customerInfo.city && customerInfo.postalCode)
    const origin = settings?.deliveryOriginAddress
    if (!hasAddress || !origin) {
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setDistanceLoading(true)
      setDistanceError(null)
      try {
        const destination = `${customerInfo.address}, ${customerInfo.postalCode} ${customerInfo.city}, ${customerInfo.country || ""}`
        const response = await fetch("/api/delivery-distance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origin, destination }),
          signal: controller.signal,
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Failed to calculate distance")
        }

        const distanceKm = data.distanceKm as number
        const baseRadius = settings?.deliveryBaseRadiusKm ?? 10
        const baseFee = settings?.deliveryBaseFee ?? 20
        const perKm = settings?.deliveryPerKmFee ?? 1
        const assemblyFee = fulfillmentOption === "delivery-assembly" ? (settings?.assemblyFee ?? 0) : 0
        const extraKm = Math.max(0, distanceKm - baseRadius)
        const fee = baseFee + extraKm * perKm + assemblyFee
        setDeliveryDetails({ distanceKm, fee: Math.round(fee * 100) / 100 })
      } catch (error) {
        if (!controller.signal.aborted) {
          setDistanceError(error instanceof Error ? error.message : t("checkout.distanceFailed"))
        }
      } finally {
        if (!controller.signal.aborted) {
          setDistanceLoading(false)
        }
      }
    }, 500)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [customerInfo.address, customerInfo.city, customerInfo.postalCode, customerInfo.country, fulfillmentOption, settings, setDeliveryDetails, t])

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">{t("cart.empty")}</h2>
          <p className="text-muted-foreground mb-6">{t("cart.emptyDescription")}</p>
          <Link href="/">
            <Button>{t("cart.continueShopping")}</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep("payment")
  }

  const updateCustomerInfo = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }))
  }

  const isInfoComplete = () => {
    const baseComplete =
      customerInfo.firstName &&
      customerInfo.lastName &&
      customerInfo.email &&
      customerInfo.phone

    if (!baseComplete) return false

    if (fulfillmentOption === "self-collection") {
      if (eligiblePickupLocations.length === 0) return true
      return pickupLocations.length > 0
    }

    const addressComplete = customerInfo.address && customerInfo.city && customerInfo.postalCode
    const deliveryCalculated = deliveryFee != null && !distanceLoading && !distanceError
    return Boolean(addressComplete && deliveryCalculated)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("checkout.title")}</h1>
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground overflow-x-auto pb-2">
          <div className={`flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors duration-300 ${currentStep === "info" ? "text-[rgb(var(--mavi-blue))]" : ""}`}>
            <div
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                currentStep === "info" ? "bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] text-white shadow-lg scale-110" : "bg-muted text-muted-foreground"
              }`}
            >
              1
            </div>
            <span className="hidden sm:inline">{t("checkout.customerInfo")}</span>
            <span className="sm:hidden">{t("checkout.info")}</span>
          </div>
          <div className={`h-px flex-shrink-0 transition-colors duration-300 ${currentStep === "info" ? "w-4 sm:w-8 bg-border" : "w-4 sm:w-8 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))]"}`} />
          <div className={`flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors duration-300 ${currentStep === "payment" ? "text-[rgb(var(--mavi-blue))]" : ""}`}>
            <div
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                currentStep === "payment" ? "bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] text-white shadow-lg scale-110" : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
            <span>{t("checkout.payment")}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 order-2 lg:order-1">
          {currentStep === "info" ? (
            <Card className="bg-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("checkout.customerInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInfoSubmit} className="space-y-4 sm:space-y-6">
                  <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t("checkout.firstName")}</Label>
                      <Input
                        id="firstName"
                        value={customerInfo.firstName}
                        onChange={(e) => updateCustomerInfo("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t("checkout.lastName")}</Label>
                      <Input
                        id="lastName"
                        value={customerInfo.lastName}
                        onChange={(e) => updateCustomerInfo("lastName", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("checkout.email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => updateCustomerInfo("email", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t("checkout.phone")}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => updateCustomerInfo("phone", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">{t("checkout.address")}</Label>
                    <Input
                      id="address"
                      value={customerInfo.address}
                      onChange={(e) => updateCustomerInfo("address", e.target.value)}
                      required={fulfillmentOption !== "self-collection"}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">{t("checkout.city")}</Label>
                      <Input
                        id="city"
                        value={customerInfo.city}
                        onChange={(e) => updateCustomerInfo("city", e.target.value)}
                        required={fulfillmentOption !== "self-collection"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">{t("checkout.postalCode")}</Label>
                      <Input
                        id="postalCode"
                        value={customerInfo.postalCode}
                        onChange={(e) => updateCustomerInfo("postalCode", e.target.value)}
                        required={fulfillmentOption !== "self-collection"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">{t("checkout.country")}</Label>
                      <Input
                        id="country"
                        value={customerInfo.country}
                        onChange={(e) => updateCustomerInfo("country", e.target.value)}
                        required={fulfillmentOption !== "self-collection"}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">{t("checkout.fulfillment")}</Label>
                    <div className="grid gap-2">
                      {[
                        { value: "self-collection", label: t("checkout.selfCollection") },
                        { value: "delivery-collection", label: t("checkout.deliveryCollection") },
                        { value: "delivery-assembly", label: t("checkout.deliveryAssembly") },
                      ].map((option) => (
                        <label key={option.value} className="flex items-start gap-2 rounded-lg border p-3 bg-white/50 text-sm">
                          <input
                            type="radio"
                            name="fulfillment"
                            value={option.value}
                            checked={fulfillmentOption === option.value}
                            onChange={() => {
                              setFulfillmentOption(option.value as typeof fulfillmentOption)
                              if (option.value !== "self-collection") {
                                setPickupLocations([])
                              }
                            }}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>

                    {fulfillmentOption === "self-collection" && settings?.pickupLocations?.length ? (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {t("checkout.pickupLimit").replace("{count}", String(settings.pickupSelectionLimit))}
                        </div>
                        {eligiblePickupLocations.length > 0 ? (
                          <div className="grid gap-2">
                            {eligiblePickupLocations.map((location) => {
                            const selected = pickupLocations.some((pickup) => pickup.id === location.id)
                            const disabled = !selected && pickupLocations.length >= settings.pickupSelectionLimit
                            return (
                              <label key={location.id} className="flex items-start gap-2 rounded-lg border p-2 text-xs bg-white/50">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  disabled={disabled}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setPickupLocations([...pickupLocations, location])
                                    } else {
                                      setPickupLocations(pickupLocations.filter((pickup) => pickup.id !== location.id))
                                    }
                                  }}
                                />
                                <span>
                                  <span className="font-semibold">{location.name}</span>
                                  <span className="block text-muted-foreground">{location.address}</span>
                                </span>
                              </label>
                            )
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                            {t("checkout.noPickupLocationAvailable")}
                          </div>
                        )}
                      </div>
                    ) : null}

                    {fulfillmentOption !== "self-collection" && (
                      <div className="text-xs text-muted-foreground">
                        {distanceLoading && t("checkout.calculatingDistance")}
                        {!distanceLoading && deliveryDistanceKm != null && (
                          <span>
                            {t("checkout.distanceResult")
                              .replace("{distance}", deliveryDistanceKm.toFixed(1))
                              .replace("{fee}", (deliveryFee ?? 0).toFixed(2))}
                          </span>
                        )}
                        {!distanceLoading && distanceError && (
                          <span className="text-destructive">{distanceError}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">{t("checkout.notes")}</Label>
                    <Textarea
                      id="notes"
                      value={customerInfo.notes}
                      onChange={(e) => updateCustomerInfo("notes", e.target.value)}
                      placeholder={t("checkout.deliveryInstructions")}
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 text-[rgb(var(--mavi-dark-teal))] font-semibold border-2 border-white/20 shadow-lg transition-all hover:text-black" disabled={!isInfoComplete()}>
                    {t("checkout.continuePayment")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <StripePaymentForm customerInfo={customerInfo} onBack={() => setCurrentStep("info")} />
          )}
        </div>

        <div className="lg:col-span-1 order-1 lg:order-2">
          <CheckoutSummary />

          <Card className="mt-6 bg-slate-100">
            <Collapsible open={isOrderItemsOpen} onOpenChange={setIsOrderItemsOpen}>
              <CardHeader className="cursor-pointer" onClick={() => setIsOrderItemsOpen(!isOrderItemsOpen)}>
                <CollapsibleTrigger className="flex items-center justify-between w-full">
                  <CardTitle className="text-lg">{t("checkout.orderItems")}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {getTotalItems()} {getTotalItems() === 1 ? t("checkout.item") : t("checkout.items")}
                    </Badge>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOrderItemsOpen ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {items.map((item, index) => (
                    <div key={`${item.id}-${item.selectedDate}-${item.selectedTime}-${index}`} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {item.type}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">€{(item.price * item.quantity).toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">{t("checkout.qty")}: {item.quantity}</div>
                        </div>
                      </div>

                      {item.selectedDate && (item.startTime || item.selectedTime) && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(item.selectedDate), "MMM dd")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {(item.startTime || item.selectedTime)}
                              {item.endTime ? ` - ${item.endTime}` : ""}
                              {(Number(item.endDayOffset) || 0) > 0 ? ` ${t("checkout.plusOneDay")}` : ""}
                            </span>
                          </div>
                        </div>
                      )}

                      {index < items.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>
      </div>
    </div>
  )
}
