const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

// Initialize Firebase Admin SDK with service account
let serviceAccount

// Try to load from local file first (for local development)
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json')
if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = require(serviceAccountPath)
} else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
  // Load from environment variables (for CI/CD and production)
  serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_ID,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  }
} else {
  console.error('❌ serviceAccountKey.json not found and env variables not set!')
  console.error('For local development: Get serviceAccountKey.json from Google Cloud Console')
  console.error('For production: Set GOOGLE_SERVICE_ACCOUNT_* environment variables')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

const mockProducts = [
  {
    id: 'dried-flowers-1',
    name: 'Dried flowers Lagurus Blue/Grey 30 pcs',
    description: 'Beautiful dried pampas grass and lagurus flowers in blue and grey tones. Perfect for events, weddings, or home decoration.',
    type: 'Flowers',
    price: 9.99,
    image: 'https://via.placeholder.com/400x300?text=Dried+Flowers',
    available: true,
    specifications: {
      material: 'Natural dried flowers',
      color: 'Blue/Grey mix',
      quantity: '30 stems',
      height: '60-80cm',
      uvProtection: 'High - faded resistant'
    },
    features: [
      '30 pieces of dried lagurus and pampas grass',
      'Premium quality, long lasting',
      'Color-coordinated blue and grey tones',
      'Perfect for weddings, events, or home decor',
      'Ships in protective packaging'
    ],
    dimensions: '60-80cm height',
    capacity: 'Single bundle'
  },
  {
    id: 'dried-flowers-2',
    name: 'Premium Pampa Grass Bundle White 25 pcs',
    description: 'Luxurious white dried pampas grass bundle. High quality and perfect for modern wedding and event styling.',
    type: 'Flowers',
    price: 12.99,
    image: 'https://via.placeholder.com/400x300?text=Pampas+Grass',
    available: true,
    specifications: {
      material: 'Natural dried pampas grass',
      color: 'Pure white',
      quantity: '25 stems',
      height: '70-90cm',
      uvProtection: 'High - faded resistant'
    },
    features: [
      '25 premium pampas grass stems',
      'Pure white color',
      'Extra fluffy and full',
      'Perfect for minimalist and modern designs',
      'Long-lasting, minimal maintenance'
    ],
    dimensions: '70-90cm height',
    capacity: 'Single premium bundle'
  }
]

async function seedDatabase() {
  try {
    console.log('🌱 Starting Firebase database seed...')
    console.log(`📦 Firebase Project: mavi-3ce9d`)

    // Add products
    console.log('\n📝 Adding products...')
    for (const product of mockProducts) {
      await db.collection('products').doc(product.id).set({
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      console.log(`✅ Added product: ${product.name}`)
    }

    console.log('\n📚 Collections initialized:')
    console.log('✅ products - Product catalog (2 items)')
    console.log('✅ orders - Will store customer orders')
    console.log('✅ bookings - Will store rental booking details')
    console.log('✅ customers - Will store customer information')
    console.log('✅ payments - Will store payment records')

    console.log('\n✨ Database seeding complete!')
    console.log('\nYou can now:')
    console.log('1. Browse products at http://localhost:3001')
    console.log('2. Add items to cart')
    console.log('3. Complete checkout and see orders in Firebase')
    console.log('4. Check Google Calendar for booking events')
    console.log('5. Check email inbox for confirmations')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()

