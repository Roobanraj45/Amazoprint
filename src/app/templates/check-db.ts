import { db } from '@/db';
import { designs } from '@/db/schema';
import { count } from 'drizzle-orm';

export async function checkDesigns() {
    const result = await db.select({ value: count() }).from(designs);
    console.log('Total designs in DB:', result[0].value);
    
    if (result[0].value > 0) {
        const all = await db.query.designs.findMany({ limit: 5 });
        console.log('Sample designs:', all.map(d => ({ id: d.id, name: d.name, userId: d.userId, productSlug: d.productSlug })));
    }
}
