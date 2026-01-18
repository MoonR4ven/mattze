"use client"

import { useState } from "react"
import type { Product } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Euro, Check } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/hooks/use-cart"
import { TimeBookingDialog } from "./time-booking-dialog"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [showAddedAnimation, setShowAddedAnimation] = useState(false)
  const { addToCart } = useCart()

  const handleAddToCart = (startDate?: string, endDate?: string, days?: number, quantity?: number) => {
    const totalPrice = days ? product.price * days * (quantity || 1) : product.price

    addToCart({
      ...product,
      quantity: quantity || 1,
      startDate,
      endDate,
      numberOfDays: days,
      totalPrice,
      selectedDate: startDate,
      selectedTime: "10:00", // Default time: 10:00 AM
    })
    setShowBookingDialog(false)
    
    // Show success animation
    setShowAddedAnimation(true)
    setTimeout(() => setShowAddedAnimation(false), 2000)
  }

  return (
    <>
      <Card className="group hover-lift overflow-hidden border-2 border-transparent hover:border-[rgb(var(--mavi-blue))]/30 transition-all h-full flex flex-col shadow-lg">
        <Link href={`/products/${product.id}`}>
          <CardHeader className="p-0">
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
              <Image
                src={product.image || `/placeholder.svg?height=300&width=400&text=${encodeURIComponent(product.name)}`}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {product.available && (
                <Badge className="absolute top-6 right-6 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] border-0 shadow-xl backdrop-blur-sm text-sm px-4 py-2 rounded-full font-semibold">
                  Available
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 flex-1 flex flex-col">
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-[rgb(var(--mavi-blue))] transition-colors">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-4">{product.description}</p>
                )}
              </div>

              {(product.dimensions || product.capacity) && (
                <div className="flex gap-2 flex-wrap">
                  {product.dimensions && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full border">
                      {product.dimensions}
                    </Badge>
                  )}
                  {product.capacity && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full border">
                      {product.capacity}
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5">
                  <Euro className="h-4 w-4 text-[rgb(var(--mavi-blue))]" />
                  <span className="font-bold text-xl bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                    {product.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">/day</span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 border-[rgb(var(--mavi-blue))]/20 text-xs px-2 py-1 rounded-full"
                >
                  {product.type}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Link>

        <CardFooter className="p-4 pt-0">
          <div className="w-full relative">
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 transition-all shadow-lg"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowBookingDialog(true)
              }}
              disabled={product.available === false}
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              Book Now
            </Button>
            
            {showAddedAnimation && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-[rgb(var(--mavi-turquoise))] to-[rgb(var(--mavi-blue))] rounded-md animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Check className="h-5 w-5" />
                  Added to Cart!
                </div>
              </div>
            )}
          </div>
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
