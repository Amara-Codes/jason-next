"use client"; // Mark this component as a Client Component

import React, { useState, useEffect } from "react"; // Import useState and useEffect

// Definisci le Props che il componente si aspetta di ricevere
// La prop 'onCategorySelect' è una funzione che accetta un 'string' e non restituisce nulla (void)
interface CategoryFetcherProps {
    onCategorySelect: (categoryId: string) => void;
}

// Passa le props al componente
const CategoryFetcher = ({ onCategorySelect }: CategoryFetcherProps) => {
    // Lo stato 'selectedCategoryId' rimane qui per gestire l'UI interna (evidenziazione)
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337/api";

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const categoriesResponse = await fetch(`${STRAPI_URL}/categories`);
                if (!categoriesResponse.ok) {
                    throw new Error(`Failed to fetch categories: ${categoriesResponse.statusText}`);
                }
                const categoriesData = await categoriesResponse.json();
                const formattedCategories = categoriesData.data.map((item: any) => ({
                    documentId: item.documentId, // Aggiungi documentId se necessario
                    id: item.id.toString(),
                    // Assicurati che 'attributes.name' sia corretto se Strapi usa le attributes wrapper
                    label: item.name
                }));
                setCategories(formattedCategories);
            } catch (err: any) {
                setError(err.message);
                console.error("Error fetching initial data from Strapi:", err);
                alert(`Error fetching data: Could not load categories. ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // ---
    // 💡 Handle category click
    // ---
    const handleCategoryClick = (category: any) => {
        // Aggiorna lo stato interno per l'evidenziazione
        setSelectedCategoryId(category.id);
        // "Emette" l'evento chiamando la funzione passata dal padre
        onCategorySelect(category);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-teal-800 text-white text-2xl w-full">
                Loading data... ⏳
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-red-800 text-white text-2xl text-center p-4 w-full">
                Error: {error}. Please ensure your Strapi server is running and permissions are set correctly. 🚨
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-y-8 items-center min-h-screen bg-teal-800 w-full p-4 rounded-md">
            <h2 className="text-center text-2xl font-bold text-white">Select the Product Category</h2>
            <div className="flex flex-col lg:flex-row w-full max-w-4xl gap-4 lg:flex-wrap justify-center">
                {categories.map((item) => (
                    <div
                        key={item.id}
                        className={`bg-teal-900 p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-700 transition-colors
                            ${selectedCategoryId === item.id ? 'ring-4 ring-white' : ''}`}
                        onClick={() => handleCategoryClick(item)}
                    >
                        <p className="text-center text-white font-bold">{item.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryFetcher;