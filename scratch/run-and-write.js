const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;
let output = '';

function log(msg) {
    console.log(msg);
    output += msg + '\n';
}

async function run() {
    log("Database URL present: " + (!!databaseUrl));
    if (!databaseUrl) {
        fs.writeFileSync(path.join(__dirname, 'output.txt'), output);
        return;
    }
    
    try {
        const sql = neon(databaseUrl);
        log("Adding price_slabs column to sub_products...");
        await sql(`
            ALTER TABLE sub_products 
            ADD COLUMN IF NOT EXISTS price_slabs JSONB DEFAULT '[]'::jsonb;
        `);
        log("Checking column existence...");
        const result = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sub_products' AND column_name = 'price_slabs';
        `;
        log("Column details: " + JSON.stringify(result));
    } catch (err) {
        log("Error: " + err.message + "\n" + err.stack);
    }
    
    fs.writeFileSync(path.join(__dirname, 'output.txt'), output);
}

run();
