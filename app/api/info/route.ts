// File: app/api/auth/info/route.tsx

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // Import 'cookies' da 'next/headers' per l'App Router

// Assicurati che l'URL dell'API di Strapi sia configurato correttamente nel tuo file .env.local
const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

export async function GET(request: Request) {
  // 1. Ottieni l'oggetto cookies dalla richiesta in arrivo
  const cookieStore = cookies();
  const token = (await cookieStore).get('jwt'); // Estrai il cookie chiamato 'jwt'

  // 2. Controlla se il token JWT esiste
  if (!token) {
    // Se non c'è il token, l'utente non è autenticato. Restituisci un errore 401.
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // 3. Fai una richiesta all'endpoint /api/users/me di Strapi
    // Questo endpoint speciale di Strapi restituisce i dati dell'utente associato al JWT.
    const strapiResponse = await fetch(`${STRAPI_API_URL}/users/me?populate=*`, {
      method: 'GET',
      headers: {
        // Includi il JWT nell'header di autorizzazione come Bearer token
        'Authorization': `Bearer ${token.value}`,
      },
      // È buona norma non memorizzare nella cache le richieste di dati utente
      cache: 'no-store', 
    });

    const strapiData = await strapiResponse.json();

    if (!strapiResponse.ok) {
      // Se Strapi restituisce un errore, inoltralo al client
      console.error('Errore da Strapi nel recuperare le info utente:', strapiData);
      return NextResponse.json(
        { error: strapiData.error?.message || 'Failed to fetch user info' },
        { status: strapiResponse.status }
      );
    }

    // 4. Se la richiesta ha successo, restituisci i dati dell'utente al client.
    // strapiData conterrà un oggetto con id, username, email, ecc.
    return NextResponse.json(strapiData, { status: 200 });

  } catch (error) {
    console.error('Errore nella rotta /api/auth/info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}