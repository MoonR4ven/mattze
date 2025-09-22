import { type NextRequest, NextResponse } from "next/server"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json()

    // Verify webhook signature if needed
    const signature = request.headers.get("x-billbee-signature")

    // Handle different Billbee webhook events
    switch (webhookData.Type) {
      case "order.shipped":
        await handleOrderShipped(webhookData.Data)
        break
      case "order.cancelled":
        await handleOrderCancelled(webhookData.Data)
        break
      case "invoice.created":
        await handleInvoiceCreated(webhookData.Data)
        break
      default:
        console.log("Unhandled Billbee webhook type:", webhookData.Type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing Billbee webhook:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}

async function handleOrderShipped(orderData: any) {
  try {
    // Find order by Billbee order ID
    const ordersRef = collection(db, "orders")
    const q = query(ordersRef, where("billbeeOrderId", "==", orderData.Id))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const orderDoc = querySnapshot.docs[0]
      await updateDoc(doc(db, "orders", orderDoc.id), {
        status: "shipped",
        billbeeStatus: "shipped",
        shippedAt: new Date().toISOString(),
        trackingNumber: orderData.TrackingNumber || null,
      })

      console.log(`✅ Order ${orderDoc.id} marked as shipped`)
    }
  } catch (error) {
    console.error("Error handling order shipped webhook:", error)
  }
}

async function handleOrderCancelled(orderData: any) {
  try {
    const ordersRef = collection(db, "orders")
    const q = query(ordersRef, where("billbeeOrderId", "==", orderData.Id))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const orderDoc = querySnapshot.docs[0]
      await updateDoc(doc(db, "orders", orderDoc.id), {
        status: "cancelled",
        billbeeStatus: "cancelled",
        cancelledAt: new Date().toISOString(),
      })

      console.log(`✅ Order ${orderDoc.id} marked as cancelled`)
    }
  } catch (error) {
    console.error("Error handling order cancelled webhook:", error)
  }
}

async function handleInvoiceCreated(invoiceData: any) {
  try {
    const ordersRef = collection(db, "orders")
    const q = query(ordersRef, where("billbeeOrderId", "==", invoiceData.OrderId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const orderDoc = querySnapshot.docs[0]
      await updateDoc(doc(db, "orders", orderDoc.id), {
        billbeeInvoiceId: invoiceData.Id,
        billbeeStatus: "invoiced",
        invoiceNumber: invoiceData.InvoiceNumber,
        invoiceCreatedAt: new Date().toISOString(),
      })

      console.log(`✅ Invoice ${invoiceData.Id} linked to order ${orderDoc.id}`)
    }
  } catch (error) {
    console.error("Error handling invoice created webhook:", error)
  }
}
