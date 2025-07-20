// app/api/logout/route.ts (for App Router)
// Or pages/api/logout.ts (for Pages Router, export default async function handler(req, res) { ... })

import { NextResponse } from 'next/server';
import { serialize } from 'cookie'; // Utility to serialize cookies

/**
 * Handles POST requests to log out a user by expiring the JWT cookie.
 * @param {Request} request - The incoming Next.js request object.
 * @returns {NextResponse} - The response indicating successful logout.
 */
export async function POST(request: Request) {
  try {
    // Serialize the 'jwt' cookie with an expired maxAge to delete it.
    // Setting maxAge to -1 (or 0) tells the browser to immediately expire the cookie.
    const cookie = serialize('jwt', '', { // Set value to empty string
      httpOnly: true, // Remains HTTP-only
      secure: process.env.NODE_ENV === 'production', // Use secure in production (HTTPS)
      sameSite: 'lax', // SameSite policy
      maxAge: -1, // Expires immediately
      path: '/', // Path for which the cookie is valid
    });

    // Create a successful response
    const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 });
    // Set the 'Set-Cookie' header to instruct the browser to delete the cookie
    response.headers.set('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('Error during logout API route:', error);
    return NextResponse.json({ error: 'Internal server error during logout' }, { status: 500 });
  }
}
