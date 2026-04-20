import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error('JWT_SECRET is not set in environment variables');
}
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any, expiresIn: string) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    // This can happen if the token is expired or invalid
    return null;
  }
}

export async function createSession(userId: string, userRole: string, userName: string, keepLoggedIn: boolean) {
  const expiresIn = keepLoggedIn ? '30d' : '1d';
  const expires = new Date(Date.now() + (keepLoggedIn ? 30 : 1) * 24 * 60 * 60 * 1000);
  const session = await encrypt({ sub: userId, role: userRole, name: userName }, expiresIn);

  // Store the session in a secure, HTTP-only cookie
  cookies().set('session', session, { 
    expires, 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession() {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  return await decrypt(sessionCookie);
}

export async function deleteSession() {
  cookies().set('session', '', { expires: new Date(0), path: '/' });
}
