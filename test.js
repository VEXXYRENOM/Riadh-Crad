const fetch = require('node-fetch');

async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/loyalty/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId: '00000000-0000-0000-0000-000000000000',
        customerId: '00000000-0000-0000-0000-000000000000',
        amountTnd: 10
      })
    });
    const text = await res.text();
    console.log('STATUS:', res.status);
    console.log('RESPONSE:', text);
  } catch (err) {
    console.error(err);
  }
}
run();
