import { db } from './src/db';
import { designs } from './src/db/schema';
import { desc } from 'drizzle-orm';

async function check() {
    const lastDesigns = await db.query.designs.findMany({
        limit: 5,
        orderBy: [desc(designs.createdAt)]
    });

    lastDesigns.forEach(d => {
        console.log(`ID: ${d.id}, Name: ${d.name}`);
        console.log(`Elements Type: ${typeof d.elements}`);
        console.log(`Elements Preview: ${JSON.stringify(d.elements).substring(0, 100)}...`);
        console.log(`Background Type: ${typeof d.background}`);
        console.log('---');
    });
}

check();
