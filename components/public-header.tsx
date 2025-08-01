'use client'; // This directive is necessary for client-side components in Next.js App Router

// Ho rimosso l'import di Link, dato che non è più necessario
import LogoutButton from './logout-button';
import Image from 'next/image';
import CartIcon from './cart-icon';

/**
 * PublicHeader component handles the user logout process.
 * It calls the /api/logout Next.js API route to clear the HTTP-only cookie
 * and then redirects the user to the login page.
 */
export default function PublicHeader() {
  return (
    <div className="w-full flex justify-between items-center mt-4 lg:px-8 px:6">
      <div className="flex items-center">
        <div className="w-full flex">
          {/* MODIFICA: Sostituito <Link> con <a>.
            Questo causerà una navigazione "hard" alla homepage, 
            forzando un ricaricamento completo della pagina.
          */}
          <a href="/" className='ps-4'>
            <Image
              src="/assets/img/logo.png"
              alt="Logo"
              width={80}
              height={80}
            />
          </a>
        </div>
      </div>
      <div className="font-chase text-8xl hidden lg:block">Jason</div>
      <div className="pe-4 lg:pe-8 flex items-center gap-4">
        <CartIcon />
        <LogoutButton />
      </div>
    </div>
  );
}