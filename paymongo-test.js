import axios from 'axios';

const payload = {
  amount: 45000,
  currency: 'PHP',
  description: 'Applica AI Premium (halfYearly)',
  redirect: {
    success: 'http://localhost:5173/ai-premium/success',
    failed: 'http://localhost:5173/ai-premium/failed',
  },
  billing: {
    name: 'Test User',
    email: 'test@example.com',
  },
  metadata: {
    userId: '123',
    plan: 'halfYearly',
  },
};

axios
  .post('https://api.paymongo.com/v1/payment_links', payload, {
    auth: {
      username: 'sk_test_Rq1Ays4iEusfXU8diWcdLCjN',
      password: '',
    },
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 20000,
  })
  .then((r) => {
    console.log('status', r.status);
    console.log(JSON.stringify(r.data, null, 2));
  })
  .catch((e) => {
    console.error('error status', e.response?.status);
    console.error('error body', JSON.stringify(e.response?.data, null, 2));
    console.error('error message', e.message);
  });
