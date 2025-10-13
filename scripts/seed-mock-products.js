const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const mockProducts = [
  {
    name: 'Partyzelt 5x5m Pagode',
    description: 'Elegantes Pagodenzelt in Pagodenform für Ihre nächste Feier oder Ihren Messeauftritt. Mit stabiler Pulverbeschichtung und Profi PVC-Plane ausgestattet.',
    type: 'Shelter',
    price: 80,
    image: '/white-party-tent-outdoor.jpg',
    available: true,
    dimensions: '5x5m',
    capacity: '50 Personen stehend oder 35 sitzend',
    specifications: {
      'Material': 'PVC-Plane 750 N bzw. 75 kg nach DIN EN ISO 13934-1',
      'UV-Schutz': '50 nach EN 13758-1',
      'Bodenschürze': 'Extra lange Bodenschürze inklusive',
      'Aufbau': 'Schnelles Auf- und Abbauen durch Klick-System'
    },
    features: [
      'Dach und Seitenplanen ca. 750 N bzw. 75 kg nach DIN EN ISO 13934-1',
      'UV-Schutz: 50 nach EN 13758-1',
      'Extra lange Bodenschürze für Schutz vor Regen und Wind',
      'Modulare Seitenwände mit großen Rundbogenfenstern',
      'Bodenrahmen für erhöhte Standfestigkeit'
    ]
  },
  {
    name: 'Profi Sound System',
    description: 'Professionelles Soundsystem mit leistungsstarken Lautsprechern, Mischpult und Mikrofonen. Perfekt für Events bis zu 200 Personen.',
    type: 'Audio Equipment',
    price: 150,
    image: '/professional-sound-system-speakers.jpg',
    available: true,
    dimensions: '2x Lautsprecher + Mischpult',
    capacity: 'Bis 200 Personen',
    specifications: {
      'Leistung': '2x 500W RMS',
      'Frequenzbereich': '45Hz - 20kHz',
      'Anschlüsse': 'XLR, Klinke, Bluetooth',
      'Lieferumfang': '2 Lautsprecher, Mischpult, 2 Mikrofone, Kabel'
    },
    features: [
      'Kristallklarer Sound für Events',
      'Bluetooth-Verbindung möglich',
      'Professionelles 12-Kanal-Mischpult',
      'Inklusive 2 kabellosen Mikrofonen',
      'Einfache Bedienung'
    ]
  },
  {
    name: 'LED Dancefloor 4x4m',
    description: 'Interaktiver LED-Tanzboden der auf Musik reagiert und atemberaubende Lichtshows erzeugt. Der perfekte Eyecatcher für jede Party.',
    type: 'Entertainment',
    price: 300,
    image: null,
    available: false,
    dimensions: '4x4m',
    capacity: '30-40 tanzende Personen',
    specifications: {
      'LED-Panels': '16 Stück (je 1x1m)',
      'Farben': 'RGB - über 16 Millionen Farben',
      'Steuerung': 'DMX oder Musiksteuerung',
      'Belastbarkeit': 'Bis 500kg/m²'
    },
    features: [
      'Reagiert auf Musik und Bewegung',
      'Verschiedene Lichtprogramme vorinstalliert',
      'Einfacher Aufbau durch Stecksystem',
      'Rutschfeste Oberfläche',
      'Professionelle DMX-Steuerung möglich'
    ]
  },
  {
    name: 'Bierzeltgarnituren Set',
    description: 'Klassische Bierzeltgarnituren aus robustem Holz. Perfekt für Feiern im Freien oder in Festzelten.',
    type: 'Furniture',
    price: 25,
    image: null,
    available: true,
    dimensions: '220x80cm Tisch + 2 Bänke',
    capacity: '8-10 Personen pro Set',
    specifications: {
      'Material': 'Fichtenholz mit Stahlgestell',
      'Tischmaße': '220 x 80 x 76 cm',
      'Bankmaße': '220 x 25 x 46 cm',
      'Belastbarkeit': 'Tisch bis 100kg, Bank bis 250kg'
    },
    features: [
      'Wetterfest und robust',
      'Schneller Auf- und Abbau',
      'Platzsparend zusammenklappbar',
      'Ideal für Outdoor-Events',
      'Pflegeleicht'
    ]
  },
  {
    name: 'Event Cover Set Weiß',
    description: 'Elegante weiße Stuhlhussen und Tischdecken für eine festliche Atmosphäre. Verwandelt jeden Raum in einen stilvollen Veranstaltungsort.',
    type: 'Decoration',
    price: 45,
    image: '/white-event-cover-set.jpg',
    available: true,
    dimensions: 'Für 50 Stühle + 10 Tische',
    capacity: '50 Personen',
    specifications: {
      'Material': '100% Polyester, knitterarm',
      'Farbe': 'Reinweiß',
      'Inhalt': '50 Stuhlhussen, 10 Tischdecken',
      'Waschbar': 'Bis 40°C'
    },
    features: [
      'Elegantes, festliches Design',
      'Passend für Standard-Bankettstühle',
      'Tischdecken in verschiedenen Größen',
      'Knitterfrei und pflegeleicht',
      'Mit Satinschleifen-Set'
    ]
  },
  {
    name: 'Hüpfburg Dschungel',
    description: 'Bunte Hüpfburg im Dschungel-Design - der Hit auf jedem Kindergeburtstag! Mit Rutsche und Hindernissen für stundenlangen Spaß.',
    type: 'Entertainment',
    price: 120,
    image: '/jungle-bouncy-castle-inflatable.jpg',
    available: false,
    dimensions: '5x4x3m (LxBxH)',
    capacity: 'Bis 6 Kinder gleichzeitig',
    specifications: {
      'Material': 'PVC-beschichtetes Nylon',
      'Altersgruppe': '3-12 Jahre',
      'Max. Gewicht': '150kg gesamt',
      'Gebläse': 'Elektrisches Gebläse inklusive'
    },
    features: [
      'Buntes Dschungel-Design mit Tieren',
      'Integrierte Rutsche',
      'Hindernisparcours',
      'Schneller Auf- und Abbau (ca. 10 Min)',
      'TÜV-geprüft und sicher'
    ]
  },
  {
    name: 'Cocktailbar Mobil',
    description: 'Mobile Cocktailbar aus hochwertigem Holz mit LED-Beleuchtung. Perfekt für Empfänge, Firmenevents und private Feiern.',
    type: 'Furniture',
    price: 95,
    image: null,
    available: true,
    dimensions: '2m Länge',
    capacity: 'Bedienung für 100+ Gäste',
    specifications: {
      'Material': 'Massivholz mit Edelstahl-Elementen',
      'Maße': '200 x 60 x 110 cm',
      'Beleuchtung': 'RGB-LED-Leiste',
      'Ausstattung': 'Kühlschrank-Unterschrank'
    },
    features: [
      'Elegantes Design mit LED-Beleuchtung',
      'Integrierter Kühlschrank',
      'Große Arbeitsfläche',
      'Auf Rollen für einfachen Transport',
      'Inkl. Barzubehör (Shaker, Gläser, etc.)'
    ]
  },
  {
    name: 'Foto-Booth Deluxe',
    description: 'Professionelle Fotobox mit Sofortdruck und digitaler Galerie. Unvergessliche Erinnerungen für Ihre Gäste mit lustigen Props und Filtern.',
    type: 'Entertainment',
    price: 180,
    image: null,
    available: true,
    dimensions: '2x2m Stellfläche',
    capacity: 'Unbegrenzte Fotos',
    specifications: {
      'Kamera': 'Profi-DSLR mit Studioblitz',
      'Drucker': 'Sublimationsdrucker für Sofortdrucke',
      'Props': 'Über 50 verschiedene Accessoires',
      'Software': 'Mit Filtern und Rahmen'
    },
    features: [
      'Sofortdruck der Fotos (10x15cm)',
      'Digitale Galerie-Funktion',
      'Über 50 lustige Props inklusive',
      'Individuelle Rahmen-Gestaltung möglich',
      'GIF und Boomerang-Funktion'
    ]
  }
]

async function seedProducts() {
  console.log('Starting to seed mock products...')

  try {
    // First, let's check if we can connect to Supabase
    const { data: existingProducts, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    if (fetchError) {
      console.error('Error connecting to Supabase:', fetchError)
      return
    }

    console.log('Connected to Supabase successfully!')

    // Insert products one by one
    for (const product of mockProducts) {
      console.log(`\nAdding product: ${product.name}`)

      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        console.error(`Error adding ${product.name}:`, error.message)
      } else {
        console.log(`✓ Successfully added ${product.name} (${product.available ? 'Available' : 'Booked'})`)
      }
    }

    // Get final count
    const { data: allProducts, error: countError } = await supabase
      .from('products')
      .select('id')

    if (!countError) {
      console.log(`\n✓ Database now has ${allProducts.length} products total`)
    }

    console.log('\n✓ Seeding completed!')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

seedProducts()
