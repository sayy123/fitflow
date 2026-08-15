const { parse } = require('url');
const dbUrl = "postgresql://postgres.vxehpulskwpzjnizhmiw:BoisWellenne22@aws-0-eu-west-3.pooler.supabase.com:6543/postgres&connection_limit=1";
console.log(parse(dbUrl));
