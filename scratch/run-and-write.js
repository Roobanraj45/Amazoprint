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
        log("Querying database tables...");
        const result = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        log("Tables in database: " + JSON.stringify(result.map(r => r.table_name)));
    } catch (err) {
        log("Error querying db: " + err.message + "\n" + err.stack);
    }
    
    fs.writeFileSync(path.join(__dirname, 'output.txt'), output);
}

run();
