const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('Connecting to Neon DB...');
  
  // 1. Create custom_addons table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS custom_addons (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL UNIQUE,
      slug VARCHAR(150) NOT NULL UNIQUE,
      description TEXT,
      price NUMERIC(10, 2) DEFAULT '0.00',
      pricing_type VARCHAR(20) DEFAULT 'per_unit',
      image_url TEXT,
      is_active BOOLEAN DEFAULT true,
      allowed_sub_product_ids INTEGER[],
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  console.log('Table custom_addons ensured.');

  // 2. Add columns to sub_products if not exist
  await sql`
    ALTER TABLE sub_products 
    ADD COLUMN IF NOT EXISTS allowed_custom_addons INTEGER[],
    ADD COLUMN IF NOT EXISTS custom_addon_prices JSONB DEFAULT '{}'::jsonb;
  `;
  console.log('Columns allowed_custom_addons and custom_addon_prices ensured on sub_products.');

  // Check columns
  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'sub_products' AND column_name IN ('allowed_custom_addons', 'custom_addon_prices');
  `;
  console.log('Verified sub_products columns:', cols);

  const addonCount = await sql`SELECT count(*) FROM custom_addons;`;
  console.log('Verified custom_addons count:', addonCount);
}

main().then(() => {
  console.log('Database migration completed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
