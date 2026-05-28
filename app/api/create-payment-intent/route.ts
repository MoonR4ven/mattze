import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import * as admin from "firebase-admin"
import {
  buildRequestedQuantitiesByProductDate,
  getBookedDatesForReservation,
  getReservationKey,
  getReservationProductId,
  toPositiveQuantity,
} from "@/lib/booking-availability"

let db: admin.firestore.Firestore

function initializeFirebaseAdmin() {
  if (admin.apps.length === 0) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      throw new Error("Missing Firebase Admin credentials. Ensure FIREBASE_PROJECT_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY are set.")
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        privateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    })
  }

  return admin.firestore()
}

function formatAvailabilityError(locale: string, productName: string, available: number): string {
  const safeName = productName || (locale === "de" ? "Dieser Artikel" : "This item")

  if (locale === "de") {
    if (available > 0) {
      return `Für ${safeName} sind für die ausgewählten Tage nur noch ${available} verfügbar.`
    }

    return `${safeName} ist für die ausgewählten Tage vollständig ausgebucht.`
  }

  if (available > 0) {
    return `Only ${available} ${available === 1 ? "unit is" : "units are"} available for ${safeName} on the selected dates.`
  }

  return `${safeName} is fully booked for the selected dates.`
}

async function validateBookingAvailability(
  items: Array<Record<string, unknown>>,
  locale: string,
): Promise<string | null> {
  const requestedQuantities = buildRequestedQuantitiesByProductDate(items)
  if (requestedQuantities.length === 0) {
    return null
  }

  db = initializeFirebaseAdmin()

  const relevantProductIds = [...new Set(requestedQuantities.map((entry) => entry.productId))]

  const [productSnapshots, ordersSnapshot, blockedSnapshot] = await Promise.all([
    Promise.all(
      relevantProductIds.map(async (productId) => [productId, await db.collection("products").doc(productId).get()] as const),
    ),
    db.collection("orders").where("status", "==", "confirmed").get(),
    db.collection("bookings").where("status", "==", "blocked").get(),
  ])

  const productInventory = new Map<string, number>()
  const productNames = new Map<string, string>()

  for (const [productId, snapshot] of productSnapshots) {
    const data = snapshot.data() || {}
    const inventory = Number(data.inventory)
    productInventory.set(productId, Number.isFinite(inventory) && inventory > 0 ? Math.floor(inventory) : 1)

    if (typeof data.name === "string" && data.name) {
      productNames.set(productId, data.name)
    }
  }

  const reservedQuantities = new Map<string, number>()

  const reserveQuantity = (productId: string, date: string, quantity: number) => {
    const key = getReservationKey(productId, date)
    reservedQuantities.set(key, (reservedQuantities.get(key) || 0) + quantity)
  }

  for (const orderDoc of ordersSnapshot.docs) {
    const order = orderDoc.data()
    if (!Array.isArray(order.items)) {
      continue
    }

    for (const item of order.items) {
      const productId = getReservationProductId(item)
      if (!productId || !productInventory.has(productId)) {
        continue
      }

      const quantity = toPositiveQuantity(item.quantity)
      for (const bookedDate of getBookedDatesForReservation(item)) {
        reserveQuantity(productId, bookedDate, quantity)
      }
    }
  }

  for (const blockedDoc of blockedSnapshot.docs) {
    const blockedBooking = blockedDoc.data()
    const productId = getReservationProductId(blockedBooking)
    if (!productId || !productInventory.has(productId)) {
      continue
    }

    const quantity = toPositiveQuantity(blockedBooking.quantity)
    for (const bookedDate of getBookedDatesForReservation(blockedBooking)) {
      reserveQuantity(productId, bookedDate, quantity)
    }
  }

  for (const request of requestedQuantities) {
    const inventory = productInventory.get(request.productId) ?? 1
    const reserved = reservedQuantities.get(request.key) ?? 0
    const available = Math.max(0, inventory - reserved)

    if (request.quantity > available) {
      return formatAvailabilityError(
        locale,
        request.productName || productNames.get(request.productId) || "",
        available,
      )
    }
  }

  return null
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build"

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production" && stripeSecretKey.startsWith("sk_test_")) {
      return NextResponse.json(
        { error: "Payments are temporarily unavailable due to test mode configuration." },
        { status: 503 },
      )
    }

    const body = await request.json()
    const { amount, currency = "eur", customerInfo, items, locale = "en", deliveryInfo, pricing } = body

    const availabilityError = await validateBookingAvailability(items, locale)
    if (availabilityError) {
      return NextResponse.json({ error: availabilityError }, { status: 409 })
    }

    console.log("💰 Creating payment intent for amount:", amount, "cents (", amount / 100, "euros )")

    db = initializeFirebaseAdmin()

    // Store order items in Firebase to avoid Stripe metadata size limits
    const tempOrderRef = await db.collection("temp_orders").add({
      items,
      customerInfo,
      deliveryInfo: deliveryInfo || null,
      pricing: pricing || null,
      amount,
      currency,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    })

    // Create payment intent (amount is already in cents from frontend)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Already in cents, no need to multiply again
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address || "",
        customerCity: customerInfo.city || "",
        customerPostalCode: customerInfo.postalCode || "",
        customerCountry: customerInfo.country || "NL",
        itemCount: items.length.toString(),
        tempOrderId: tempOrderRef.id, // Reference to Firebase temp order
        locale: locale,
        fulfillmentOption: deliveryInfo?.fulfillmentOption || "",
        deliveryDistanceKm: deliveryInfo?.distanceKm != null ? String(deliveryInfo.distanceKm) : "",
        deliveryFee: deliveryInfo?.fee != null ? String(deliveryInfo.fee) : "",
      },
      receipt_email: customerInfo.email,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
