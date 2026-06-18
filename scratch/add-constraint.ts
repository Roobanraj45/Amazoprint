import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Connecting to database and updating check constraint...');
  try {
    // 1. Drop old constraint if exists
    await sql(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;`);
    console.log('Successfully dropped old check constraint!');

    // 2. Add new constraint with extended status list
    await sql(`
      ALTER TABLE orders ADD CONSTRAINT orders_order_status_check CHECK (
        order_status IN (
          'pending', 'confirmed', 'quality_check', 'processing', 
          'under_verification', 'ready_to_ship', 'shipped', 
          'delivered', 'cancelled', 'refunded'
        )
      );
    `);
    console.log('Successfully added updated check constraint with new statuses!');
  } catch (err) {
    console.error('Failed to update constraint:', err);
  }
}

run();
