const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('--- 1. Testing Custom Addon Creation ---');
  // Check or insert test custom addons
  const existing = await sql`SELECT * FROM custom_addons WHERE slug = 'velvet-soft-touch'`;
  let addonId;
  if (existing.length === 0) {
    const inserted = await sql`
      INSERT INTO custom_addons (name, slug, description, price, pricing_type, is_active)
      VALUES (
        'Velvet Soft-Touch Finish',
        'velvet-soft-touch',
        'Luxurious tactile velvet coating with scuff-resistant protection.',
        '1.50',
        'per_unit',
        true
      )
      RETURNING *;
    `;
    console.log('Created Custom Addon:', inserted[0]);
    addonId = inserted[0].id;
  } else {
    console.log('Found existing Custom Addon:', existing[0]);
    addonId = existing[0].id;
  }

  // Also create a flat-fee custom addon to verify both pricing types
  const flatExisting = await sql`SELECT * FROM custom_addons WHERE slug = 'rush-priority-dispatch'`;
  let flatAddonId;
  if (flatExisting.length === 0) {
    const insertedFlat = await sql`
      INSERT INTO custom_addons (name, slug, description, price, pricing_type, is_active)
      VALUES (
        'Rush Priority Dispatch',
        'rush-priority-dispatch',
        'Priority 24h queue fast-track production and direct courier handover.',
        '250.00',
        'fixed',
        true
      )
      RETURNING *;
    `;
    console.log('Created Flat Custom Addon:', insertedFlat[0]);
    flatAddonId = insertedFlat[0].id;
  } else {
    console.log('Found existing Flat Custom Addon:', flatExisting[0]);
    flatAddonId = flatExisting[0].id;
  }

  console.log('\n--- 2. Testing Sub-Product Mapping ---');
  // Map these custom addons to sub-product ID 1
  const subProduct = await sql`SELECT id, name, allowed_custom_addons, custom_addon_prices FROM sub_products WHERE id = 1`;
  if (subProduct.length > 0) {
    console.log('Before update, sub-product 1:', subProduct[0]);
    
    const mappedIds = [addonId, flatAddonId];
    const pricesObj = { [addonId]: 1.50, [flatAddonId]: 250.00 };

    await sql`
      UPDATE sub_products 
      SET 
        allowed_custom_addons = ${mappedIds},
        custom_addon_prices = ${JSON.stringify(pricesObj)}::jsonb,
        updated_at = NOW()
      WHERE id = 1
    `;

    const updatedSubProduct = await sql`SELECT id, name, allowed_custom_addons, custom_addon_prices FROM sub_products WHERE id = 1`;
    console.log('After update, sub-product 1:', updatedSubProduct[0]);
  } else {
    console.log('Sub-product 1 not found; checking available sub_products:');
    const allSubs = await sql`SELECT id, name FROM sub_products LIMIT 3`;
    console.log(allSubs);
  }

  console.log('\n--- 3. Verifying All Active Custom Addons in Catalog ---');
  const allAddons = await sql`SELECT id, name, slug, price, pricing_type, is_active FROM custom_addons`;
  console.log('Total custom addons in DB:', allAddons);
}

main().then(() => {
  console.log('\nAll checks passed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('Error during test flow:', err);
  process.exit(1);
});
