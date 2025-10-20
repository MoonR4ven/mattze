"use client"

import { useState, useEffect } from "react"
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

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+43 123 456 789",
    totalOrders: 5,
    totalSpent: 1250.00,
    lastOrder: "2025-01-15",
    status: "active"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "+43 987 654 321",
    totalOrders: 3,
    totalSpent: 890.00,
    lastOrder: "2025-01-10",
    status: "active"
  },
  {
    id: "3",
    name: "Mike Wilson",
    email: "mike.wilson@example.com",
    totalOrders: 1,
    totalSpent: 180.00,
    lastOrder: "2024-12-20",
    status: "inactive"
  }
]

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === "active").length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 border border-[rgb(var(--mavi-blue))]/20">
                <Users className="h-8 w-8 text-[rgb(var(--mavi-blue))]" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                  Customer Management
                </h1>
                <p className="text-muted-foreground mt-1">
                  View and manage your customers
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-[rgb(var(--mavi-blue))]/20 transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                  {totalCustomers}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-[rgb(var(--mavi-blue))]/20 transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {activeCustomers}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-[rgb(var(--mavi-blue))]/20 transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-[rgb(var(--mavi-blue))] to-[rgb(var(--mavi-turquoise))] bg-clip-text text-transparent">
                  €{totalRevenue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="border-2 hover:border-[rgb(var(--mavi-blue))]/20 transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-4 rounded-full bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10">
                      <UserCircle2 className="h-10 w-10 text-[rgb(var(--mavi-blue))]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{customer.name}</h3>
                        <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                          {customer.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap md:flex-nowrap gap-6 md:gap-8 justify-between md:justify-end">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">Orders</div>
                      <div className="text-2xl font-bold text-[rgb(var(--mavi-blue))]">
                        {customer.totalOrders}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">Total Spent</div>
                      <div className="text-2xl font-bold text-[rgb(var(--mavi-turquoise))]">
                        €{customer.totalSpent.toFixed(2)}
                      </div>
                    </div>
                    {customer.lastOrder && (
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Last Order</div>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Calendar className="h-4 w-4" />
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
            <CardContent className="text-center py-20">
              <div className="mx-auto mb-6 p-6 rounded-3xl bg-gradient-to-br from-[rgb(var(--mavi-blue))]/10 to-[rgb(var(--mavi-turquoise))]/10 w-fit">
                <Users className="h-20 w-20 text-[rgb(var(--mavi-blue))]" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No customers found</h3>
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
