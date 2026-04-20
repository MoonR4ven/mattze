import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { google } from 'googleapis';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function runDiagnostics() {
  console.log('--- 1) Firestore Audit ---');
  try {
    const saVar = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!saVar) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing');
    
    // Check if it's a file path or direct JSON
    let serviceAccount;
    if (saVar.trim().startsWith('{')) {
        serviceAccount = JSON.parse(saVar);
    } else {
        serviceAccount = JSON.parse(fs.readFileSync(saVar, 'utf8'));
    }

    initializeApp({
      credential: cert(serviceAccount)
    });
    const db = getFirestore();

    // Summarize orders
    const ordersSnapshot = await db.collection('orders').get();
    const billbeeStatusCounts = {};
    let billbeeErrorCount = 0;
    const failedOrders = [];

    ordersSnapshot.forEach(doc => {
      const data = doc.data();
      const status = data.billbeeStatus || 'undefined';
      billbeeStatusCounts[status] = (billbeeStatusCounts[status] || 0) + 1;
      
      if (data.billbeeError) {
        billbeeErrorCount++;
        failedOrders.push({
          id: doc.id,
          paymentIntentId: data.paymentIntentId,
          billbeeError: data.billbeeError,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
        });
      }
    });

    console.log('Orders Summary by billbeeStatus:', billbeeStatusCounts);
    console.log('Total orders with billbeeError:', billbeeErrorCount);
    console.log('Last 5 failed orders (if any):');
    failedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).forEach(o => console.log(o));

    // Summarize bookings
    const bookingsSnapshot = await db.collection('bookings').get();
    const calendarStatusCounts = {};
    const failedBookings = [];

    bookingsSnapshot.forEach(doc => {
      const data = doc.data();
      const status = data.calendarStatus || 'undefined';
      calendarStatusCounts[status] = (calendarStatusCounts[status] || 0) + 1;
      
      if (data.calendarError) {
        failedBookings.push({
          id: doc.id,
          productName: data.productName,
          calendarError: data.calendarError,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
        });
      }
    });

    console.log('Bookings Summary by calendarStatus:', calendarStatusCounts);
    console.log('Last 5 failed bookings (if any):');
    failedBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).forEach(b => console.log(b));

  } catch (error) {
    console.error('Firestore Audit Error:', error.message);
  }

  console.log('\n--- 2) Billbee API Connectivity ---');
  try {
    const apiKey = process.env.BILLBEE_API_KEY;
    const username = process.env.BILLBEE_USERNAME;
    const password = process.env.BILLBEE_PASSWORD;
    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    const response = await axios.get('https://app.billbee.io/api/v1/products?page=1&pageSize=1', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'X-Billbee-Api-Key': apiKey
      }
    });
    console.log('Billbee Status:', response.status);
    console.log('Response has Data:', !!response.data);
  } catch (error) {
    console.error('Billbee API Error:', error.response ? `${error.response.status} - ${JSON.stringify(error.response.data)}` : error.message);
  }

  console.log('\n--- 3) Google Calendar Connectivity ---');
  try {
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      key,
      ['https://www.googleapis.com/auth/calendar.readonly']
    );
    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      maxResults: 1
    });
    console.log('Google Calendar Connectivity: Success');
    console.log('Items found:', response.data.items?.length || 0);
  } catch (error) {
    console.error('Google Calendar Error:', error.message);
  }
}

runDiagnostics();
