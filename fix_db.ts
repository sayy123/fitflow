import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL
});
async function main() {
  try {
    await client.connect();
    await client.query(`ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_mollie_account_id_key;`);
    console.log('Unique constraint dropped successfully');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
    process.exit(0);
  }
}
main();
