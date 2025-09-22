// Script to seed the Firebase database with initial products
import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const products = [
  {
    "id": "10016",
    "name": "Copper sulfate 1Kg",
    "description": "CuSO4 5H2O Copper II sulfate pentahydrate",
    "type": "Article",
    "price": 9.99
  },
  {
    "id": "10015",
    "name": "Bouncy castle 'Funny Dino' with side slide",
    "description": "",
    "type": "Article",
    "price": 120.00
  },
  {
    "id": "10014",
    "name": "Partyzelt Pagodenform 5m x 5m",
    "description": "",
    "type": "Article",
    "price": 80.00
  },
  {
    "id": "10013",
    "name": "11 KG propane gas filling",
    "description": "",
    "type": "Article",
    "price": 30.00
  },
  {
    "id": "10012",
    "name": "Gas deposit bottle for 11KG",
    "description": "",
    "type": "Article",
    "price": 0.00
  },
  {
    "id": "10011",
    "name": "11KW radiant heater",
    "description": "",
    "type": "Article",
    "price": 10.00
  },
  {
    "id": "",
    "name": "Copper sulfate 1Kg",
    "description": "CuSO4 5H2O Copper II sulfate pentahydrate",
    "type": "Article",
    "price": 9.99
  },
  {
    "id": "",
    "name": "Firewood, beech 20 kg, max 30 cm length",
    "description": "",
    "type": "Article",
    "price": 22.35
  },
  {
    "id": "",
    "name": "Dried flowers Lagurus White 120 pcs",
    "description": "Bunny tail",
    "type": "Article",
    "price": 11.99
  },
  {
    "id": "",
    "name": "Dried flowers Lagurus Blue/Grey 30 pcs",
    "description": "Hare's tail",
    "type": "Article",
    "price": 9.99
  },
  {
    "id": "",
    "name": "Dried flowers Eucalyptus Cinerea 10 pieces",
    "description": "",
    "type": "Article",
    "price": 13.99
  },
  {
    "id": "10000",
    "name": "Marquee tent 5x5m",
    "description": "",
    "type": "Article",
    "price": 80.00
  },
  {
    "id": "10001",
    "name": "Bierzeltgarnitur",
    "description": "",
    "type": "Article",
    "price": 5.00
  },
  {
    "id": "10002",
    "name": "Bar table",
    "description": "",
    "type": "Article",
    "price": 5.00
  },
  {
    "id": "10003",
    "name": "Heizpilz",
    "description": "",
    "type": "Article",
    "price": 10.00
  },
  {
    "id": "10005",
    "name": "Deposit bottle for 5kg propane gas",
    "description": "",
    "type": "Article",
    "price": 0.00
  },
  {
    "id": "10006",
    "name": "5kg propane gas filling",
    "description": "",
    "type": "Article",
    "price": 15.00
  },
  {
    "id": "10007",
    "name": "Bar table cover white",
    "description": "Including cleaning",
    "type": "Article",
    "price": 5.00
  },
  {
    "id": "10008",
    "name": "Stand Up Padel Board (SUP)",
    "description": "Including accessories",
    "type": "Article",
    "price": 20.00
  },
  {
    "id": "10009",
    "name": "Cover set for beer tent furniture",
    "description": "Anthracite",
    "type": "Article",
    "price": 10.00
  },
  {
    "id": "10010",
    "name": "Cover set white",
    "description": "",
    "type": "Article",
    "price": 10.00
  },
  {
    "id": "10011",
    "name": "Jungle bouncy castle 5.2 x 4.3 x 4m",
    "description": "",
    "type": "Article",
    "price": 85.00
  }
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
