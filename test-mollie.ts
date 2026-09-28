import { mollie } from './src/lib/mollie';

async function test() {
  console.log("Checking Mollie methods...");
  try {
    const methods: any = await mollie.methods.list({ sequenceType: 'first' as any, amount: { currency: 'EUR', value: '0.00' } });
    console.log("Methods accepting 0.00:", methods.map((m: any) => m.id).join(', '));
  } catch(e) {
    console.error(e);
  }
}
test();
