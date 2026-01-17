"use client"

import { useSearchParams } from "next/navigation"
import { CheckCircle, Calendar, Mail, Phone, Package, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const paymentIntentId = searchParams.get("payment_intent")

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Success Header */}
      <div className="text-center mb-12">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
            <CheckCircle className="h-20 w-20 text-green-500 relative" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-lg text-muted-foreground">
          Thank you for your booking. Your payment has been processed successfully.
        </p>
      </div>

      {/* Order ID */}
      {paymentIntentId && (
        <Card className="mb-6 bg-slate-50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Order Reference</p>
            <p className="font-mono text-sm font-semibold break-all">{paymentIntentId}</p>
          </CardContent>
        </Card>
      )}

      {/* Integration Status */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Payment</span>
            </div>
            <Badge className="bg-green-100 text-green-800">Completed</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Billbee</span>
            </div>
            <Badge variant="outline" className="text-blue-700">Processing</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Calendar</span>
            </div>
            <Badge variant="outline" className="text-purple-700">Syncing</Badge>
          </CardContent>
        </Card>
      </div>

      {/* What Happens Next */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            What Happens Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                1
              </div>
              <div className="w-0.5 h-12 bg-muted mt-2"></div>
            </div>
            <div className="pb-8">
              <h3 className="font-semibold mb-1">Payment Confirmed</h3>
              <p className="text-sm text-muted-foreground">Your payment has been securely processed through Stripe and your order is being created.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                2
              </div>
              <div className="w-0.5 h-12 bg-muted mt-2"></div>
            </div>
            <div className="pb-8">
              <h3 className="font-semibold mb-1">Order Synced to Billbee</h3>
              <p className="text-sm text-muted-foreground">Your order details are being automatically synced to Billbee for inventory and invoicing management.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                3
              </div>
              <div className="w-0.5 h-12 bg-muted mt-2"></div>
            </div>
            <div className="pb-8">
              <h3 className="font-semibold mb-1">Calendar Updated</h3>
              <p className="text-sm text-muted-foreground">Your booking dates and times have been added to our calendar system for scheduling.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                4
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Confirmation Email</h3>
              <p className="text-sm text-muted-foreground">You'll receive a confirmation email with your complete order details within 5 minutes.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium">Email Support</h3>
              <p className="text-sm text-muted-foreground">
                mavi.ostercappeln@gmail.com
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium">Our Team</h3>
              <p className="text-sm text-muted-foreground">
                We typically respond within 24 hours during business hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center flex-wrap">
        <Button asChild variant="outline" size="lg">
          <Link href="/">Back to Home</Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/products">Browse More Products</Link>
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="mt-8 bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Your order information has been sent to your email. Check your inbox (and spam folder) for a confirmation email with all your booking details.
        </AlertDescription>
      </Alert>
    </div>
  )
}
