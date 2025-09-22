import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { collection, addDoc, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { BillbeeAPI } from "@/lib/billbee"
import { GoogleCalendarAPI } from "@/lib/google-calendar"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json()

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === "succeeded") {
      // Parse order data from metadata
      const orderItems = JSON.parse(paymentIntent.metadata.orderItems || "[]")

      // Create order in Firebase
      const orderData = {
        paymentIntentId: paymentIntent.id,
        customerInfo: {
          firstName: paymentIntent.metadata.customerName?.split(" ")[0] || "",
          lastName: paymentIntent.metadata.customerName?.split(" ").slice(1).join(" ") || "",
          email: paymentIntent.metadata.customerEmail || "",
          phone: paymentIntent.metadata.customerPhone || "",
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

      const docRef = await addDoc(collection(db, "orders"), orderData)

      const calendarAPI = new GoogleCalendarAPI()
      const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary"

      for (const item of orderItems) {
        if (item.selectedDate && item.selectedTime) {
          const endTime = String(Number.parseInt(item.selectedTime.split(":")[0]) + 1).padStart(2, "0") + ":00"

          const bookingData = {
            orderId: docRef.id,
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

          const bookingRef = await addDoc(collection(db, "bookings"), bookingData)

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
              orderId: docRef.id,
            })

            const calendarResult = await calendarAPI.createEvent(calendarId, calendarEvent)

            if (calendarResult.success && calendarResult.eventId) {
              // Update booking with calendar event ID
              await updateDoc(doc(db, "bookings", bookingRef.id), {
                calendarEventId: calendarResult.eventId,
                calendarStatus: "created",
              })

              console.log(`✅ Calendar event created: ${calendarResult.eventId}`)
            } else {
              console.error("❌ Failed to create calendar event:", calendarResult.error)
              await updateDoc(doc(db, "bookings", bookingRef.id), {
                calendarStatus: "failed",
                calendarError: calendarResult.error,
              })
            }
          } catch (calendarError) {
            console.error("❌ Calendar integration error:", calendarError)
            await updateDoc(doc(db, "bookings", bookingRef.id), {
              calendarStatus: "failed",
              calendarError: calendarError instanceof Error ? calendarError.message : "Unknown calendar error",
            })
          }
        }
      }

      try {
        const billbeeAPI = new BillbeeAPI()
        const billbeeResult = await billbeeAPI.createOrder({
          orderId: docRef.id,
          paymentIntentId: paymentIntent.id,
          customerInfo: orderData.customerInfo,
          items: orderItems,
          totalAmount: orderData.totalAmount,
          currency: orderData.currency,
        })

        if (billbeeResult.success && billbeeResult.billbeeOrderId) {
          // Update Firebase order with Billbee information
          await updateDoc(doc(db, "orders", docRef.id), {
            billbeeOrderId: billbeeResult.billbeeOrderId,
            billbeeStatus: "created",
          })

          // Create invoice in Billbee
          const invoiceResult = await billbeeAPI.createInvoice(billbeeResult.billbeeOrderId)

          if (invoiceResult.success && invoiceResult.invoiceId) {
            await updateDoc(doc(db, "orders", docRef.id), {
              billbeeInvoiceId: invoiceResult.invoiceId,
              billbeeStatus: "invoiced",
            })
          }

          console.log(`✅ Billbee order created: ${billbeeResult.billbeeOrderId}`)
        } else {
          console.error("❌ Failed to create Billbee order:", billbeeResult.error)
          // Update status to indicate Billbee integration failed
          await updateDoc(doc(db, "orders", docRef.id), {
            billbeeStatus: "failed",
            billbeeError: billbeeResult.error,
          })
        }
      } catch (billbeeError) {
        console.error("❌ Billbee integration error:", billbeeError)
        await updateDoc(doc(db, "orders", docRef.id), {
          billbeeStatus: "failed",
          billbeeError: billbeeError instanceof Error ? billbeeError.message : "Unknown Billbee error",
        })
      }

      return NextResponse.json({
        success: true,
        orderId: docRef.id,
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
