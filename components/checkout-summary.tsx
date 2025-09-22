"use client"

import { useCart } from "@/hooks/use-cart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export function CheckoutSummary() {
  const { getTotalPrice, getTotalItems } = useCart()

  const subtotal = getTotalPrice()
  const tax = subtotal * 0.21 // 21% VAT
  const delivery = 0 // Free delivery
  const total = subtotal + tax + delivery

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal ({getTotalItems()} items)</span>
            <span>€{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Delivery</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Free
              </Badge>
              <span>€{delivery.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span>VAT (21%)</span>
            <span>€{tax.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>€{total.toFixed(2)}</span>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Free delivery within 50km</p>
          <p>• Setup service available</p>
          <p>• 24/7 customer support</p>
        </div>
      </CardContent>
    </Card>
  )
}
