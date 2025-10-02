// Script to seed some sample bookings for testing
import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc } from "firebase/firestore"

const firebaseConfig = {
  // These will be replaced with actual config values
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const sampleBookings = [
  {
    productId: "10011",
    productName: "Jungle bouncy castle 5.2 x 4.3 x 4m",
    date: "2024-12-25",
    startTime: "10:00",
    endTime: "14:00",
    customerEmail: "john@example.com",
    customerName: "John Smith",
    status: "confirmed",
    price: 340.0,
  },
  {
    productId: "10011",
    productName: "Jungle bouncy castle 5.2 x 4.3 x 4m",
    date: "2024-12-26",
    startTime: "15:00",
    endTime: "19:00",
    customerEmail: "sarah@example.com",
    customerName: "Sarah Johnson",
    status: "pending",
    price: 340.0,
  },
  {
    productId: "10010",
    productName: "Cover set white",
    date: "2024-12-24",
    startTime: "12:00",
    endTime: "13:00",
    customerEmail: "mike@example.com",
    customerName: "Mike Wilson",
    status: "confirmed",
    price: 10.0,
  },
]

async function seedBookings() {
  try {
    console.log("Seeding sample bookings...")

    for (const booking of sampleBookings) {
      await addDoc(collection(db, "bookings"), {
        ...booking,
        createdAt: new Date().toISOString(),
      })
      console.log(`Added booking: ${booking.productName} on ${booking.date}`)
    }

    console.log("✅ Sample bookings seeded successfully!")
  } catch (error) {
    console.error("❌ Error seeding bookings:", error)
  }
}

seedBookings()
