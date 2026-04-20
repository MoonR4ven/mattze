require('dotenv').config();
const https = require('https');

const username = process.env.BILLBEE_USERNAME;
const password = process.env.BILLBEE_PASSWORD;
const apiKey = process.env.BILLBEE_API_KEY;

const auth = Buffer.from(username + ':' + password).toString('base64');

const options = {
  hostname: 'app.billbee.io',
  path: '/api/v1/products?page=1&pageSize=1',
  method: 'GET',
  headers: {
    'Authorization': 'Basic ' + auth,
    'X-Billbee-Api-Key': apiKey
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    let hasData = false;
    try {
      const json = JSON.parse(data);
      hasData = !!(json && json.Data);
    } catch (e) {}
    console.log(JSON.stringify({
      statusCode: res.statusCode,
      hasData: hasData
    }));
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
