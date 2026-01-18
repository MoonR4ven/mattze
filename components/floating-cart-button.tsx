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
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 rounded-full h-14 w-14 sm:h-16 sm:w-16 shadow-2xl hover:scale-110 transition-transform bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90"
    >
      <div className="relative">
        <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
        {totalItems > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center p-0 text-[10px] sm:text-xs"
          >
            {totalItems}
          </Badge>
        )}
      </div>
    </Button>
  )
}
