const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("DATABASE_URL is not defined in the environment.");
    process.exit(1);
}

const sql = neon(databaseUrl);

async function run() {
    try {
        console.log("Adding price_slabs column to sub_products table...");
        await sql(`
            ALTER TABLE sub_products 
            ADD COLUMN IF NOT EXISTS price_slabs JSONB DEFAULT '[]'::jsonb;
        `);
        console.log("Successfully added price_slabs column to sub_products!");
    } catch (err) {
        console.error("Error executing query:", err);
    }
}

run();
