import { db } from './src/db';
import { orderLogs } from './src/db/schema';

async function checkTable() {
    try {
        const count = await db.select().from(orderLogs).limit(1);
        console.log("Table exists, count:", count.length);
    } catch (e: any) {
        console.error("Table check failed:", e.message);
    }
}

checkTable();
