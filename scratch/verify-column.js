const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function check() {
    const res = await sql(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sub_products' AND column_name = 'price_slabs'`);
    console.log("Column verification result:", res);
}

check();
