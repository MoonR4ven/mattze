"use client"

import { useState } from "react"
import type { Product } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import Image from "next/image"
import { useCart } from "@/hooks/use-cart"
import { TimeBookingDialog } from "./time-booking-dialog"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const { addToCart } = useCart()

  const handleAddToCart = (startDate?: string, endDate?: string, days?: number) => {
    const totalPrice = days ? product.price * days : product.price

    addToCart({
      ...product,
      quantity: 1,
      startDate,
      endDate,
      numberOfDays: days,
      totalPrice,
      // Keep legacy fields for backward compatibility
      selectedDate: startDate,
      selectedTime: undefined,
    })
    setShowBookingDialog(false)
  }

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-200 border-border bg-card">
        <CardHeader className="p-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
            <Image
              src={product.image || `/placeholder.svg?height=300&width=400&text=${encodeURIComponent(product.name)}`}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
            {product.available && (
              <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">Available</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-card-foreground line-clamp-2">{product.name}</h3>
            {product.description && <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>}
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">€{product.price.toFixed(2)}/day</span>
              <Badge variant="secondary" className="text-xs">
                {product.type}
              </Badge>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button className="w-full" onClick={() => setShowBookingDialog(true)} disabled={!product.available}>
            <Calendar className="h-4 w-4 mr-2" />
            Book Now
          </Button>
        </CardFooter>
      </Card>

      <TimeBookingDialog
        product={product}
        open={showBookingDialog}
        onOpenChange={setShowBookingDialog}
        onConfirm={handleAddToCart}
      />
    </>
  )
}
