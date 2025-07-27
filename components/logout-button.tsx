'use client'; // This directive is necessary for client-side components in Next.js App Router

import { useRouter } from 'next/navigation'; // For Next.js App Router navigation
import { useState } from 'react';
import { LogOut } from 'lucide-react';

/**
 * LogoutButton component handles the user logout process.
 * It calls the /api/logout Next.js API route to clear the HTTP-only cookie
 * and then redirects the user to the login page.
 */
export default function LogoutButton() {
  const router = useRouter(); // Initialize Next.js router
  const [loading, setLoading] = useState(false); // State for loading indicator

  /**
   * handleLogout function is triggered when the logout button is clicked.
   * It sends a POST request to the /api/logout route.
   */
  const handleLogout = async () => {
    setLoading(true); // Set loading state to true

    try {
      // Make a POST request to your custom Next.js API route for logout.
      // This route will handle the deletion of the HTTP-only cookie.
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // If logout was successful (cookie cleared by server), redirect to the login page.
        router.push('/login');
      } else {
        // Handle potential errors from the logout API route
        const data = await response.json();
        console.error('Logout failed:', data.error);
        alert(data.error || 'Failed to logout. Please try again.'); // Using alert for simplicity, consider a custom modal
      }
    } catch (error) {
      // Catch any network errors
      console.error('Network error during logout:', error);
      alert('Network error during logout. Please try again.'); // Using alert for simplicity
    } finally {
      setLoading(false); // Always set loading state to false
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="lg:bg-red-500 lg:hover:bg-red-600 text-white font-bold lg:py-2 lg:px-4 lg:rounded-lg lg:shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-1.5 lg:mb-0"
      disabled={loading} // Disable button while loading
    >
      <div className="hidden lg:block">

      {loading ? (
        <svg className="animate-spin h-5 w-5 text-white mr-2" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        'Logout'
      )}
      </div>

      <div className="block lg:hidden">
      {loading ? (
        <svg className="animate-spin h-5 w-5 text-white mr-2" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <LogOut className="h-8 w-8 text-red-500" />
      )}

      </div>
    </button>
  );
}
