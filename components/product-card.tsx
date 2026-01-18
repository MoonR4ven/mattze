"use client"

import { useState } from "react"
import type { Product } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Euro, Check, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/hooks/use-cart"
import { useI18n } from "@/contexts/i18n-context"
import { TimeBookingDialog } from "./time-booking-dialog"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [showAddedAnimation, setShowAddedAnimation] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { addToCart } = useCart()
  const { t } = useI18n()

  // Get images array - use images if available, otherwise fall back to single image
  const images = product.images && product.images.length > 0 
    ? product.images 
    : (product.image ? [product.image] : [])

  const currentImage = images[currentImageIndex] || `/placeholder.svg?height=300&width=400&text=${encodeURIComponent(product.name)}`

  const handlePreviousImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

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
      <Card className="group hover-lift overflow-hidden border-2 border-transparent hover:border-[rgb(var(--mavi-blue))]/30 transition-all h-full flex flex-col shadow-lg bg-slate-100">
        <Link href={`/products/${product.id}`}>
          <CardHeader className="p-0">
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl group/image">
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Image carousel controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity z-10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity z-10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Image dots indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover/image:opacity-100 transition-opacity">
                    {images.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {product.available && (
                <Badge className="absolute top-6 right-6 bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] border-0 shadow-xl backdrop-blur-sm text-sm px-4 py-2 rounded-full font-semibold">
                  {t("product.available")}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 flex-1 flex flex-col">
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="font-bold text-lg mb-2 line-clamp-2 text-foreground group-hover:text-[rgb(var(--mavi-dark-teal))] transition-colors uppercase">
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
                  <span className="text-xs text-muted-foreground">{t("product.perDay")}</span>
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
              className="w-full bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 transition-all shadow-lg text-[rgb(var(--mavi-dark-teal))] font-semibold hover:text-black"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowBookingDialog(true)
              }}
              disabled={product.available === false}
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              {t("product.bookNow")}
            </Button>
            
            {showAddedAnimation && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-[rgb(var(--mavi-turquoise))] to-[rgb(var(--mavi-blue))] rounded-md animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Check className="h-5 w-5" />
                  {t("product.addedToCart")}
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
