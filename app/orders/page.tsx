"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { de, enUS } from "date-fns/locale"
import { useI18n } from "@/contexts/i18n-context"

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  selectedDate?: string
  selectedTime?: string
}

interface Order {
  id: string
  paymentIntentId: string
  customerInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  items: OrderItem[]
  totalAmount: number
  currency: string
  status: string
  paymentStatus: string
  billbeeStatus: string
  billbeeOrderId?: string
  calendarStatus: string
  createdAt: string
}

export default function OrdersPage() {
  const { user } = useAuth()
  const { t, locale } = useI18n()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const dateLocale = locale === "de" ? de : enUS

  useEffect(() => {
    async function fetchOrders() {
      if (!user?.email) {
        setLoading(false)
        return
      }

      try {
        console.log("🔍 Fetching orders for email:", user.email)
        const ordersRef = collection(db, "orders")
        const q = query(ordersRef, where("customerInfo.email", "==", user.email))
        const snapshot = await getDocs(q)

        const fetchedOrders: Order[] = []
        snapshot.forEach((doc) => {
          fetchedOrders.push({
            id: doc.id,
            ...doc.data(),
          } as Order)
        })

        // Sort by creation date (newest first)
        fetchedOrders.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        console.log("✅ Orders loaded:", fetchedOrders.length)
        setOrders(fetchedOrders)
      } catch (err) {
        console.error("❌ Error fetching orders:", err)
        setError(t("orders.loadFailed"))
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user?.email, t])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("orders.loginRequired")}{" "}
            <Link href="/login" className="underline font-medium">
              {t("orders.goToLogin")}
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">{t("orders.loadingOrders")}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-20">
          <div className="mx-auto mb-6 p-6 rounded-3xl bg-gradient-to-br from-blue-100 to-turquoise-100 w-fit">
            <Package className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("orders.noOrdersYet")}</h1>
          <p className="text-muted-foreground mb-6">
            {t("orders.noOrdersDescription")}
          </p>
          <Button asChild size="lg">
            <Link href="/products">{t("orders.browseProducts")}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t("orders.yourOrders")}</h1>
        <p className="text-muted-foreground">
          {t("orders.manageBookings")}
        </p>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-turquoise-50 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl mb-2">
                    {t("orders.orderLabel")} {order.paymentIntentId.slice(-8).toUpperCase()}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(
                      new Date(order.createdAt),
                      "PPP p",
                      { locale: dateLocale }
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge
                    variant={
                      order.paymentStatus === "paid" ? "default" : "outline"
                    }
                  >
                    {order.paymentStatus === "paid" ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {t("orders.paid")}
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        {t("orders.pending")}
                      </>
                    )}
                  </Badge>
                  <Badge variant="outline">{order.status}</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">{t("orders.itemsLabel")}</h3>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-sm pb-2 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.selectedDate && (
                          <p className="text-xs text-muted-foreground">
                            📅 {item.selectedDate}
                            {item.selectedTime && ` ${t("orders.atTime")} ${item.selectedTime}`}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          €{(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity}x €{item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integration Status */}
              <div className="grid md:grid-cols-3 gap-4 mb-6 py-6 border-t border-b">
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    💳 {t("orders.payment")}
                  </p>
                  <Badge
                    variant={
                      order.paymentStatus === "paid" ? "default" : "outline"
                    }
                    className="w-full justify-center"
                  >
                    {order.paymentStatus === "paid"
                      ? `✓ ${t("orders.confirmed")}`
                      : t("orders.processing")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    📦 {t("orders.billbee")}
                  </p>
                  <Badge
                    variant={
                      order.billbeeStatus === "invoiced"
                        ? "default"
                        : order.billbeeStatus === "failed"
                          ? "destructive"
                          : "outline"
                    }
                    className="w-full justify-center"
                  >
                    {order.billbeeStatus === "invoiced"
                      ? `✓ ${t("orders.invoiced")}`
                      : order.billbeeStatus === "created"
                        ? `✓ ${t("orders.created")}`
                        : order.billbeeStatus === "failed"
                          ? `✗ ${t("orders.failed")}`
                          : t("orders.pending")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    📅 {t("orders.calendar")}
                  </p>
                  <Badge
                    variant={
                      order.calendarStatus === "created"
                        ? "default"
                        : order.calendarStatus === "failed"
                          ? "destructive"
                          : "outline"
                    }
                    className="w-full justify-center"
                  >
                    {order.calendarStatus === "created"
                      ? `✓ ${t("orders.scheduled")}`
                      : order.calendarStatus === "failed"
                        ? `✗ ${t("orders.failed")}`
                        : t("orders.pending")}
                  </Badge>
                </div>
              </div>

              {/* Order Total */}
              <div className="flex justify-end items-center gap-4 mb-4">
                <span className="text-lg font-semibold">{t("orders.totalLabel")}</span>
                <span className="text-2xl font-bold text-primary">
                  €{order.totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-muted/50 p-4 rounded-lg text-sm">
                <p className="font-medium mb-2">{t("orders.contactInformation")}</p>
                <p>
                  {order.customerInfo.firstName} {order.customerInfo.lastName}
                </p>
                <p className="text-muted-foreground">
                  {order.customerInfo.email}
                </p>
                <p className="text-muted-foreground">
                  {order.customerInfo.phone}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 justify-center mt-8">
        <Button variant="outline" asChild>
          <Link href="/">{t("orders.backToHome")}</Link>
        </Button>
        <Button asChild>
          <Link href="/products">{t("orders.continueShopping")}</Link>
        </Button>
      </div>
    </div>
  )
}
