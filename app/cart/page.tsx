"use client"

import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie'; // Import the js-cookie library
import PublicHeader from '@/components/public-header';
import CartIcon from '@/components/cart-icon';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';



// Define the type for a cart item


export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Function to read cart items from the cookie
    const loadCartFromCookie = () => {
      try {
        const cartCookie = Cookies.get('cart');
        if (cartCookie) {
          const parsedCart: any[] = JSON.parse(cartCookie);
          setCartItems(parsedCart);
        } else {
          setCartItems([]); // No cart cookie found, initialize as empty
        }
      } catch (e) {
        console.error("Failed to parse cart cookie:", e);
        setError("Failed to load cart. It might be corrupted.");
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadCartFromCookie();

    // Example: Set a dummy cart cookie for testing if it doesn't exist
    // In a real app, the cart would be populated from user actions.
    if (!Cookies.get('cart')) {
      const dummyCart = [
        { id: '1', name: 'Product A', price: 29.99, quantity: 1, imageUrl: 'https://placehold.co/100x100/A7F3D0/065F46?text=Product+A' },
        { id: '2', name: 'Product B', price: 49.50, quantity: 2, imageUrl: 'https://placehold.co/100x100/FEE2E2/991B1B?text=Product+B' },
        { id: '3', name: 'Product C', price: 10.00, quantity: 1, imageUrl: 'https://placehold.co/100x100/DBEAFE/1E40AF?text=Product+C' },
      ];
      Cookies.set('cart', JSON.stringify(dummyCart), { expires: 7 }); // Expires in 7 days
      // Reload cart after setting dummy data
      loadCartFromCookie();
    }
  }, []);

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
    <div className="w-full h-screen font-inter"> {/* Aggiunto font-inter per una migliore estetica */}
      <PublicHeader />

      <div className="flex mt-6 p-2 pt-0 lg:p-8 gap-16 w-full">

        {/* Main Content Area for Cart Items */}
        <div className="flex flex-col items-center mt-6 p-2 pt-0 lg:p-8 w-full h-full bg-teal-800">
          <h1 className="text-4xl font-bold text-white mb-8">Cart</h1>

          {cartItems.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <p className="text-xl text-gray-600 mb-4">Your cart is empty.</p>
              <button
                onClick={() => alert('Navigate to home page')} // Placeholder for navigation
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300 ease-in-out shadow-md"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 w-full max-w-6xl">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-lg lg:p-6 p-2 flex flex-col transition-transform transform hover:scale-105 duration-300 ease-in-out relative">

                  <h2 className="text-xl font-semibold text-gray-800 mb-2">{item.productName}</h2>
                  {item.hasVariant == true && (
                    <p className="text-gray-600 mb-2">Variant: {item.variantName}</p>
                  )}
                  <p className="text-gray-600 mb-1">Price: ${item.price.toFixed(2)}</p>
                  <p className="text-gray-600 mb-4">Quantity: {item.quantity}</p>
                  <p className="text-right text-red-500 cursor-pointer block lg:hidden" onClick={() => alert(`Removed ${item.productName} from cart`)}>Remove</p>
                  <p className="text-lg font-bold text-teal-700 text-right">Total: ${(item.price * item.quantity).toFixed(2)}</p>
                  <div className="absolute top-4 right-4 hidden lg:block">
                    <Trash2 className="text-gray-600 hover:text-red-500 cursor-pointer" onClick={() => alert(`Removed ${item.productName} from cart`)} />
                  </div>

                </div>
              ))}
            </div>
          )}

          {cartItems.length > 0 && (
            <div className="mt-10 bg-white p-8 rounded-lg shadow-lg w-full  max-w-6xl text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Summary</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Number of items:</span>
                <span className="font-semibold text-gray-800">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-4 mt-4">
                <span className="text-xl font-bold text-gray-800">Total:</span>
                <span className="text-xl font-bold text-teal-700">${cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}</span>
              </div>
              <button
                onClick={() => alert('Proceed to checkout')} // Placeholder for checkout functionality
                className="mt-6 px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-md hover:bg-green-700 transition duration-300 ease-in-out shadow-lg"
              >
                Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
