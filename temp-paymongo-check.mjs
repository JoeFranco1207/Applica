import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });
const key = process.env.PAYMONGO_SECRET_KEY;
if (!key) {
  console.error('no key');
  process.exit(1);
}

const base = 'https://api.paymongo.com/v1';
const tests = [
  {
    name: 'jsonapi',
    payload: {
      data: {
        attributes: {
          amount: 45000,
          currency: 'PHP',
          description: 'Test JSONAPI',
          redirect: {
            success: 'https://example.com/success',
            failed: 'https://example.com/failed',
          },
          billing: {
            name: 'Test',
            email: 'test@example.com',
          },
          metadata: {
            userId: '123',
            plan: 'halfYearly',
          },
        },
      },
    },
  },
  {
    name: 'top',
    payload: {
      amount: 45000,
      currency: 'PHP',
      description: 'Test top level',
      redirect: {
        success: 'https://example.com/success',
        failed: 'https://example.com/failed',
      },
      billing: {
        name: 'Test',
        email: 'test@example.com',
      },
      metadata: {
        userId: '123',
        plan: 'halfYearly',
      },
    },
  },
];

(async () => {
  for (const test of tests) {
    try {
      const r = await axios.post(`${base}/payment_links`, test.payload, {
        auth: {
          username: key,
          password: '',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(test.name, 'success', r.status, JSON.stringify(r.data?.data?.attributes?.status));
    } catch (e) {
      console.log(test.name, 'error', e.response?.status, JSON.stringify(e.response?.data));
    }
  }
})();
