"use client"

import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"

export function FloatingCartButton() {
  const { getTotalItems, toggleCart } = useCart()
  const totalItems = getTotalItems()

  if (totalItems === 0) {
    return null
  }

  return (
    <Button
      onClick={toggleCart}
      size="lg"
      className="fixed bottom-6 right-6 z-30 rounded-full h-16 w-16 shadow-2xl hover:scale-110 transition-transform"
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6" />
        {totalItems > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs"
          >
            {totalItems}
          </Badge>
        )}
      </div>
    </Button>
  )
}
