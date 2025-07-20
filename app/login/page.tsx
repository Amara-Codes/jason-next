'use client'; // This directive is necessary for client-side components in Next.js App Router

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // For Next.js App Router navigation

/**
 * LoginPage component handles user authentication by sending credentials
 * to the /api/login Next.js API route. This API route then communicates
 * with Strapi and sets an HTTP-only cookie upon successful login.
 */
export default function LoginPage() {
  // State variables to store user input for email and password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // State to display any error messages to the user
  const [error, setError] = useState('');
  // State to manage loading indicator during the login process
  const [loading, setLoading] = useState(false);

  // Initialize the Next.js router for programmatic navigation
  const router = useRouter();

  /**
   * handleLogin function is triggered when the login form is submitted.
   * It sends the user's credentials to the custom Next.js /api/login route.
   *
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the default form submission behavior (page reload)

    setError('');       // Clear any previous error messages
    setLoading(true);   // Set loading state to true to show a loading indicator

    try {
      // Make a POST request to the custom Next.js API route for login.
      // This route will handle the communication with Strapi and the setting
      // of the HTTP-only cookie.
      const response = await fetch('/api/login', {
        method: 'POST', // Ensure this is POST, not DPOST. Corrected below.
        headers: {
          'Content-Type': 'application/json',
        },
        // Send the email and password from the form as JSON in the request body
        body: JSON.stringify({ email, password }),
      });

      // Parse the JSON response from your Next.js API route
      const data = await response.json();

      // Check if the response from your /api/login route was successful (HTTP status 2xx)
      if (response.ok) {
        // If successful, the HTTP-only cookie has been set by the API route.
        // The client-side JavaScript does not need to access or store the JWT directly.
        // Redirect the user to the protected admin dashboard.
        router.push('/admin');
      } else {
        // If the login failed (e.g., incorrect credentials), display the error message
        // received from your API route (which might have originated from Strapi).
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      // Catch any network errors or unexpected exceptions during the fetch operation
      console.error('Login error:', err);
      setError('An unexpected error occurred during login. Please try again.');
    } finally {
      setLoading(false); // Always set loading state to false after the request completes
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 p-4 font-inter">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
        <h1 className="text-6xl font-extrabold text-center text-gray-800 mb-8 font-chase">
          Jason
        </h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 ease-in-out"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading} // Disable input fields while loading
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 ease-in-out"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading} // Disable input fields while loading
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200 animate-fade-in">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-slate-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300 transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={loading} // Disable the button while loading
          >
            {loading ? (
              // Loading spinner SVG
              <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Login'
            )}
          </button>
        </form>
        <p className="text-center text-gray-500 text-xs mt-6">
          &copy; {new Date().getFullYear()} Jason Admin. All rights reserved.
        </p>
      </div>
    </div>
  );
}
