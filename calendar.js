require('dotenv').config();
const { google } = require('googleapis');

const serviceAccount = {
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

const calendarId = process.env.GOOGLE_CALENDAR_ID;

const auth = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  ['https://www.googleapis.com/auth/calendar.readonly']
);

const calendar = google.calendar({ version: 'v3', auth });

async function checkCalendar() {
  try {
    const res = await calendar.events.list({
      calendarId: calendarId,
      maxResults: 1,
    });
    console.log(JSON.stringify({ success: true }));
  } catch (error) {
    console.log(JSON.stringify({ success: false, errorMessage: error.message }));
  }
}

checkCalendar();
