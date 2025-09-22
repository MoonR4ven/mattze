import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { BillbeeAPI } from "@/lib/billbee"

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Get order from Firebase
    const orderDoc = await getDoc(doc(db, "orders", orderId))

    if (!orderDoc.exists()) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const orderData = orderDoc.data()

    if (!orderData.billbeeOrderId) {
      return NextResponse.json({ error: "Order not linked to Billbee" }, { status: 400 })
    }

    // Sync with Billbee
    const billbeeAPI = new BillbeeAPI()
    const billbeeOrder = await billbeeAPI.getOrder(orderData.billbeeOrderId)

    // Update local order with Billbee data
    const updates: any = {
      billbeeStatus: "synced",
      lastSyncedAt: new Date().toISOString(),
    }

    // Map Billbee order states to our status
    if (billbeeOrder.Data) {
      const billbeeState = billbeeOrder.Data.State
      switch (billbeeState) {
        case 1: // Confirmed
          updates.status = "confirmed"
          break
        case 2: // Processing
          updates.status = "processing"
          break
        case 3: // Shipped
          updates.status = "shipped"
          break
        case 4: // Delivered
          updates.status = "delivered"
          break
        case 5: // Cancelled
          updates.status = "cancelled"
          break
      }

      if (billbeeOrder.Data.InvoiceNumber) {
        updates.invoiceNumber = billbeeOrder.Data.InvoiceNumber
      }
    }

    await updateDoc(doc(db, "orders", orderId), updates)

    return NextResponse.json({
      success: true,
      order: { ...orderData, ...updates },
    })
  } catch (error) {
    console.error("Error syncing order with Billbee:", error)
    return NextResponse.json({ error: "Failed to sync order" }, { status: 500 })
  }
}
