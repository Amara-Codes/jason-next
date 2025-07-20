// app/page.tsx
"use client"

import type { Metadata } from "next";
import LogoutButton from "@/components/logout-button";
import CartIcon from "@/components/cart-icon";
import Image from "next/image";
import CategoryFetcher from "@/components/category-fetcher";
import ProductFetcher from "@/components/product-fetcher";
import { useState, useEffect } from 'react'; // Importa useState e useEffect

export default function Home() {
  // Lo stato che riceverà il selectedCategory dal CategoryFetcher
  const [currentSelectedCategory, setCurrentSelectedCategory] = useState<string | null>(null);

  // Stati per gestire la visibilità e l'opacità dei componenti
  const [showCategoryFetcher, setShowCategoryFetcher] = useState(true);
  const [showProductFetcher, setShowProductFetcher] = useState(false);
  const [categoryOpacity, setCategoryOpacity] = useState('opacity-100');
  const [productOpacity, setProductOpacity] = useState('opacity-0');

  // Questa funzione verrà passata al CategoryFetcher
  const handleCategorySelected = (category: any) => {
    setCurrentSelectedCategory(category);
    console.log("Categoria selezionata ricevuta nel padre:", category);

    // Avvia l'effetto di dissolvenza in uscita per CategoryFetcher
    setCategoryOpacity('opacity-0');

    // Dopo la dissolvenza (della durata di 500ms, che corrisponde alla transizione CSS),
    // nascondi CategoryFetcher e mostra ProductFetcher con l'effetto di dissolvenza in entrata.
    // Usiamo setTimeout per dare il tempo alla transizione di completarsi prima di applicare 'hidden'.
    setTimeout(() => {
      setShowCategoryFetcher(false); // Nasconde CategoryFetcher (aggiunge classe 'hidden')
      setShowProductFetcher(true);    // Mostra ProductFetcher (rimuove classe 'hidden')
      setProductOpacity('opacity-100'); // Avvia la dissolvenza in entrata per ProductFetcher
    }, 500); // La durata del timeout deve corrispondere alla durata della transizione CSS (duration-500)
  };

  return (
    <div className="w-full h-screen font-inter"> {/* Aggiunto font-inter per una migliore estetica */}
      <div className="w-full flex justify-between items-center mt-4 px-8">
        <div className="flex items-center">
          <div className="w-full flex">
            <Image
              src="/assets/img/logo.png"
              alt="Logo"
              width={80}
              height={80}
            />
          </div>
        </div>
        <div className="font-chase text-8xl hidden lg:block">Jason</div>
        <div className="pe-4">
          <CartIcon />
        </div>
      </div>

      <div className="flex mt-6 p-2 pt-0 lg:p-8 gap-16 w-full h-full">
        {/* Contenitore principale per i fetcher.
            'relative' è necessario affinché i figli con 'absolute' si posizionino correttamente al suo interno.
            Aggiunti stili estetici come 'rounded-lg' e 'shadow-lg'. */}
        <div className="bg-teal-700 grow h-full relative rounded-md shadow-lg">
          {/* Wrapper per CategoryFetcher
              - 'absolute inset-0' fa sì che occupi l'intero spazio del genitore 'relative'.
              - 'transition-opacity duration-500' abilita l'effetto di dissolvenza.
              - Le classi di opacità e 'hidden' sono applicate condizionalmente.
              - 'flex items-center justify-center' centra il contenuto all'interno del wrapper. */}
          <div className={`absolute inset-x-0 transition-opacity duration-700 ${categoryOpacity} ${showCategoryFetcher ? '' : 'hidden'} flex items-center justify-center`}>
            <CategoryFetcher onCategorySelect={handleCategorySelected} />
          </div>

          {/* Wrapper per ProductFetcher
              - Stesse logiche di posizionamento e transizione di CategoryFetcher.
              - Inizialmente ha 'opacity-0' e 'hidden', poi diventa visibile e opaco. */}
          <div className={`absolute inset-x-0 transition-opacity duration-700 ${productOpacity} ${showProductFetcher ? '' : 'hidden'} flex items-center justify-center`}>
            <ProductFetcher selectedCategory={currentSelectedCategory} />
          </div>
        </div>
      </div>
    </div>
  );
}
