const { createMollieClient } = require('@mollie/api-client');
const mollie = createMollieClient({ apiKey: 'test_z3qB2aTfNRPfgbbVtWqg8hRDSfHUUE' });
mollie.customers.get('cst_PLX7M9PKSP').catch(e => {
  console.log('Error Name:', e.name);
  console.log('Message:', e.message);
  console.log('Status:', e.status || (e.response && e.response.status));
  console.log('Title:', e.title);
});
