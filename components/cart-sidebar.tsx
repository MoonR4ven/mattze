"use client"

import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, X, Trash2, Plus, Minus, ArrowRight, Calendar, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export function CartSidebar() {
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, getTotalPrice, getTotalItems } = useCart()

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={closeCart} />}

      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full md:w-[400px] bg-card border-l shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Shopping Cart</h2>
            {items.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getTotalItems()}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={closeCart}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-2">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mb-4">Add some products to get started</p>
              <Button onClick={closeCart}>Continue Shopping</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.map((item, index) => (
                <div
                  key={`${item.id}-${item.selectedDate}-${item.selectedTime}-${index}`}
                  className="bg-muted/50 rounded-lg p-3 space-y-3"
                >
                  <div className="flex gap-3">
                    <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={item.image || `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(item.name)}`}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {item.type}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {item.selectedDate && item.selectedTime && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(item.selectedDate), "MMM dd, yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{item.selectedTime}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">€{(item.price * item.quantity).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">€{item.price.toFixed(2)} each</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-4 space-y-4 bg-card">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">€{getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (21%)</span>
                  <span className="font-medium">€{(getTotalPrice() * 0.21).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>€{(getTotalPrice() * 1.21).toFixed(2)}</span>
                </div>
              </div>

              <Link href="/checkout" onClick={closeCart}>
                <Button className="w-full" size="lg">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>

              <div className="text-xs text-muted-foreground text-center">Secure checkout powered by Stripe</div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
