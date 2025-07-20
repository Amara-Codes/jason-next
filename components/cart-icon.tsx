'use client';

import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie'; // Importa js-cookie
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react'; // Importa l'icona ShoppingCart da Lucide

// Definisco un tipo per un elemento nel carrello per coerenza con ProductFetcher
interface CartItem {
    productId: string | number;
    productName: string;
    variantId: string | number | null;
    variantName: string | null;
    price: number;
    quantity: number; // La quantità di questo specifico item nel carrello
}

const CartIcon = () => {
  const [itemCount, setItemCount] = useState(0);

  // Funzione per leggere la somma delle quantità dal cookie del carrello
  const getCartTotalQuantity = () => {
    const cartCookie = Cookies.get('cart'); // Legge il cookie con js-cookie
    let totalQuantity = 0;

    if (cartCookie) {
      try {
        const cartItems: CartItem[] = JSON.parse(cartCookie);
        // Somma la proprietà 'quantity' di ogni elemento nel carrello
        totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      } catch (e) {
        console.error("Errore nel parsing del cookie del carrello:", e);
        return 0;
      }
    }
    return totalQuantity;
  };

  useEffect(() => {
    // Imposta il conteggio iniziale quando il componente si monta
    setItemCount(getCartTotalQuantity());

    // Listener per aggiornare il conteggio quando il cookie del carrello cambia
    // L'evento 'cartUpdated' viene dispatchato dal componente ProductFetcher
    const handleCartUpdate = () => {
      setItemCount(getCartTotalQuantity());
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []); // L'array vuoto assicura che l'effetto venga eseguito solo al mount e unmount

  return (
    <Link href="/cart" className="relative text-current no-underline">
      <div className="relative inline-block cursor-pointer text-2xl">
        <ShoppingCart size={32} /> {/* Icona ShoppingCart da Lucide, dimensione 32px */}
        {itemCount > 0 && (
          <span
            className="absolute -top-1 -right-2.5 bg-red-500 text-white rounded-full
                       px-1.5 py-0.5 text-xs font-bold flex items-center justify-center
                       min-w-[20px] h-[20px]"
          >
            {itemCount}
          </span>
        )}
      </div>
    </Link>
  );
};

export default CartIcon;