/* eslint-disable @typescript-eslint/no-require-imports */
const { createMollieClient } = require('@mollie/api-client');
const mollie = createMollieClient({ apiKey: "test_dummy_key" });
mollie.payments.create({
  amount: { currency: "EUR", value: "19.00" },
  description: "Test",
  redirectUrl: "http://localhost:3000",
  sequenceType: "first",
}).then(res => console.log("Success", res))
  .catch(err => console.error("Error:", err.message));
