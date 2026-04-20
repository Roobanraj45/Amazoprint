import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.enum(['user', 'freelancer']),
  // Freelancer fields
  skills: z.string().optional(),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    
    const { name, email, password, role, phone, skills, portfolioUrl, bio } = parsed.data;

    const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const newUser = {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      phone,
      skills: skills && skills.trim() ? skills.split(',').map(s => s.trim()).filter(s => s.length > 0) : undefined,
      portfolioUrl: portfolioUrl || undefined,
      bio
    };

    await db.insert(users).values(newUser);

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}
