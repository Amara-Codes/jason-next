// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Assicurati che NEXT_PUBLIC_STRAPI_URL sia impostato correttamente nel tuo file .env.local
// e che sia accessibile nell'ambiente del middleware.
const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const jwt = request.cookies.get('jwt')?.value;

  // Definisci i percorsi che non richiedono alcuna autenticazione o autorizzazione.
  // Assicurati che la tua pagina di login e l'API di login siano sempre accessibili.
  const publicPaths = ['/login', '/api/login'];

  // Se il percorso richiesto è un percorso pubblico, consenti l'accesso immediatamente.
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Se non è presente un JWT nel cookie per un percorso protetto,
  // reindirizza l'utente alla pagina di login e pulisci il cookie.
  if (!jwt) {
    console.warn(`Accesso negato per ${pathname}: JWT assente. Reindirizzamento al login.`);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('jwt'); // Pulisci il cookie (anche se non c'era, per sicurezza)
    return response;
  }

  // A questo punto, un JWT è presente. Dobbiamo validarlo con Strapi
  // e recuperare i dettagli dell'utente, inclusi i suoi ruoli.
  try {
    const strapiResponse = await fetch(`${STRAPI_API_URL}/users/me?populate=*`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`, // Invia il JWT nell'header di autorizzazione
      },
    });

    // Se la risposta di Strapi non è OK (es. JWT non valido o scaduto),
    // il JWT non è più valido. Cancella il cookie e reindirizza al login.
    if (!strapiResponse.ok) {
      console.error('JWT non valido o scaduto. Reindirizzamento al login.');
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('jwt'); // Cancella il cookie non valido
      return response;
    }

    const userData = await strapiResponse.json();
    // IMPORTANTE: Assicurati che Strapi sia configurato per includere il campo 'role'
    // nell'endpoint /users/me. Questo si fa nelle impostazioni dei permessi
    // del ruolo 'Authenticated' nel pannello di amministrazione di Strapi,
    // abilitando la visibilità del campo 'role' per l'azione 'find' del Content-Type 'User'.
    // Normalizza il nome del ruolo in minuscolo per un confronto case-insensitive.
    const userRoles = userData.role ? [userData.role.name.toLowerCase()] : [];



    // Logica di autorizzazione basata sul percorso e sui ruoli dell'utente.

    // 1. Gestione dei percorsi /admin e sottocartelle (/admin/*)
    // Se il percorso inizia con '/admin', si applicano regole specifiche.
    if (pathname.startsWith('/admin')) {
      // Se l'utente ha il ruolo 'operator', NON deve avere accesso a /admin o alle sue sottocartelle.
      if (userRoles.includes('operator')) {
        console.warn(`Accesso negato per ${pathname}: l'utente è un 'operator' e non può accedere a /admin.`);
        return NextResponse.redirect(new URL('/', request.url));
      }
      // Se non è un 'operator' ma è autenticato (il JWT è valido), può accedere a /admin.
      // Questo copre il ruolo 'authenticated' predefinito e altri ruoli non 'operator'.
      console.log(`Accesso consentito per ${pathname}: utente autenticato (non operator). Ruoli: ${userRoles.join(', ')}`);
      return NextResponse.next();
    }


    return NextResponse.next();

  } catch (error) {
    console.error('Errore nel middleware durante la validazione del JWT o il recupero dei ruoli:', error);
    // In caso di errore (es. problema di rete con Strapi),
    // cancella il cookie e reindirizza al login per sicurezza.
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('jwt');
    return response;
  }
}

// Configura su quali percorsi il middleware deve essere eseguito.
// Il matcher esclude i percorsi che non devono essere gestiti dal middleware,
// come i file statici di Next.js (_next/static).
export const config = {
  matcher: [
    /*
     * Fai corrispondere tutti i percorsi eccetto:
     * - API routes (che iniziano con /api, ma includiamo /api/login esplicitamente se necessario)
     * - file statici (_next/static, _next/image, favicon.ico)
     * - public folder (es. /vercel.svg)
     */
    '/',
    '/admin/:path*', // Corrisponde a /admin e tutte le sue sottocartelle
    '/((?!api|_next/static|_next/image|favicon.ico|login|unauthorized).*)', // Cattura gli altri percorsi protetti
  ],
};
