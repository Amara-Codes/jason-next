// app/api/login/route.ts (for App Router)
// Or pages/api/login.ts (for Pages Router, export default async function handler(req, res) { ... })

import { NextResponse } from 'next/server';
import { serialize } from 'cookie'; // Utility to serialize cookies

// Ensure your Strapi API URL is correctly set in your .env.local
const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

export async function POST(request: Request) {
  // Parse the request body to get email and password


  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  try {
    // 1. Send credentials to Strapi's local authentication endpoint
    const strapiResponse = await fetch(`${STRAPI_API_URL}/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier: email, password }),
    });



    const strapiData = await strapiResponse.json();

    if (!strapiResponse.ok) {
      // If Strapi authentication fails, return the error from Strapi
      console.error('Strapi authentication failed:', strapiData);
      return NextResponse.json(
        { error: strapiData.error?.message || 'Authentication failed' },
        { status: strapiResponse.status }
      );
    }

    // 2. Extract the JWT from Strapi's response
    const jwt = strapiData.jwt;

    if (!jwt) {
      return NextResponse.json({ error: 'JWT not received from Strapi' }, { status: 500 });
    }

    // 3. Set the HTTP-only cookie
    // The `serialize` function helps create the correct cookie string.
    const cookie = serialize('jwt', jwt, {
      httpOnly: true, // Makes the cookie inaccessible to client-side JavaScript
      secure: process.env.NODE_ENV === 'production', // Use secure in production (HTTPS)
      sameSite: 'lax', // Protects against CSRF attacks
      maxAge: 60 * 60 * 24 * 7, // 1 week (adjust as needed)
      path: '/', // The cookie is valid for all paths
    });

    // 4. Return a success response to the client, setting the cookie in the headers
    const response = NextResponse.json({ message: 'Login successful' }, { status: 200 });
    response.headers.set('Set-Cookie', cookie); // Set the cookie header

    return response;

  } catch (error) {
    console.error('Error during login API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
