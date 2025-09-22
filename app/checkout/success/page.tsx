import { CheckCircle, Calendar, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your order. We've received your booking and will contact you shortly.
          </p>
        </div>

        <Card className="text-left mb-8">
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Confirmation Email</h3>
                <p className="text-sm text-muted-foreground">
                  You'll receive a confirmation email with your order details within 5 minutes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Contact from Our Team</h3>
                <p className="text-sm text-muted-foreground">
                  Our team will call you within 24 hours to confirm delivery details and setup requirements.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Delivery & Setup</h3>
                <p className="text-sm text-muted-foreground">
                  We'll deliver and set up your rental items at the scheduled time. Our team will also handle pickup.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
          <Link href="/orders">
            <Button>View My Orders</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
