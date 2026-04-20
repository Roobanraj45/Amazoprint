/**
 * @fileOverview This API route is deprecated.
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: "This endpoint is deprecated." }, { status: 410 });
}
