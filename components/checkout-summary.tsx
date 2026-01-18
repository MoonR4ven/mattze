"use client"

import { useCart } from "@/hooks/use-cart"
import { useI18n } from "@/contexts/i18n-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export function CheckoutSummary() {
  const { getTotalPrice, getTotalItems } = useCart()
  const { t } = useI18n()

  const subtotal = getTotalPrice()
  const tax = subtotal * 0.21 // 21% VAT
  const delivery = 0 // Free delivery
  const total = subtotal + tax + delivery

  return (
    <Card className="sticky top-4 bg-slate-100">
      <CardHeader>
        <CardTitle>{t("checkout.orderSummary")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>{t("checkout.subtotal")} ({getTotalItems()} {getTotalItems() === 1 ? t("checkout.item") : t("checkout.items")})</span>
            <span>€{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>{t("checkout.delivery")}</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {t("checkout.free")}
              </Badge>
              <span>€{delivery.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span>{t("checkout.vat")}</span>
            <span>€{tax.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold text-lg">
          <span>{t("checkout.total")}</span>
          <span>€{total.toFixed(2)}</span>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• {t("checkout.freeDelivery")}</p>
          <p>• {t("checkout.setupService")}</p>
          <p>• {t("checkout.support")}</p>
        </div>
      </CardContent>
    </Card>
  )
}
