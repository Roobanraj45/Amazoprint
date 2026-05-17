import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  keepLoggedIn: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password, keepLoggedIn } = parsed.data;

    let user: { id: string; role: string; name: string; passwordHash: string } | null = null;

    // 1. Check primary users table (customers, freelancers)
    const dbUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (dbUser) {
      user = { id: dbUser.id, role: dbUser.role, name: dbUser.name, passwordHash: dbUser.passwordHash };
    } else {
      // 2. Check admins table
      const { admins } = await import('@/db/schema');
      const dbAdmin = await db.query.admins.findFirst({
        where: eq(admins.email, email.toLowerCase()),
      });

      if (dbAdmin) {
        user = { id: dbAdmin.id, role: dbAdmin.role, name: dbAdmin.name, passwordHash: dbAdmin.passwordHash };
      } else {
        // 3. Check print press users
        const { printPressUsers } = await import('@/db/schema');
        const dbPrinter = await db.query.printPressUsers.findFirst({
          where: eq(printPressUsers.email, email.toLowerCase()),
        });

        if (dbPrinter) {
          user = { id: dbPrinter.id, role: 'printer', name: dbPrinter.fullName, passwordHash: dbPrinter.passwordHash };
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordsMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await createSession(user.id, user.role, user.name, !!keepLoggedIn);

    return NextResponse.json({ success: true, role: user.role }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}
