// Make this a client component
"use client";

import { useState, FormEvent, ChangeEvent, useRef } from "react";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337/api";

export default function AddColor() {
  const [name, setName] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !image) {
      setError("Both name and image are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();

    // MODIFICATO: Struttura la FormData per corrispondere a data: { name, image }
    // Questa sintassi invia i campi come se fossero nidificati in un oggetto 'data'.
    formData.append('data[name]', name);
    formData.append('data[image]', image, image.name);

    try {
      const response = await fetch(`${STRAPI_URL}/colors`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        const message = result.error?.message || "Something went wrong.";
        throw new Error(message);
      }

      // Potrebbe essere necessario aggiustare questo path in base alla risposta esatta del tuo backend
      const createdName = result.data?.attributes?.name || name;
      setSuccess(`Color "${createdName}" added successfully!`);
      
      setName("");
      setImage(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex w-full">
        <div className="bg-teal-800 grow text-white relative overflow-x-hidden">
          <div className="mt-8 text-lg gap-4 relative z-20 overflow-y-auto h-screen p-8">
            <h1 className="text-3xl font-bold mb-6">Add New Color</h1>

            <form onSubmit={handleSubmit} className="max-w-md space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Color Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-teal-700 border border-teal-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="e.g., Ocean Blue"
                  required
                />
              </div>

              <div>
                <label htmlFor="image-input" className="block text-sm font-medium mb-2">
                  Color Image
                </label>
                <input
                  type="file"
                  id="image-input"
                  ref={fileInputRef} 
                  onChange={handleImageChange}
                  accept="image/*"
                  className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600"
                  required
                />
                {image && <p className="text-xs mt-2 text-gray-300">Selected: {image.name}</p>}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Adding..." : "Add Color"}
                </button>
              </div>
            </form>

            <div className="mt-6">
              {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
              {success && <p className="text-teal-300 bg-teal-900/50 p-3 rounded-md">{success}</p>}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}