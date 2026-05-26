const axios = require('axios');
require('dotenv').config();
const key = process.env.PAYMONGO_SECRET_KEY;
const url = process.env.PAYMONGO_BASE_URL || 'https://api.paymongo.com/v1';
const tests = ['gcash', 'maya', 'paymaya', 'qris', 'qr', 'card'];
const payload = (type) => ({
  data: {
    attributes: {
      amount: 45000,
      currency: 'PHP',
      type,
      source_type: type,
      billing: { name: 'Test User', email: 'test@applica.com' },
      redirect: { success: 'http://localhost:5173/ai-premium', failed: 'http://localhost:5173/ai-premium' },
      metadata: { userId: 'test', plan: 'halfYearly', paymentMethod: type },
      ...(type === 'card' ? { card: { number: '4242424242424242', exp_month: '12', exp_year: '2028', cvc: '123', name: 'Test User' } } : {}),
    }
  }
});
(async () => {
  for (const type of tests) {
    try {
      const res = await axios.post(`${url}/sources`, payload(type), {
        auth: { username: key, password: '' },
        headers: { 'Content-Type': 'application/json' },
      });
      console.log(type, 'ok', res.status);
      console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.log(type, 'err', err.response?.status, JSON.stringify(err.response?.data, null, 2));
    }
  }
})();
