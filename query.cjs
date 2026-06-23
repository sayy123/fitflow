const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
async function run() {
  await client.connect();
  const res = await client.query('SELECT email, role FROM studio_members LIMIT 10');
  console.log(res.rows);
  await client.end();
}
run();
