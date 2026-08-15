import { createMollieClient } from '@mollie/api-client';

async function main() {
  const mollie = createMollieClient({ accessToken: 'access_S2vFvtsCx9ByEJTHJ6TaaCqqT7xyW2' });
  try {
    const methods = await mollie.methods.list();
    console.log('Methods:', methods.length);
  } catch(e) {
    console.error('Error fetching methods:', e.message);
  }
}
main().catch(console.error);
