const { createMollieClient } = require('@mollie/api-client');
const mollie = createMollieClient({ apiKey: 'test_dummy_key' });

async function run() {
  try {
    const payment = await mollie.payments.create({
      amount: { currency: 'EUR', value: '19.00' },
      description: 'Test',
      redirectUrl: 'http://localhost',
      sequenceType: 'first',
      customerId: 'cst_123456'
    });
    console.log(payment);
  } catch (e) {
    console.error(e.message);
  }
}
run();
