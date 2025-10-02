// Script to seed the Firebase database with initial products
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

const products = [
  {
    id: "10010",
    name: "Cover set white",
    description: "Premium white cover set for outdoor events",
    type: "Article",
    price: 10.0,
    available: true,
    image: "/white-event-cover-set.jpg",
  },
  {
    id: "10011",
    name: "Jungle bouncy castle 5.2 x 4.3 x 4m",
    description: "Large jungle-themed bouncy castle perfect for parties",
    type: "Article",
    price: 85.0,
    available: true,
    image: "/jungle-bouncy-castle-inflatable.jpg",
  },
  {
    id: "10012",
    name: "Party tent 6x4m",
    description: "Spacious party tent for outdoor celebrations",
    type: "Article",
    price: 45.0,
    available: true,
    image: "/white-party-tent-outdoor.jpg",
  },
  {
    id: "10013",
    name: "Sound system package",
    description: "Complete sound system with microphones and speakers",
    type: "Article",
    price: 35.0,
    available: true,
    image: "/professional-sound-system-speakers.jpg",
  },
]

async function seedProducts() {
  try {
    console.log("Seeding products...")

    for (const product of products) {
      await addDoc(collection(db, "products"), product)
      console.log(`Added product: ${product.name}`)
    }

    console.log("✅ Products seeded successfully!")
  } catch (error) {
    console.error("❌ Error seeding products:", error)
  }
}

seedProducts()
