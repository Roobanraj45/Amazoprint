const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;
console.log("Database URL present:", !!databaseUrl);

const sql = neon(databaseUrl);

async function check() {
    try {
        const result = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log("Tables in database:", result.map(r => r.table_name));
    } catch (err) {
        console.error("Error querying db:", err);
    }
}

check();
