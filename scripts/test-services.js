const { emailService } = require('./lib/email')
const { GoogleCalendarAPI } = require('./lib/google-calendar')

async function testServices() {
  console.log('🧪 Testing Email and Calendar Services...\n')

  // Test Email
  console.log('📧 Testing Email Service...')
  const emailResult = await emailService.sendBookingConfirmation({
    customerName: 'David Test',
    customerEmail: 'alex.david.razvan@gmail.com',
    productName: 'Dried Lagurus Flowers',
    date: '2025-02-15',
    startTime: '10:00',
    endTime: '11:00',
    numberOfDays: 1,
    price: 25.00,
    totalPrice: 25.00,
    orderId: 'test-order-001',
    paymentIntentId: 'pi_test_001'
  })
  console.log('Email Result:', emailResult, '\n')

  // Test Calendar
  console.log('📅 Testing Google Calendar Service...')
  try {
    const calendarAPI = new GoogleCalendarAPI()
    const event = calendarAPI.createBookingEvent({
      productName: 'Dried Lagurus Flowers',
      customerName: 'David Test',
      customerEmail: 'alex.david.razvan@gmail.com',
      date: '2025-02-15',
      startTime: '10:00',
      endTime: '11:00',
      price: 25.00,
      orderId: 'test-order-001'
    })
    console.log('Event Created:', JSON.stringify(event, null, 2), '\n')

    const calendarResult = await calendarAPI.createEvent('mavi.ostercappeln@gmail.com', event)
    console.log('Calendar Result:', calendarResult)
  } catch (error) {
    console.error('Calendar Error:', error)
  }
}

testServices().catch(console.error)
