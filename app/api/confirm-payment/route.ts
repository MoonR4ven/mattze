import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import * as admin from "firebase-admin"
import { BillbeeAPI } from "@/lib/billbee"
import { GoogleCalendarAPI } from "@/lib/google-calendar"

let db: admin.firestore.Firestore

// Lazy initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (admin.apps.length === 0) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      throw new Error("Missing Firebase Admin credentials. Ensure FIREBASE_PROJECT_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY are set.")
    }

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    })
  }
  
  return admin.firestore()
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build", {
  apiVersion: "2024-06-20",
})

type FinalizePaymentResult =
  | {
      success: true
      orderId: string
      order: admin.firestore.DocumentData
      alreadyProcessed: boolean
    }
  | {
      success: false
      error: string
    }

function isAlreadyExistsError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false
  }

  const code = (error as { code?: unknown }).code
  return code === 6 || code === "6" || code === "already-exists" || code === "ALREADY_EXISTS"
}

async function findExistingOrderByPaymentIntent(
  paymentIntentId: string,
): Promise<admin.firestore.QueryDocumentSnapshot | null> {
  const existingOrderSnapshot = await db
    .collection("orders")
    .where("paymentIntentId", "==", paymentIntentId)
    .limit(1)
    .get()

  return existingOrderSnapshot.empty ? null : existingOrderSnapshot.docs[0]
}

