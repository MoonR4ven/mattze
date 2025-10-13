"use client"

import { useState } from "react"
import type { Product } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Euro } from "lucide-react"
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
      selectedDate: startDate,
      selectedTime: undefined,
    })
    setShowBookingDialog(false)
  }

  return (
    <>
      <Card className="group hover-lift overflow-hidden border-2 border-transparent hover:border-[rgb(var(--mavi-blue))]/20 transition-all h-full flex flex-col">
        <CardHeader className="p-0">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={product.image || `/placeholder.svg?height=300&width=400&text=${encodeURIComponent(product.name)}`}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {product.available && (
              <Badge className="absolute top-4 right-4 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] border-0 shadow-lg backdrop-blur-sm">
                Available
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 flex-1 flex flex-col">
          <div className="space-y-3 flex-1">
            <div>
              <h3 className="font-bold text-xl mb-2 line-clamp-2 group-hover:text-[rgb(var(--mavi-blue))] transition-colors">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
              )}
            </div>

            {(product.dimensions || product.capacity) && (
              <div className="flex gap-2 flex-wrap">
                {product.dimensions && (
                  <Badge variant="outline" className="text-xs">
                    {product.dimensions}
                  </Badge>
                )}
                {product.capacity && (
                  <Badge variant="outline" className="text-xs">
                    {product.capacity}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
                <span className="font-bold text-2xl bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                  {product.price.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">/day</span>
              </div>
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 border-[rgb(var(--mavi-blue))]/20 text-xs"
              >
                {product.type}
              </Badge>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <Button
            className="w-full bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 transition-all hover:scale-105 shadow-lg"
            onClick={() => setShowBookingDialog(true)}
            disabled={!product.available}
          >
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
