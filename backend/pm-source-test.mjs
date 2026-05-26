import axios from 'axios';
import 'dotenv/config';
const key = process.env.PAYMONGO_SECRET_KEY;
const url = process.env.PAYMONGO_BASE_URL || 'https://api.paymongo.com/v1';
const type = 'gcash';
const payload = {
  data: {
    attributes: {
      amount: 45000,
      currency: 'PHP',
      type,
      source_type: type,
      billing: { name: 'Test User', email: 'test@applica.com' },
      redirect: { success: 'http://localhost:5173/ai-premium', failed: 'http://localhost:5173/ai-premium' },
      metadata: { userId: 'test', plan: 'halfYearly', paymentMethod: type },
    },
  },
};
try {
  const res = await axios.post(`${url}/sources`, payload, {
    auth: { username: key, password: '' },
    headers: { 'Content-Type': 'application/json' },
  });
  console.log(JSON.stringify(res.data, null, 2));
} catch (err) {
  console.error('ERR', err.response?.status, JSON.stringify(err.response?.data, null, 2));
}
