const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  try {
    const verifications = await sql`
      SELECT id, order_id, title, status, freelancer_id, created_at, client_notes
      FROM design_verifications
      ORDER BY id DESC
      LIMIT 10
    `;
    
    const orders = await sql`
      SELECT id, user_id, order_status
      FROM orders
      ORDER BY id DESC
      LIMIT 10
    `;

    const result = { verifications, orders };
    fs.writeFileSync(path.join(__dirname, 'db_results.json'), JSON.stringify(result, null, 2));
    console.log("Results written to db_results.json successfully");
  } catch (e) {
    console.error("Error in query:", e);
  }
}

main();
