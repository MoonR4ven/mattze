// scripts/seed-bookings.js
import "dotenv/config"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore"

// Load config from environment
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const sampleBookings = [
  {
    productId: "10015",
    productName: "Bouncy castle 'Funny Dino' with side slide",
    startTime: "2025-07-12",
    endTime: "2025-07-14",
    customerEmail: "anna.schmidt@example.com",
    customerName: "Anna Schmidt",
    status: "confirmed",
    price: 120.0,
  },
  {
    productId: "10014",
    productName: "Partyzelt Pagodenform 5m x 5m",
    startTime: "2025-08-30",
    endTime: "2025-09-02",
    customerEmail: "peter.mueller@example.com",
    customerName: "Peter Müller",
    status: "confirmed",
    price: 80.0,
  },
  {
    productId: "10008",
    productName: "Stand Up Padel Board (SUP)",
    startTime: "2025-06-21",
    endTime: "2025-06-22",
    customerEmail: "lisa.keller@example.com",
    customerName: "Lisa Keller",
    status: "pending",
    price: 20.0,
  },
  {
    productId: "10011",
    productName: "Jungle bouncy castle 5.2 x 4.3 x 4m",
    startTime: "2025-09-10",
    endTime: "2025-09-12",
    customerEmail: "tom.harris@example.com",
    customerName: "Tom Harris",
    status: "confirmed",
    price: 85.0,
  },
  {
    productId: "10001",
    productName: "Bierzeltgarnitur",
    startTime: "2025-12-31",
    endTime: "2026-01-01",
    customerEmail: "julian.bauer@example.com",
    customerName: "Julian Bauer",
    status: "confirmed",
    price: 5.0,
  },
  {
    productId: "10003",
    productName: "Heizpilz",
    startTime: "2025-11-15",
    endTime: "2025-11-20",
    customerEmail: "clara.fischer@example.com",
    customerName: "Clara Fischer",
    status: "cancelled",
    price: 10.0,
  },
  {
    productId: "10016",
    productName: "Copper sulfate 1Kg",
    startTime: "2025-05-05",
    endTime: "2025-05-06",
    customerEmail: "erik.jansen@example.com",
    customerName: "Erik Jansen",
    status: "confirmed",
    price: 9.99,
  },
  {
    productId: "10000",
    productName: "Marquee tent 5x5m",
    startTime: "2025-08-08",
    endTime: "2025-08-10",
    customerEmail: "sophie.lange@example.com",
    customerName: "Sophie Lange",
    status: "confirmed",
    price: 80.0,
  },
  {
    productId: "10009",
    productName: "Cover set for beer tent furniture",
    startTime: "2025-09-25",
    endTime: "2025-09-26",
    customerEmail: "mike@example.com",
    customerName: "Mike Wilson",
    status: "confirmed",
    price: 10.0,
  },
  {
    productId: "10010",
    productName: "Cover set white",
    startTime: "2025-12-24",
    endTime: "2025-12-25",
    customerEmail: "mike@example.com",
    customerName: "Mike Wilson",
    status: "confirmed",
    price: 10.0,
  },
]

async function seedBookings() {
  try {
    console.log("🌱 Seeding sample bookings...")

    for (const booking of sampleBookings) {
      await addDoc(collection(db, "bookings"), {
        ...booking,
        startTime: Timestamp.fromDate(new Date(booking.startTime)),
        endTime: Timestamp.fromDate(new Date(booking.endTime)),
        createdAt: Timestamp.now(),
      })
      console.log(`✅ Added booking: ${booking.productName} (${booking.startTime} → ${booking.endTime})`)
    }

    console.log("🎉 Sample bookings seeded successfully!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding bookings:", error)
    process.exit(1)
  }
}

seedBookings()
