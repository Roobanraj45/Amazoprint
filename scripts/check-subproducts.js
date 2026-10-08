const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const sps = await sql`SELECT id, name, max_pages, back_side_cost FROM sub_products ORDER BY id ASC LIMIT 5;`;
  console.log('SUB_PRODUCTS_DATA:');
  console.log(JSON.stringify(sps, null, 2));
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
