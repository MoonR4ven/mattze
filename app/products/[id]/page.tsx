"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getProducts } from "@/lib/products"
import type { Product } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Euro, Package, CheckCircle2, Info, ArrowLeft, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/hooks/use-cart"
import { TimeBookingDialog } from "@/components/time-booking-dialog"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const { addToCart } = useCart()

  useEffect(() => {
    async function fetchProduct() {
      try {
        const products = await getProducts()
        const found = products.find(p => p.id === params.id)

        if (found) {
          setProduct(found)
          const related = products
            .filter(p => p.type === found.type && p.id !== found.id)
            .slice(0, 3)
          setRelatedProducts(related)
        }
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  const handleAddToCart = (startDate?: string, endDate?: string, days?: number) => {
    if (!product) return

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
    router.push('/cart')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto border-4 border-[rgb(var(--mavi-blue))] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Loading product...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product not found</h1>
            <Button asChild>
              <Link href="/">Back to Products</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 hover:bg-[rgb(var(--mavi-blue))]/10 hover:text-[rgb(var(--mavi-blue))] group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Sidebar - Related Products - Hidden on mobile, shown on large screens */}
          <div className="hidden lg:block lg:col-span-3 order-2 lg:order-1">
            <div className="sticky top-24 space-y-6">
              <Card className="border-2 border-transparent hover:border-[rgb(var(--mavi-blue))]/20 transition-all">
                <CardContent className="p-4 lg:p-6">
                  <h3 className="font-bold text-base lg:text-lg mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 text-[rgb(var(--mavi-blue))] flex-shrink-0" />
                    Similar Products
                  </h3>
                  <div className="space-y-3">
                    {relatedProducts.map((related) => (
                      <Link
                        key={related.id}
                        href={`/products/${related.id}`}
                        className="block group"
                      >
                        <div className="flex gap-3 p-2 lg:p-3 rounded-xl border-2 border-transparent hover:border-[rgb(var(--mavi-blue))]/30 transition-all">
                          <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={related.image || `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(related.name)}`}
                              alt={related.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-xs lg:text-sm line-clamp-2 group-hover:text-[rgb(var(--mavi-blue))] transition-colors">
                              {related.name}
                            </h4>
                            <p className="text-xs lg:text-sm text-[rgb(var(--mavi-blue))] font-bold mt-1">
                              €{related.price.toFixed(2)}/day
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <Card className="border-2 border-transparent hover:border-[rgb(var(--mavi-blue))]/20 transition-all overflow-hidden animate-fade-in">
              <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden">
                <Image
                  src={product.image || `/placeholder.svg?height=600&width=800&text=${encodeURIComponent(product.name)}`}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                  <Badge
                    variant={product.available ? "default" : "destructive"}
                    className={product.available
                      ? "bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] border-0 shadow-lg text-xs sm:text-sm"
                      : "text-xs sm:text-sm"
                    }
                  >
                    {product.available ? "Available" : "Currently Booked"}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{product.name}</h1>
                    <Badge
                      variant="secondary"
                      className="bg-gradient-to-r from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 border-[rgb(var(--mavi-blue))]/20 w-fit"
                    >
                      {product.type}
                    </Badge>
                  </div>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">{product.description}</p>
                </div>

                <Separator />

                {(product.dimensions || product.capacity) && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {product.dimensions && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 border border-[rgb(var(--mavi-blue))]/20">
                          <p className="text-sm text-muted-foreground mb-1">Dimensions</p>
                          <p className="font-semibold">{product.dimensions}</p>
                        </div>
                      )}
                      {product.capacity && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 border border-[rgb(var(--mavi-blue))]/20">
                          <p className="text-sm text-muted-foreground mb-1">Capacity</p>
                          <p className="font-semibold">{product.capacity}</p>
                        </div>
                      )}
                    </div>
                    <Separator />
                  </>
                )}

                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <>
                    <div>
                      <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                        <Info className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
                        Specifications
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(product.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-start p-3 rounded-lg bg-muted/30">
                            <span className="font-medium text-sm">{key}</span>
                            <span className="text-sm text-muted-foreground text-right ml-4">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {product.features && product.features.length > 0 && (
                  <div>
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-[rgb(var(--mavi-blue))]" />
                      Features
                    </h3>
                    <ul className="space-y-3">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-[rgb(var(--mavi-turquoise))] flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Booking */}
          <div className="lg:col-span-3 order-3">
            <div className="lg:sticky lg:top-24">
              <Card className="border-2 border-[rgb(var(--mavi-blue))]/20 shadow-xl animate-fade-in">
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">Daily Rate</p>
                    <div className="flex items-baseline gap-2">
                      <Euro className="h-5 w-5 sm:h-6 sm:w-6 text-[rgb(var(--mavi-blue))] flex-shrink-0" />
                      <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                        {product.price.toFixed(2)}
                      </span>
                      <span className="text-sm sm:text-base text-muted-foreground">/day</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <CheckCircle2 className="h-4 w-4 text-[rgb(var(--mavi-turquoise))] flex-shrink-0" />
                      <span>Free cancellation up to 24h</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <CheckCircle2 className="h-4 w-4 text-[rgb(var(--mavi-turquoise))] flex-shrink-0" />
                      <span>Instant confirmation</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <CheckCircle2 className="h-4 w-4 text-[rgb(var(--mavi-turquoise))] flex-shrink-0" />
                      <span>Professional support</span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] hover:opacity-90 transition-all hover:scale-105 shadow-lg"
                    onClick={() => setShowBookingDialog(true)}
                    disabled={!product.available}
                  >
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    {product.available ? "Book Now" : "Currently Unavailable"}
                  </Button>

                  {!product.available && (
                    <p className="text-xs text-center text-muted-foreground">
                      This product is currently booked. Please check back later.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <TimeBookingDialog
        product={product}
        open={showBookingDialog}
        onOpenChange={setShowBookingDialog}
        onConfirm={handleAddToCart}
      />
    </div>
  )
}
