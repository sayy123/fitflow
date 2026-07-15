import { createMollieClient } from '@mollie/api-client';

if (!process.env.MOLLIE_API_KEY && process.env.NODE_ENV !== "production") {
  console.warn("MOLLIE_API_KEY is not defined");
}

export const mollie = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY || "test_dummy_key",
});
