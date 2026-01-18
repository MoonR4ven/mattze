"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Mail, Phone, Calendar, Search, UserCircle2 } from "lucide-react"

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  totalOrders: number
  totalSpent: number
  lastOrder?: string
  status: "active" | "inactive"
}

interface Order {
  id: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  totalPrice: number
  createdAt: any
  status: string
}

// Helper to safely convert Firestore timestamp to Date
const toDate = (value: any): Date => {
  if (!value) return new Date()
  try {
    if (value.toDate && typeof value.toDate === 'function') return value.toDate()
    if (typeof value === 'string') return new Date(value)
    if (value instanceof Date) return value
    if (typeof value === 'number') return new Date(value)
  } catch (e) {
    console.error('Error converting date:', e)
  }
  return new Date()
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      console.log("📊 Fetching customers from orders collection...")
      const ordersRef = collection(db, "orders")
      const q = query(ordersRef, orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      console.log("✅ Orders fetched:", querySnapshot.docs.length)

      const orders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[]

      // If no orders, try fetching from bookings instead
      if (orders.length === 0) {
        console.log("⚠️ No orders found, trying bookings collection...")
        const bookingsRef = collection(db, "bookings")
        const bookingsQuery = query(bookingsRef, orderBy("createdAt", "desc"))
        const bookingsSnapshot = await getDocs(bookingsQuery)
        console.log("✅ Bookings fetched:", bookingsSnapshot.docs.length)
        
        const bookings = bookingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          customerEmail: doc.data().customerEmail,
          customerName: doc.data().customerName,
          customerPhone: doc.data().customerPhone,
          totalPrice: doc.data().price,
          createdAt: doc.data().createdAt,
        })) as Order[]
        
        orders.push(...bookings)
      }

      // Group orders by customer email
      const customerMap = new Map<string, Customer>()

      orders.forEach((order) => {
        const email = order.customerEmail?.toLowerCase() || ""
        if (!email) return

        const existing = customerMap.get(email)
        const orderDate = toDate(order.createdAt)

        if (existing) {
          existing.totalOrders++
          existing.totalSpent += order.totalPrice || 0
          const existingLastOrder = existing.lastOrder ? new Date(existing.lastOrder) : new Date(0)
          if (orderDate > existingLastOrder) {
            existing.lastOrder = orderDate.toISOString()
          }
        } else {
          customerMap.set(email, {
            id: email,
            name: order.customerName || "Unknown",
            email: order.customerEmail || "",
            phone: order.customerPhone,
            totalOrders: 1,
            totalSpent: order.totalPrice || 0,
            lastOrder: orderDate.toISOString(),
            status: "active", // Consider active if they have orders
          })
        }
      })

      // Convert to array and determine active/inactive status
      const customersArray = Array.from(customerMap.values()).map((customer) => {
        const lastOrderDate = customer.lastOrder ? new Date(customer.lastOrder) : new Date(0)
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        
        return {
          ...customer,
          status: (lastOrderDate > threeMonthsAgo ? "active" : "inactive") as "active" | "inactive",
        }
      })

      // Sort by total spent (highest first)
      customersArray.sort((a, b) => b.totalSpent - a.totalSpent)

      console.log("📊 Customers processed:", customersArray.length)
      setCustomers(customersArray)
    } catch (error) {
      console.error("❌ Error fetching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === "active").length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto border-4 border-[rgb(var(--mavi-blue))] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Loading customers...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 border border-[rgb(var(--mavi-blue))]/20">
              <Users className="h-7 w-7 text-[rgb(var(--mavi-blue))]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                Customers
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                View and manage your customers
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Card className="border-2 hover:border-[rgb(var(--mavi-blue))]/30 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-2.5 text-center">
                <div className="text-xs text-muted-foreground">Total Customers</div>
                <div className="text-4xl font-bold text-[rgb(var(--mavi-blue))]">
                  {totalCustomers}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-300 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-2.5 text-center">
                <div className="text-xs text-muted-foreground">Active Customers</div>
                <div className="text-4xl font-bold text-green-600">
                  {activeCustomers}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-[rgb(var(--mavi-turquoise))]/30 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-2.5 text-center">
                <div className="text-xs text-muted-foreground">Total Revenue</div>
                <div className="text-4xl font-bold text-[rgb(var(--mavi-turquoise))]">
                  €{totalRevenue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 border-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="border-2 hover:border-[rgb(var(--mavi-blue))]/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.01]">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-3 rounded-full bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10">
                      <UserCircle2 className="h-8 w-8 text-[rgb(var(--mavi-blue))]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-lg font-bold">{customer.name}</h3>
                        <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                          {customer.status}
                        </Badge>
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-6 justify-between md:justify-end">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-0.5">Orders</div>
                      <div className="text-xl font-bold text-[rgb(var(--mavi-blue))]">
                        {customer.totalOrders}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-0.5">Total Spent</div>
                      <div className="text-xl font-bold text-[rgb(var(--mavi-turquoise))]">
                        €{customer.totalSpent.toFixed(2)}
                      </div>
                    </div>
                    {customer.lastOrder && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-0.5">Last Order</div>
                        <div className="flex items-center gap-1 text-xs font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(customer.lastOrder).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <Card className="border-2 border-dashed border-border">
            <CardContent className="text-center py-16">
              <div className="mx-auto mb-4 p-5 rounded-3xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 w-fit">
                <Users className="h-16 w-16 text-[rgb(var(--mavi-blue))]" />
              </div>
              <h3 className="text-xl font-bold mb-2">No customers found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search terms" : "No customers yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
