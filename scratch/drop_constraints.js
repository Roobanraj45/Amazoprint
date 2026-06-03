const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const logFile = path.join(__dirname, 'output.txt');
let log = 'Starting drop_constraints.js...\n';

async function main() {
  log += 'Database URL exists: ' + !!process.env.DATABASE_URL + '\n';
  if (!process.env.DATABASE_URL) {
    fs.writeFileSync(logFile, log + 'Error: DATABASE_URL is not set.\n');
    process.exit(1);
  }

  // Neon database uses neon:// or postgresql://
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    log += 'Connected to database.\n';
    
    await client.query(`
      ALTER TABLE printers_messaging DROP CONSTRAINT IF EXISTS fk_printers_messaging_sender_printer;
      ALTER TABLE printers_messaging DROP CONSTRAINT IF EXISTS fk_printers_messaging_sender_admin;
      ALTER TABLE printers_messaging DROP CONSTRAINT IF EXISTS fk_printers_messaging_receiver_printer;
      ALTER TABLE printers_messaging DROP CONSTRAINT IF EXISTS fk_printers_messaging_receiver_admin;
    `);
    
    log += 'Successfully dropped conflicting foreign key constraints!\n';
  } catch (error) {
    log += 'Failed to execute query: ' + error.message + '\n';
  } finally {
    await client.end();
  }

  console.error(log);
  process.exit(1);
}

main();
