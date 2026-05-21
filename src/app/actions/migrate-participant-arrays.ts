'use server';

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

/**
 * One-time migration action.
 * Backfills `design_ids` with [design_id] and `template_ids` with [template_id]
 * for all contest_participants rows that have a non-null scalar value but an
 * empty / null array column.
 *
 * Only callable by admins. Safe to call multiple times (idempotent).
 */
export async function migrateParticipantArrays() {
    const session = await getSession();
    const adminRoles = ['admin', 'super_admin', 'company_admin'];
    if (!session?.sub || !adminRoles.includes(session.role)) {
        throw new Error('Not authorized. Admin role required.');
    }

    // Backfill design_ids from design_id where design_id is set but design_ids is null/empty
    await db.execute(sql`
        UPDATE contest_participants
        SET design_ids = ARRAY[design_id]
        WHERE design_id IS NOT NULL
          AND (design_ids IS NULL OR array_length(design_ids, 1) IS NULL)
    `);

    // Backfill template_ids from template_id where template_id is set but template_ids is null/empty
    await db.execute(sql`
        UPDATE contest_participants
        SET template_ids = ARRAY[template_id]
        WHERE template_id IS NOT NULL
          AND (template_ids IS NULL OR array_length(template_ids, 1) IS NULL)
    `);

    return { success: true, message: 'Migration complete. design_ids and template_ids backfilled.' };
}
