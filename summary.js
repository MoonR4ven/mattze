require('dotenv').config();
const admin = require('firebase-admin');

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  privateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function summarize() {
  try {
    // Orders
    const ordersSnapshot = await db.collection('orders').get();
    const orders = [];
    ordersSnapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));

    const ordersByStatus = {};
    let billbeeErrorCount = 0;
    orders.forEach(o => {
      const status = o.billbeeStatus || 'unknown';
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
      if (o.billbeeError) billbeeErrorCount++;
    });

    const failedOrders = orders
      .filter(o => o.billbeeStatus === 'failed')
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 5)
      .map(o => ({
        id: o.id,
        paymentIntentId: o.paymentIntentId,
        billbeeError: o.billbeeError,
        createdAt: o.createdAt ? new Date(o.createdAt.seconds * 1000).toISOString() : null
      }));

    // Bookings
    const bookingsSnapshot = await db.collection('bookings').get();
    const bookings = [];
    bookingsSnapshot.forEach(doc => bookings.push({ id: doc.id, ...doc.data() }));

    const bookingsByStatus = {};
    bookings.forEach(b => {
      const status = b.calendarStatus || 'unknown';
      bookingsByStatus[status] = (bookingsByStatus[status] || 0) + 1;
    });

    const failedBookings = bookings
      .filter(b => ['failed', 'sync_failed'].includes(b.calendarStatus))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 5)
      .map(b => ({
        id: b.id,
        productName: b.productName,
        calendarError: b.calendarError,
        createdAt: b.createdAt ? new Date(b.createdAt.seconds * 1000).toISOString() : null
      }));

    console.log(JSON.stringify({
      ordersByStatus,
      billbeeErrorCount,
      latestFailedOrders: failedOrders,
      bookingsByStatus,
      latestFailedBookings: failedBookings
    }, null, 2));

  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

summarize();
