"use client"

import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Trash2, Plus, Minus, Calendar, Clock, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { useEffect, useMemo, useState } from "react"
import { getSettings, type AppSettings } from "@/lib/settings"
import { calculateSubtotal, calculateTaxTotal } from "@/lib/cart-pricing"
import { useI18n } from "@/contexts/i18n-context"

export function CartPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    getTotalItems,
    clearCart,
    fulfillmentOption,
    setFulfillmentOption,
    deliveryFee,
    setDeliveryDetails,
    pickupLocations,
    setPickupLocations,
  } = useCart()
  const { t } = useI18n()
  const [settings, setSettings] = useState<AppSettings | null>(null)

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

  const subtotal = calculateSubtotal(items)
  const vatRate = settings?.vatRate ?? 21
  const tax = calculateTaxTotal(items, vatRate)
  const deliveryTotal = deliveryFee ?? 0
  const total = subtotal + tax + deliveryTotal

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">{t("cart.empty")}</h2>
            <p className="text-muted-foreground mb-6">{t("cart.emptyDescription")}</p>
            <Button asChild>
              <Link href="/">{t("cart.continueShopping")}</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("cart.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {getTotalItems()} {getTotalItems() === 1 ? t("cart.item") : t("cart.items")} {t("cart.inCart")}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {items.map((item, index) => (
              <Card key={`${item.id}-${item.selectedDate}-${item.selectedTime}-${index}`}>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex gap-3 sm:gap-4">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={item.image || `/placeholder.svg?height=96&width=96&text=${encodeURIComponent(item.name)}`}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg line-clamp-2">{item.name}</h3>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {item.type}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id, item.startDate, item.endDate, item.selectedDate)}
                        className="text-destructive hover:text-destructive h-8 w-8 p-0 flex-shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>

                    {item.selectedDate && (item.startTime || item.selectedTime) && (
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">{format(new Date(item.selectedDate), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">
                            {(item.startTime || item.selectedTime)}
                            {item.endTime ? ` - ${item.endTime}` : ""}
                            {(Number(item.endDayOffset) || 0) > 0 ? ` ${t("checkout.plusOneDay")}` : ""}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.startDate, item.endDate, item.selectedDate)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1, item.startDate, item.endDate, item.selectedDate)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">€{(item.totalPrice ?? item.price * item.quantity).toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">€{item.price.toFixed(2)} {t("product.perDay")}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}

            <div className="flex justify-between items-center pt-4" suppressHydrationWarning>
              <Button variant="outline" onClick={clearCart}>
                {t("cart.clear")}
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/">{t("cart.continueShopping")}</Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="mb-4 bg-slate-100">
              <CardHeader>
                <CardTitle>{t("checkout.fulfillment")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  {[
                    { value: "self-collection", label: t("checkout.selfCollection") },
                    { value: "delivery-collection", label: t("checkout.deliveryCollection") },
                    { value: "delivery-assembly", label: t("checkout.deliveryAssembly") },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="fulfillment"
                        value={option.value}
                        checked={fulfillmentOption === option.value}
                        onChange={() => {
                          setFulfillmentOption(option.value as typeof fulfillmentOption)
                          if (option.value === "self-collection") {
                            setDeliveryDetails({ distanceKm: undefined, fee: 0 })
                          } else {
                            setPickupLocations([])
                          }
                        }}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>

                {fulfillmentOption === "self-collection" && settings?.pickupLocations?.length ? (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">{t("checkout.pickupLimit").replace("{count}", String(settings.pickupSelectionLimit))}</div>
                    {eligiblePickupLocations.length > 0 ? (
                      <div className="grid gap-2">
                        {eligiblePickupLocations.map((location) => {
                        const selected = pickupLocations.some((pickup) => pickup.id === location.id)
                        const disabled = !selected && pickupLocations.length >= settings.pickupSelectionLimit
                        return (
                          <label key={location.id} className="flex items-start gap-2 text-xs">
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
                    {t("cart.deliveryCalculatedAddress")}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="sticky top-4 bg-slate-100">
              <CardHeader>
                <CardTitle>{t("checkout.orderSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t("cart.subtotal")} ({getTotalItems()} {getTotalItems() === 1 ? t("cart.item") : t("cart.items")})</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t("cart.delivery")}</span>
                  <span>{fulfillmentOption === "self-collection" ? t("cart.free") : (deliveryFee != null ? `€${deliveryTotal.toFixed(2)}` : t("cart.deliveryCalculated"))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t("cart.tax")}</span>
                  <span>€{tax.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>{t("cart.total")}</span>
                <span>€{total.toFixed(2)}</span>
              </div>

              <Button asChild className="w-full" size="lg">
                <Link href="/checkout">
                  {t("cart.proceedCheckout")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>

              <div className="text-xs text-muted-foreground text-center">{t("cart.poweredByStripe")}</div>
            </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}