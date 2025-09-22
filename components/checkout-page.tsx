"use client"

import type React from "react"

import { useState } from "react"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CheckoutSummary } from "@/components/checkout-summary"
import { StripePaymentForm } from "@/components/stripe-payment-form"
import { ShoppingCart, User, Calendar, Clock } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
  notes: string
}

export function CheckoutPage() {
  const { items, getTotalPrice, getTotalItems } = useCart()
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Netherlands",
    notes: "",
  })
  const [currentStep, setCurrentStep] = useState<"info" | "payment">("info")

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some products to checkout</p>
          <Link href="/">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep("payment")
  }

  const updateCustomerInfo = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }))
  }

  const isInfoComplete = () => {
    return (
      customerInfo.firstName &&
      customerInfo.lastName &&
      customerInfo.email &&
      customerInfo.phone &&
      customerInfo.address &&
      customerInfo.city &&
      customerInfo.postalCode
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className={`flex items-center gap-2 ${currentStep === "info" ? "text-primary" : ""}`}>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === "info" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              1
            </div>
            <span>Customer Information</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={`flex items-center gap-2 ${currentStep === "payment" ? "text-primary" : ""}`}>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === "payment" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              2
            </div>
            <span>Payment</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {currentStep === "info" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInfoSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={customerInfo.firstName}
                        onChange={(e) => updateCustomerInfo("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={customerInfo.lastName}
                        onChange={(e) => updateCustomerInfo("lastName", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => updateCustomerInfo("email", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => updateCustomerInfo("phone", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={customerInfo.address}
                      onChange={(e) => updateCustomerInfo("address", e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={customerInfo.city}
                        onChange={(e) => updateCustomerInfo("city", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        value={customerInfo.postalCode}
                        onChange={(e) => updateCustomerInfo("postalCode", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={customerInfo.country}
                        onChange={(e) => updateCustomerInfo("country", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Special Instructions (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={customerInfo.notes}
                      onChange={(e) => updateCustomerInfo("notes", e.target.value)}
                      placeholder="Any special delivery instructions or notes..."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={!isInfoComplete()}>
                    Continue to Payment
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <StripePaymentForm customerInfo={customerInfo} onBack={() => setCurrentStep("info")} />
          )}
        </div>

        <div className="lg:col-span-1">
          <CheckoutSummary />

          {/* Order Items */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={`${item.id}-${item.selectedDate}-${item.selectedTime}-${index}`} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {item.type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">€{(item.price * item.quantity).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Qty: {item.quantity}</div>
                    </div>
                  </div>

                  {item.selectedDate && item.selectedTime && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(item.selectedDate), "MMM dd")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{item.selectedTime}</span>
                      </div>
                    </div>
                  )}

                  {index < items.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
