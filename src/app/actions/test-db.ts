import { db } from '@/db';
import { contestParticipants, contests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const logPath = path.join(process.cwd(), 'db-log.txt');
    try {
        const contest = await db.query.contests.findFirst({
            where: eq(contests.id, 7),
            with: {
                participants: {
                    with: {
                        submission: true,
                        template: true,
                    }
                }
            }
        });
        fs.writeFileSync(logPath, JSON.stringify(contest, null, 2), 'utf8');
    } catch (e: any) {
        fs.writeFileSync(logPath, "ERROR: " + e.stack, 'utf8');
    }
}

main().then(() => process.exit(0)).catch((err) => {
    process.exit(1);
});
