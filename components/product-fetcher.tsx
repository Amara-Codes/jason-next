"use client"; // Mark this component as a Client Component

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie"; // Importa js-cookie per gestire i cookie
// Importa i componenti UI necessari da shadcn/ui
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, ShoppingCart } from "lucide-react"; // Icone per quantità e carrello
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"; // Importa Select per le varianti
import { se } from "date-fns/locale";

// --- TIPI DI DATI (con any come richiesto) ---
// Per ora useremo 'any' per i tipi di dati di Strapi
type ProductVariant = any;
type Product = any;

// Definisci le Props che il componente si aspetta di ricevere
interface ProductFetcherProps {
    selectedCategory: any | null;
}

const ProductFetcher = ({ selectedCategory }: ProductFetcherProps) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Stato per gestire le quantità per ogni prodotto/variante
    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

    // Nuovo stato per tenere traccia della variante selezionata per ogni prodotto.
    const [selectedVariants, setSelectedVariants] = useState<{ [productDocId: string]: string | null }>({});


    const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337/api";

    // ---
    // 🌍 Fetch dei prodotti basato sulla categoria selezionata
    // ---
    useEffect(() => {
        const fetchProductsByCategory = async () => {
            if (selectedCategory) {
                setLoading(true);
                setProducts([]);
                setQuantities({}); // Resetta le quantità
                setSelectedVariants({}); // Resetta le varianti selezionate
                setError(null);

                try {
                    // Assicurati che 'product_variants' sia popolato per ottenere i dati delle varianti
                    const productsResponse = await fetch(`${STRAPI_URL}/products?filters[categories][id][$eq]=${selectedCategory.id}&populate=*`);
                    if (!productsResponse.ok) {
                        throw new Error(`Failed to fetch products: ${productsResponse.statusText}`);
                    }
                    const productsData = await productsResponse.json();
                    const fetchedProducts: Product[] = productsData.data.map((item: any) => ({
                        id: item.documentId,
                        ...item // Tira giù tutto quello che viene fornito, senza .attributes
                    }));
                    setProducts(fetchedProducts);

                    // Inizializza le quantità e le varianti selezionate
                    const initialQuantities: { [key: string]: number } = {};
                    const initialSelectedVariants: { [productDocId: string]: string | null } = {};

                    fetchedProducts.forEach((product) => {
                        // Supponendo che le varianti siano direttamente su `product.product_variants`
                        const hasVariants = product.product_variants && product.product_variants && product.product_variants.length > 0;
                        if (hasVariants) {
                            // Se ha varianti, seleziona la prima di default e inizializza la quantità per quella variante
                            const firstVariant = product.product_variants[0];
                            initialSelectedVariants[product.documentId] = firstVariant.documentId;
                            initialQuantities[`${product.documentId}-${firstVariant.documentId}`] = 1;
                        } else {
                            // Se non ha varianti, inizializza la quantità per il prodotto base
                            initialSelectedVariants[product.documentId] = null; // Nessuna variante selezionata
                            initialQuantities[product.documentId] = 1;
                        }
                    });
                    setQuantities(initialQuantities);
                    setSelectedVariants(initialSelectedVariants);

                } catch (err: any) {
                    setError(err.message);
                    console.error("Error fetching products by category:", err);
                } finally {
                    setLoading(false);
                }
            } else {
                setProducts([]);
                setQuantities({});
                setSelectedVariants({});
                setError(null);
            }
        };

        fetchProductsByCategory();
    }, [selectedCategory, STRAPI_URL]);

    // ---
    // Gestione della quantità del singolo prodotto/variante
    // ---
    const getProductOrVariantDetails = (product: Product) => {
        // Supponendo che le varianti siano direttamente su `product.product_variants`
        const hasVariants = product.product_variants && product.product_variants && product.product_variants.length > 0;
        let currentPrice = product.price; // Prezzo direttamente su product
        let currentStock = product.quantity; // Stock direttamente su product
        let selectedVariantDocId: string | null = null;
        let selectedVariantName: string = '';
        let currentMinimumQuantity = product.minimum_quantity; // Quantità minima di default

        if (hasVariants) {
            selectedVariantDocId = selectedVariants[product.documentId];
            const selectedVariant = product.product_variants.find(
                (variant: any) => variant.documentId === selectedVariantDocId
            );

            if (selectedVariant) {
                currentPrice = selectedVariant.price !== undefined // Prezzo specifico per la variante
                    ? selectedVariant.price
                    : product.price;
                currentStock = selectedVariant.quantity;
                currentMinimumQuantity = selectedVariant.minimum_quantity || product.minimum_quantity; // Quantità minima della variante
                selectedVariantName = selectedVariant.name;
            } else if (product.product_variants.length > 0) {
                 // Se non c'è una variante selezionata o quella selezionata non esiste, usa la prima disponibile
                const fallbackVariant = product.product_variants[0];
                currentPrice = fallbackVariant.price !== undefined
                    ? fallbackVariant.price
                    : product.price;
                currentStock = fallbackVariant.quantity;
                currentMinimumQuantity = fallbackVariant.minimum_quantity || product.minimum_quantity;
                selectedVariantName = fallbackVariant.name;
            }
        }

        const key = hasVariants && selectedVariantDocId ? `${product.documentId}-${selectedVariantDocId}` : product.documentId;
        const currentQuantity = quantities[key] || 1; // La quantità è legata alla chiave specifica (prodotto o prodotto-variante)

        return { currentPrice, currentStock, currentQuantity, currentMinimumQuantity, key, selectedVariantDocId, selectedVariantName };
    };


    const handleQuantityChange = (key: string, value: number) => {
        setQuantities((prevQuantities) => ({
            ...prevQuantities,
            [key]: Math.max(1, value)
        }));
    };

    const handleIncrementQuantity = (key: string, maxStock: number) => {
        setQuantities((prevQuantities) => ({
            ...prevQuantities,
            [key]: Math.min(maxStock, (prevQuantities[key] || 0) + 1)
        }));
    };

    const handleDecrementQuantity = (key: string) => {
        setQuantities((prevQuantities) => ({
            ...prevQuantities,
            [key]: Math.max(1, (prevQuantities[key] || 0) - 1)
        }));
    };

    // ---
    // Gestione della selezione della variante
    // ---
    const handleVariantChange = (productDocId: string, variantId: string) => {
        setSelectedVariants((prevSelected) => ({
            ...prevSelected,
            [productDocId]: variantId,
        }));
        // Quando la variante cambia, potresti voler resettare la quantità a 1 per quella nuova variante
        const product = products.find(p => p.documentId === productDocId);
        if (product && product.product_variants && product.product_variants) {
            const variant = product.product_variants.find((v: any) => v.documentId === variantId);
            if (variant) {
                const key = `${productDocId}-${variantId}`;
                setQuantities(prev => ({ ...prev, [key]: 1 }));
            }
        }
    };


      const updateCartCookie = (itemToAdd: any) => {
        let currentCart: any[] = [];
        const existingCartCookie = Cookies.get('cart'); // Legge il cookie con js-cookie

        if (existingCartCookie) {
            try {
                currentCart = JSON.parse(existingCartCookie);
            } catch (e) {
                console.error("Errore nel parsing del cookie del carrello esistente:", e);
                currentCart = []; // Inizializza un carrello vuoto in caso di errore di parsing
            }
        }

        const itemIndex = currentCart.findIndex(item =>
            item.productDocId === itemToAdd.productDocId && item.variantDocId === itemToAdd.variantDocId
        );

        if (itemIndex > -1) {
            // Se l'elemento esiste già, aggiorna la quantità
            currentCart[itemIndex].quantity += itemToAdd.quantity;
        } else {
            // Altrimenti, aggiungi il nuovo elemento
            currentCart.push(itemToAdd);
        }

        // Salva il carrello aggiornato nel cookie
        // Imposta una data di scadenza (es. 7 giorni)
        Cookies.set('cart', JSON.stringify(currentCart), { expires: 7 });

        // Dispatch un evento custom per notificare ad altri componenti (es. CartIcon) che il carrello è stato aggiornato
        // Questo è il meccanismo che userà il CartIcon per aggiornarsi
        window.dispatchEvent(new Event('cartUpdated'));

        console.log("Carrello aggiornato nel cookie:", currentCart);
    };

    // ---
    // Aggiungi prodotto/variante al carrello (qui dovrai integrare con useCart in futuro)
    // ---
    const handleAddToCart = (product: Product) => {
        const { currentPrice, currentStock, currentQuantity, key, selectedVariantDocId, selectedVariantName } = getProductOrVariantDetails(product);

        if (currentQuantity <= 0) {
            alert("Seleziona una quantità valida.");
            return;
        }
        if (currentStock < currentQuantity) {
            alert(`Siamo spiacenti, solo ${currentStock} disponibili per questa selezione.`);
            return;
        }

        // --- QUI SARÀ INTEGRATA LA LOGICA DEL CARRELLO ---
        // Per ora, solo un log per dimostrare che i dati sono pronti
        const itemToAdd = {
            productDocId: product.documentId,
            productDocumentId: product.documentId, // Aggiungi documentId se necessario
            productName: product.name,
            hasVariant: product.product_variants.length > 0, // Accesso diretto a 'name'
            variantDocId: selectedVariantDocId,
            variantName: selectedVariantName,
            price: currentPrice,
            quantity: currentQuantity,
        };

        updateCartCookie(itemToAdd); // Aggiorna il cookie del carrello
        // Optional: Resetta la quantità del prodotto/variante a 1 dopo averlo aggiunto
        setQuantities((prevQuantities) => ({
            ...prevQuantities,
            [key]: 1
        }));
    };

    // ---
    // Visualizzazione dello stato di caricamento/errore
    // ---
    if (!selectedCategory) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-teal-800 text-white text-xl text-center p-4 w-full">
                Select a category to view products.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-teal-800 text-white text-2xl w-full">
                Loading products... ⏳
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-red-800 text-white text-2xl text-center p-4 w-full">
                Error loading products: {error}. Please try again. 🚨
            </div>
        );
    }

    // ---
    // Renderizzazione dei prodotti
    // ---
    return (
        <div className="flex flex-col gap-y-8 items-center min-h-screen bg-teal-800 w-full p-4 rounded-md">
            <h2 className="text-center text-2xl font-bold text-white">Products - {selectedCategory.label.toUpperCase()}</h2>
            {products.length === 0 && !loading && !error && (
                <p className="text-white text-lg w-full">No products found for this category.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full min-w-full">
                {products.map((product: any) => { // Product is also 'any' now
                    // Accesso diretto alle proprietà
                    const hasVariants = product.product_variants && product.product_variants && product.product_variants.length > 0;
                    const { currentPrice, currentStock, currentQuantity, currentMinimumQuantity, key, selectedVariantDocId, selectedVariantName } = getProductOrVariantDetails(product);

                    return (
                        <Card key={product.documentId} className="bg-teal-700 p-4 rounded-lg shadow-lg flex flex-col justify-between">
                            <div className="text-white">
                                <h3 className="font-semibold text-xl mb-2">{product.name}</h3> {/* Accesso diretto a 'name' */}
                                {hasVariants && (
                                    <div className="mb-4">
                                        <Select
                                            value={selectedVariantDocId || ''}
                                            onValueChange={(value) => handleVariantChange(product.documentId, value)}
                                            disabled={currentStock <= 0}
                                        >
                                            <SelectTrigger className="w-full bg-teal-600 text-white border-teal-500 focus:border-white">
                                                <SelectValue placeholder="Select a variant" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-teal-600 text-white">
                                                {product.product_variants.map((variant: any) => ( // Variant is also 'any'
                                                    <SelectItem key={variant.documentId} value={variant.documentId} className="hover:bg-teal-500">
                                                        {variant.name} ({variant.quantity} pz) {/* Accesso diretto a 'name' e 'stock' */}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <p className="text-md mb-1">Price: ${currentPrice.toFixed(2)}</p>
                                <div className="flex items-center gap-2 mn-4">
                                <p className="text-sm opacity-80">Available:</p>
                                <p className={`text-sm opacity-80 ${currentStock > currentMinimumQuantity ? 'text-green-500' : 'text-yellow-500'}`}>{currentStock ?? 0}</p>
                                <p className="text-sm opacity-80">pz</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-auto">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleDecrementQuantity(key)}
                                    disabled={currentQuantity <= 1 || currentStock <= 0}
                                    className="bg-teal-600 text-white hover:bg-teal-500 hover:text-white border-none"
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                    type="number"
                                    value={currentQuantity}
                                    onChange={(e) => handleQuantityChange(key, parseInt(e.target.value) || 0)}
                                    className="w-20 text-center bg-teal-600 text-white border-teal-500 focus:border-white"
                                    min="1"
                                    max={currentStock}
                                    disabled={currentStock <= 0}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleIncrementQuantity(key, currentStock)}
                                    disabled={currentQuantity >= currentStock || currentStock <= 0}
                                    className="bg-teal-600 text-white hover:bg-teal-500 hover:text-white border-none"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                    onClick={() => handleAddToCart(product)}
                                    className="flex-1 ml-4 bg-emerald-900 text-white hover:bg-emerald-700"
                                    disabled={currentStock <= 0 || (hasVariants && !selectedVariantDocId) || currentQuantity <= 0}
                                >
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Add
                                </Button>
                            </div>
                            {currentStock <= 0 && (
                                <p className="text-red-300 text-sm text-center mt-2">Out od stock</p>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default ProductFetcher;