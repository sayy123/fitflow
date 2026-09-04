import { mollie } from './src/lib/mollie';

async function test() {
  console.log("Checking Mollie methods...");
  try {
    const methods = await mollie.methods.list({ sequenceType: 'first', amount: { currency: 'EUR', value: '0.00' } });
    console.log("Methods accepting 0.00:", methods.map(m => m.id).join(', '));
  } catch(e) {
    console.error(e);
  }
}
test();
