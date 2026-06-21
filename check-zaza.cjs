const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.vxehpulskwpzjnizhmiw:BoisWellenne22@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM studio_members WHERE email = 'zaza@gmail.com' OR user_id = 'ecf68c32-dd93-4edf-9fcc-06c9606f01eb'");
    console.log(res.rows);
  } finally {
    client.release();
    pool.end();
  }
}
main();
