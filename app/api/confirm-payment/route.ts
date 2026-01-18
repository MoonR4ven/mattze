import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import * as admin from "firebase-admin"
import { BillbeeAPI } from "@/lib/billbee"
import { GoogleCalendarAPI } from "@/lib/google-calendar"
import { db as clientDb } from "@/lib/firebase"
import { doc, getDoc, deleteDoc } from "firebase/firestore"

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  })
}

const db = admin.firestore()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build", {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json()

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === "succeeded") {
      // Retrieve order data from Firebase temp_orders
      const tempOrderId = paymentIntent.metadata.tempOrderId
      if (!tempOrderId) {
        throw new Error("No temp order ID found in payment intent metadata")
      }

      const tempOrderDoc = await getDoc(doc(clientDb, "temp_orders", tempOrderId))
      if (!tempOrderDoc.exists()) {
        throw new Error("Temp order not found")
      }

      const tempOrderData = tempOrderDoc.data()
      const orderItems = tempOrderData.items || []

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
        totalAmount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        status: "confirmed",
        paymentStatus: "paid",
        createdAt: new Date().toISOString(),
        billbeeOrderId: null,
        billbeeInvoiceId: null,
        billbeeStatus: "pending",
      }

      const orderRef = await db.collection("orders").add(orderData)
      const orderId = orderRef.id

      // Generate custom order number format: XXXXX/year/month
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const orderCounter = Math.floor(Math.random() * 90000) + 10000 // Generate 5-digit number
      const customOrderNumber = `${orderCounter}/${year}/${month}`

      // Update the order with the custom order number
      await db.collection("orders").doc(orderId).update({
        customOrderNumber: customOrderNumber,
      })

      const calendarAPI = new GoogleCalendarAPI()
      const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary"

      for (const item of orderItems) {
        if (item.selectedDate && item.selectedTime) {
          const endTime = String(Number.parseInt(item.selectedTime.split(":")[0]) + 1).padStart(2, "0") + ":00"

          const bookingData = {
            orderId: orderId,
            productId: item.id,
            productName: item.name,
            date: item.selectedDate,
            startTime: item.selectedTime,
            endTime: endTime,
            customerEmail: paymentIntent.metadata.customerEmail,
            customerName: paymentIntent.metadata.customerName,
            status: "confirmed",
            price: item.price * item.quantity,
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
              date: item.selectedDate,
              startTime: item.selectedTime,
              endTime: endTime,
              price: item.price * item.quantity,
              orderId: orderId,
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
            console.log(`✅ New customer - email will be saved with order`)
          }
        }
        
        // Get payment method details from Stripe
        const paymentMethodType = paymentIntent.payment_method_types?.[0] || "card"
        const paymentMethodName = {
          "card": "Credit/Debit Card",
          "klarna": "Klarna",
          "amazon_pay": "Amazon Pay",
          "bancontact": "Bancontact",
          "eps": "EPS",
          "ideal": "iDEAL",
          "sepa_debit": "SEPA Direct Debit",
          "paypal": "PayPal"
        }[paymentMethodType] || paymentMethodType.toUpperCase()
        
        // Create the order
        const billbeeResult = await billbeeAPI.createOrder({
          orderId: customOrderNumber,
          paymentIntentId: paymentIntent.id,
          customerInfo: orderData.customerInfo,
          items: orderItems.map(item => ({
            ...item,
            startDate: item.startDate, // Pass startDate for calendar generation
            endDate: item.endDate, // Pass endDate for calendar generation
            startTime: item.startTime, // Pass startTime for calendar generation
          })),
          totalAmount: orderData.totalAmount,
          currency: orderData.currency,
          locale: paymentIntent.metadata.locale || "en",
          paymentMethod: paymentMethodName,
        })

        if (billbeeResult.success && billbeeResult.billbeeOrderId) {
          // Update Firebase order with Billbee information
          await db.collection("orders").doc(orderId).update({
            billbeeOrderId: billbeeResult.billbeeOrderId,
            billbeeStatus: "created",
          })

          // Create invoice in Billbee
          const invoiceResult = await billbeeAPI.createInvoice(billbeeResult.billbeeOrderId)

          if (invoiceResult.success && invoiceResult.invoiceId) {
            await db.collection("orders").doc(orderId).update({
              billbeeInvoiceId: invoiceResult.invoiceId,
              billbeeStatus: "invoiced",
            })
          }

          console.log(`✅ Billbee order created: ${billbeeResult.billbeeOrderId}`)
        } else {
          console.error("❌ Failed to create Billbee order:", billbeeResult.error)
          // Update status to indicate Billbee integration failed
          await db.collection("orders").doc(orderId).update({
            billbeeStatus: "failed",
            billbeeError: billbeeResult.error,
          })
        }
      } catch (billbeeError) {
        console.error("❌ Billbee integration error:", billbeeError)
        await db.collection("orders").doc(orderId).update({
          billbeeStatus: "failed",
          billbeeError: billbeeError instanceof Error ? billbeeError.message : "Unknown Billbee error",
        })
      }

      // Billbee will handle order confirmation emails
      console.log("✅ Order completed. Billbee will send confirmations.")

      // Clean up temp order from Firebase
      try {
        await deleteDoc(doc(clientDb, "temp_orders", tempOrderId))
        console.log("🗑️ Temp order cleaned up")
      } catch (cleanupError) {
        console.error("⚠️ Failed to cleanup temp order:", cleanupError)
      }

      return NextResponse.json({
        success: true,
        orderId: orderId,
        order: orderData,
      })
    } else {
      return NextResponse.json({ error: "Payment not successful" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 })
  }
}
