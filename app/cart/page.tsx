"use client"

import React, { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie'; // Import the js-cookie library
import PublicHeader from '@/components/public-header';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Function to load the cart from cookies ---
  const loadCartFromCookie = useCallback(() => {
    try {
      const cartCookie = Cookies.get('cart');
      if (cartCookie) {
        const parsedCart: any[] = JSON.parse(cartCookie);
        setCartItems(parsedCart);
      } else {
        setCartItems([]); // No cookie found, initialize as empty
      }
    } catch (e) {
      console.error("Failed to parse cart cookie:", e);
      setError("Failed to load cart. It might be corrupted.");
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCartFromCookie();

    // Add a listener for the 'cartUpdated' event
    const handleCartUpdate = () => {
      loadCartFromCookie();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    // Remove the listener when the component unmounts
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [loadCartFromCookie]);


  // --- Function to remove an item from the cart ---
  const handleRemoveItem = (itemToRemove: any) => {
    // Determine the unique identifier for the item
    const itemIdentifier = itemToRemove.variantDocId
      ? `${itemToRemove.productDocId}-${itemToRemove.variantDocId}`
      : itemToRemove.productDocId;

    // Filter items to remove the selected one
    const updatedCart = cartItems.filter(item => {
      const currentIdentifier = item.variantDocId
        ? `${item.productDocId}-${item.variantDocId}`
        : item.productDocId;
      return currentIdentifier !== itemIdentifier;
    });

    // Update state and cookie
    setCartItems(updatedCart);
    Cookies.set('cart', JSON.stringify(updatedCart), { expires: 7 });

    // Notify other components that the cart has been updated
    window.dispatchEvent(new Event('cartUpdated'));
    console.log("Item removed, cart updated:", updatedCart);
  };

  // --- Functions to calculate totals ---
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + (item.productPrice * item.quantity), 0).toFixed(2);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
        <p className="text-xl text-gray-700">Loading cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100 font-inter">
        <p className="text-xl text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen font-inter bg-gray-50">
      <PublicHeader />

      <div className="flex justify-center mt-6 p-2 pt-0 lg:p-8 w-full h-lvh-screen">
        <div className="flex flex-col items-center w-full max-w-7xl h-full">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Your Cart</h1>

          {cartItems.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-lg text-center w-full max-w-md min-h-1/2">
              <p className="text-xl text-gray-600 mb-8">Your cart is empty.</p>
              <a href="/" className="px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition duration-300 ease-in-out shadow-md">Add items to Cart</a>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 w-full">
              {cartItems.map((item) => {
                // Create a unique key for each item, which is essential for React
                const itemKey = item.variantDocId ? `${item.productDocId}-${item.variantDocId}` : item.productDocId;

                return (
                  <div key={itemKey} className="bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-shadow hover:shadow-xl relative">

                    {/* Item Details */}
                    <div className="flex-grow">
                      <h2 className="text-xl font-semibold text-gray-800">{item.productName}</h2>
                      {item.hasVariant && (
                        <div className="text-gray-500 text-sm">
               
                          <p className='font-medium mb-2'>{item.variantName}</p>
                          <p>{item.selectedSize && `Size: ${item.selectedSize}`}</p>
                          <p> {item.selectedColor && `Color: ${item.selectedColor}`}</p>
                          <p> {item.selectedMaterial && `Material: ${item.selectedMaterial}`}</p>
                        </div>
                      )}
                      <p className="text-gray-600 mt-2">Price: ${item.productPrice.toFixed(2)}</p>
                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                    </div>

                    {/* Total and Remove Button */}
                    <div className="flex flex-col items-end justify-between self-stretch mt-4 sm:mt-0">
                      <p className="text-lg font-bold text-teal-700">Total: ${(item.productPrice * item.quantity).toFixed(2)}</p>
                      <button onClick={() => handleRemoveItem(item)} className="text-gray-500 hover:text-red-600 transition-colors mt-2 flex items-center gap-1">
                        <Trash2 size={18} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {cartItems.length > 0 && (
            <div className="mt-10 bg-white p-8 rounded-lg shadow-lg w-full text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Summary</h3>
              <div className="flex justify-between items-center mb-2 text-lg">
                <span className="text-gray-700">Number of items:</span>
                <span className="font-semibold text-gray-800">{totalItems}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-4 mt-4">
                <span className="text-xl font-bold text-gray-800">Total:</span>
                <span className="text-xl font-bold text-teal-700">${totalPrice}</span>
              </div>
              <Link
                href={"/checkout"}
                className="mt-8 lg:mx-auto block w-full lg:max-w-xs px-8 py-4 bg-teal-600 text-white text-lg font-semibold rounded-md hover:bg-teal-700 transition duration-300 ease-in-out shadow-lg"
              >
                Checkout
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
