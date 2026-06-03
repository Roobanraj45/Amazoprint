import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  let log = 'Starting drop_constraints...\n';
  try {
    log += 'Database URL exists: ' + !!process.env.DATABASE_URL + '\n';
    await db.execute(sql`
      ALTER TABLE printers_messaging DROP CONSTRAINT IF EXISTS fk_printers_messaging_sender_printer;
      ALTER TABLE printers_messaging DROP CONSTRAINT IF EXISTS fk_printers_messaging_sender_admin;
      ALTER TABLE printers_messaging DROP CONSTRAINT IF EXISTS fk_printers_messaging_receiver_printer;
      ALTER TABLE printers_messaging DROP CONSTRAINT IF EXISTS fk_printers_messaging_receiver_admin;
    `);
    log += 'Successfully dropped conflicting foreign key constraints!\n';
  } catch (error: any) {
    log += 'Failed to drop constraints: ' + error.message + '\n';
  }
  fs.writeFileSync(path.join(__dirname, 'output.txt'), log);
  process.exit(0);
}

main();
