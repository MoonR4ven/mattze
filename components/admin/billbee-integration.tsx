"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, ExternalLink, CheckCircle, AlertCircle, Clock } from "lucide-react"

interface Order {
  id: string
  billbeeOrderId?: string
  billbeeInvoiceId?: string
  invoiceNumber?: string | number
  billbeeStatus?: string
  billbeeError?: string
  status: string
  customerInfo: {
    firstName: string
    lastName: string
    email: string
  }
  totalAmount: number
  createdAt: string
}

interface BillbeeIntegrationProps {
  order: Order
  onOrderUpdate: (updatedOrder: Order) => void
}

export function BillbeeIntegration({ order, onOrderUpdate }: BillbeeIntegrationProps) {
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSyncOrder = async () => {
    setSyncing(true)
    setError(null)

    try {
      const response = await fetch("/api/billbee/sync-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: order.id }),
      })

      const result = await response.json()

      if (result.success) {
        onOrderUpdate(result.order)
      } else {
        setError(result.error || "Failed to sync order")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Sync error:", err)
    } finally {
      setSyncing(false)
    }
  }

  const getBillbeeStatusBadge = (status?: string) => {
    switch (status) {
      case "created":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Created
          </Badge>
        )
      case "invoiced":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Invoiced
          </Badge>
        )
      case "shipped":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Shipped
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "created":
      case "invoiced":
      case "shipped":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-[rgb(var(--mavi-bright-blue))]" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card className="bg-slate-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Billbee Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon(order.billbeeStatus)}
              {getBillbeeStatusBadge(order.billbeeStatus)}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Billbee Order ID</label>
            <div className="mt-1">
              {order.billbeeOrderId ? (
                <a
                  href={`https://app.billbee.io/orders/${order.billbeeOrderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {order.billbeeOrderId}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-muted-foreground">Not created</span>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Invoice ID</label>
            <div className="mt-1">
              {order.billbeeInvoiceId ? (
                <a
                  href={`https://app.billbee.io/invoices/${order.billbeeInvoiceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {order.billbeeInvoiceId}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-muted-foreground">Not created</span>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
            <div className="mt-1">
              {order.invoiceNumber ? (
                <span>{order.invoiceNumber}</span>
              ) : (
                <span className="text-muted-foreground">Unavailable</span>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Actions</label>
            <div className="mt-1">
              <Button variant="outline" size="sm" onClick={handleSyncOrder} disabled={syncing || !order.billbeeOrderId}>
                {syncing ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Sync Status
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {order.billbeeError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Billbee Error:</strong> {order.billbeeError}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Orders are automatically sent to Billbee after payment confirmation</p>
          <p>• Invoices are generated automatically in Billbee</p>
          <p>• Use sync button to update status from Billbee</p>
        </div>
      </CardContent>
    </Card>
  )
}