export async function finalizeSuccessfulPayment(paymentIntentId: string): Promise<FinalizePaymentResult> {
  try {
    db = initializeFirebaseAdmin()

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== "succeeded") {
      return { success: false, error: "Payment not successful" }
    }

    const existingOrder = await findExistingOrderByPaymentIntent(paymentIntent.id)
    if (existingOrder) {
      return {
        success: true,
        orderId: existingOrder.id,
        order: existingOrder.data(),
        alreadyProcessed: true,
      }
    }

    // Retrieve order data from Firebase temp_orders
    const tempOrderId = paymentIntent.metadata.tempOrderId
    if (!tempOrderId) {
      throw new Error("No temp order ID found in payment intent metadata")
    }

    const tempOrderRef = db.collection("temp_orders").doc(tempOrderId)
    const tempOrderDoc = await tempOrderRef.get()
    if (!tempOrderDoc.exists) {
      throw new Error("Temp order not found")
    }

    const tempOrderData = tempOrderDoc.data() || {}
    const orderItems = Array.isArray(tempOrderData.items) ? tempOrderData.items : []
    const deliveryInfo = tempOrderData.deliveryInfo || null
    const pricing = tempOrderData.pricing || null

    const addDaysToDateString = (dateString: string, days: number): string => {
      const [year, month, day] = dateString.split("-").map(Number)
      const date = new Date(year, month - 1, day)
      date.setDate(date.getDate() + days)
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, "0")
      const dd = String(date.getDate()).padStart(2, "0")
      return `${yyyy}-${mm}-${dd}`
    }

    const deriveDefaultEndTime = (startTime: string): string => {
      const [hours, minutes] = startTime.split(":").map(Number)
      const endHours = (Number.isFinite(hours) ? hours : 10) + 1
      const endMinutes = Number.isFinite(minutes) ? minutes : 0
      return `${String(endHours % 24).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`
    }

    const getFulfillmentLocation = (customerInfo: {
      address?: string
      postalCode?: string
      city?: string
      country?: string
    }): string => {
      const option = deliveryInfo?.fulfillmentOption
      if (option === "self-collection") {
        const locations: Array<{ name?: string; address?: string }> = Array.isArray(deliveryInfo?.pickupLocations)
          ? deliveryInfo.pickupLocations
          : []
        if (locations.length > 0) {
          return `Self-collection: ${locations.map((loc) => `${loc.name || "Pickup"} (${loc.address || ""})`).join(" | ")}`
        }
        return "Self-collection"
      }

      const addressParts = [customerInfo.address, customerInfo.postalCode, customerInfo.city, customerInfo.country].filter(Boolean)
      const destination = addressParts.join(" ")

      if (option === "delivery-assembly") {
        return destination ? `Delivery + setup: ${destination}` : "Delivery + setup"
      }
      if (option === "delivery-collection") {
        return destination ? `Delivery + collection: ${destination}` : "Delivery + collection"
      }

      return destination || "Delivery/Pickup"
    }

    // Create order in Firebase using Admin SDK
    const orderData = {
      paymentIntentId: paymentIntent.id,
      customerInfo: {
        firstName: paymentIntent.metadata.customerName?.split(" ")[0] || "",
        lastName: paymentIntent.metadata.customerName?.split(" ").slice(1).join(" ") || "",
        email: paymentIntent.metadata.customerEmail || "",
        phone: paymentIntent.metadata.customerPhone || "",
        address: paymentIntent.metadata.customerAddress || "",
        city: paymentIntent.metadata.customerCity || "Amsterdam",
        postalCode: paymentIntent.metadata.customerPostalCode || "",
        country: paymentIntent.metadata.customerCountry || "NL",
      },
      items: orderItems,
      deliveryInfo,
      pricing,
      totalAmount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      status: "confirmed",
      paymentStatus: "paid",
      paymentDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      billbeeOrderId: null,
      billbeeInvoiceId: null,
      billbeeStatus: "pending",
    }

    // Use deterministic order ID per payment intent to guarantee idempotent creation.
    const orderRef = db.collection("orders").doc(paymentIntent.id)
    const orderId = orderRef.id

    try {
      await orderRef.create(orderData)
    } catch (createError) {
      if (isAlreadyExistsError(createError)) {
        const alreadyCreatedOrder = await orderRef.get()
        if (alreadyCreatedOrder.exists) {
          return {
            success: true,
            orderId: alreadyCreatedOrder.id,
            order: alreadyCreatedOrder.data() || {},
            alreadyProcessed: true,
          }
        }
      }

      throw createError
    }

    // Generate custom order number format: XXXXX/year/month
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const orderCounter = Math.floor(Math.random() * 90000) + 10000 // Generate 5-digit number
    const customOrderNumber = `${orderCounter}/${year}/${month}`

    // Update the order with the custom order number
    await orderRef.update({
      customOrderNumber,
    })

    const calendarAPI = new GoogleCalendarAPI()
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary"
    const fulfillmentLocation = getFulfillmentLocation(orderData.customerInfo)

    for (const item of orderItems) {
      const startDate = item.startDate || item.selectedDate
      if (startDate) {
        const baseEndDate = item.endDate || item.selectedDate || startDate
        const startTime = item.startTime || item.selectedTime || "10:00"
        const endTime = item.endTime || deriveDefaultEndTime(startTime)
        const endDayOffset = Number.isFinite(Number(item.endDayOffset)) ? Number(item.endDayOffset) : 0
        const endDate = addDaysToDateString(baseEndDate, endDayOffset)

        const bookingData = {
          orderId,
          productId: item.id,
          productName: item.name,
          date: startDate,
          startDate,
          endDate,
          startTime,
          endTime: endTime,
          endDayOffset,
          customerEmail: paymentIntent.metadata.customerEmail,
          customerName: paymentIntent.metadata.customerName,
          status: "confirmed",
          price: item.totalPrice ?? item.price * item.quantity * ((item.numberOfDays as number) || 1),
          quantity: item.quantity || 1,
          location: fulfillmentLocation,
          fulfillmentOption: deliveryInfo?.fulfillmentOption || null,
          createdAt: new Date().toISOString(),
          calendarEventId: null,
          calendarStatus: "pending",
        }

        const bookingRef = await db.collection("bookings").add(bookingData)

        // Create Google Calendar event
        try {
          const calendarEvent = calendarAPI.createBookingEvent({
            productName: item.name,
            customerName: paymentIntent.metadata.customerName || "",
            customerEmail: paymentIntent.metadata.customerEmail || "",
            date: startDate,
            startDate,
            endDate,
            startTime,
            endTime,
            endDayOffset,
            price: item.totalPrice ?? item.price * item.quantity * ((item.numberOfDays as number) || 1),
            orderId,
            notes: tempOrderData.customerInfo?.notes || undefined,
            location: fulfillmentLocation,
            fulfillmentOption: deliveryInfo?.fulfillmentOption,
          })

          const calendarResult = await calendarAPI.createEvent(calendarId, calendarEvent)

          if (calendarResult.success && calendarResult.eventId) {
            // Update booking with calendar event ID
            await db.collection("bookings").doc(bookingRef.id).update({
              calendarEventId: calendarResult.eventId,
              calendarStatus: "created",
            })

            console.log(`✅ Calendar event created: ${calendarResult.eventId}`)
          } else {
            console.error("❌ Failed to create calendar event:", calendarResult.error)
            await db.collection("bookings").doc(bookingRef.id).update({
              calendarStatus: "failed",
              calendarError: calendarResult.error,
            })
          }
        } catch (calendarError) {
          console.error("❌ Calendar integration error:", calendarError)
          await db.collection("bookings").doc(bookingRef.id).update({
            calendarStatus: "failed",
            calendarError: calendarError instanceof Error ? calendarError.message : "Unknown calendar error",
          })
        }
      }
    }

    try {
      const billbeeAPI = new BillbeeAPI()

      // Update customer email/phone on their profile (like eBay does)
      console.log("📋 Updating customer in Billbee...")
      const customerResult = await billbeeAPI.updateCustomer({
        firstName: orderData.customerInfo.firstName,
        lastName: orderData.customerInfo.lastName,
        email: orderData.customerInfo.email,
        phone: orderData.customerInfo.phone,
        address: orderData.customerInfo.address,
        city: orderData.customerInfo.city,
        postalCode: orderData.customerInfo.postalCode,
        country: orderData.customerInfo.country,
      })

      if (customerResult.success) {
        if (customerResult.customerId) {
          console.log(`✅ Existing customer profile updated: ${customerResult.customerId}`)
        } else {
          console.log("✅ New customer - email will be saved with order")
        }
      }

      // Get payment method details from Stripe
      const paymentMethodType = paymentIntent.payment_method_types?.[0] || "card"
      const paymentMethodName =
        {
          card: "Credit/Debit Card",
          klarna: "Klarna",
          amazon_pay: "Amazon Pay",
          bancontact: "Bancontact",
          eps: "EPS",
          ideal: "iDEAL",
          sepa_debit: "SEPA Direct Debit",
          paypal: "PayPal",
        }[paymentMethodType] || paymentMethodType.toUpperCase()

      // Create the order
      const billbeeResult = await billbeeAPI.createOrder({
        orderId: customOrderNumber,
        paymentIntentId: paymentIntent.id,
        customerInfo: orderData.customerInfo,
        items: orderItems.map((item) => ({
          ...item,
          startDate: item.startDate, // Pass startDate for calendar generation
          endDate: item.endDate, // Pass endDate for calendar generation
          startTime: item.startTime, // Pass startTime for calendar generation
          endTime: item.endTime,
          endDayOffset: item.endDayOffset,
        })),
        totalAmount: orderData.totalAmount,
        currency: orderData.currency,
        locale: paymentIntent.metadata.locale || "en",
        paymentMethod: paymentMethodName,
        deliveryInfo: deliveryInfo || undefined,
        vatRate: pricing?.vatRate,
        paymentDate: orderData.paymentDate,
      })

      if (billbeeResult.success && billbeeResult.billbeeOrderId) {
        // Update Firebase order with Billbee information
        await orderRef.update({
          billbeeOrderId: billbeeResult.billbeeOrderId,
          billbeeStatus: "created",
        })

        // Create invoice in Billbee
        const invoiceResult = await billbeeAPI.createInvoice(billbeeResult.billbeeOrderId)

        if (invoiceResult.success && invoiceResult.invoiceId) {
          await orderRef.update({
            billbeeInvoiceId: invoiceResult.invoiceId,
            billbeeStatus: "invoiced",
          })
        }

        console.log(`✅ Billbee order created: ${billbeeResult.billbeeOrderId}`)
      } else {
        console.error("❌ Failed to create Billbee order:", billbeeResult.error)
        // Update status to indicate Billbee integration failed
        await orderRef.update({
          billbeeStatus: "failed",
          billbeeError: billbeeResult.error,
        })
      }
    } catch (billbeeError) {
      console.error("❌ Billbee integration error:", billbeeError)
      await orderRef.update({
        billbeeStatus: "failed",
        billbeeError: billbeeError instanceof Error ? billbeeError.message : "Unknown Billbee error",
      })
    }

    // Billbee will handle order confirmation emails
    console.log("✅ Order completed. Billbee will send confirmations.")

    // Clean up temp order from Firebase
    try {
      await tempOrderRef.delete()
      console.log("🗑️ Temp order cleaned up")
    } catch (cleanupError) {
      console.error("⚠️ Failed to cleanup temp order:", cleanupError)
    }

    return {
      success: true,
      orderId,
      order: {
        ...orderData,
        customOrderNumber,
      },
      alreadyProcessed: false,
    }
  } catch (error) {
    console.error("Error finalizing payment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to confirm payment",
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const paymentIntentId = body?.paymentIntentId

    if (typeof paymentIntentId !== "string" || paymentIntentId.trim().length === 0) {
      return NextResponse.json({ error: "Missing paymentIntentId" }, { status: 400 })
    }

    const result = await finalizeSuccessfulPayment(paymentIntentId)
    if (!result.success) {
      const statusCode = result.error === "Payment not successful" ? 400 : 500
      return NextResponse.json({ error: result.error }, { status: statusCode })
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      order: result.order,
      alreadyProcessed: result.alreadyProcessed,
    })
  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 })
  }
}
