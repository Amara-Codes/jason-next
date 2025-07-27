"use client"; // Mark this component as a Client Component

import React, { useState, useEffect, useCallback } from "react";
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
} from "@/components/ui/select";

// --- TIPI DI DATI (con any come richiesto) ---
type Product = any;
type ProductVariant = any; // Assuming variants have size, color, material, name, price, quantity, documentId, minimum_quantity

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
    const [selectedOptions, setSelectedOptions] = useState<{
        [productDocId: string]: {
            size: string | null;
            color: string | null;
            material: string | null;
        };
    }>({});

    const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337/api";

    // --- Helper function to get unique options for a given key (size, color, material) ---
    const getUniqueOptions = (variants: ProductVariant[], key: 'size' | 'color' | 'material', filters: { size?: string | null, color?: string | null, material?: string | null }) => {
        const filteredVariants = variants.filter(variant => {
            let match = true;
            // Ensure variant[key] exists and is not null before comparison
            if (filters.size && variant.size !== filters.size) match = false;
            if (filters.color && variant.color !== filters.color) match = false;
            if (filters.material && variant.material !== filters.material) match = false;
            return match;
        });
        // Filter out null/undefined values before creating a Set
        const options = Array.from(new Set(filteredVariants.map(variant => variant[key]).filter(Boolean)));
        return options.sort(); // Sort for consistent order
    };

    // ---
    // 🌍 Fetch dei prodotti basato sulla categoria selezionata
    // ---
    useEffect(() => {
        const fetchProductsByCategory = async () => {
            if (selectedCategory) {
                setLoading(true);
                setProducts([]);
                setQuantities({}); // Resetta le quantità
                setSelectedOptions({}); // Resetta le opzioni selezionate
                setError(null);

                try {
                    // Fetch products, populating product_variants to get their basic IDs
                    // Assuming product_variants are directly nested, not under .data
                    const productsResponse = await fetch(`${STRAPI_URL}/products?filters[categories][id][$eq]=${selectedCategory.id}&populate=product_variants`);
                    if (!productsResponse.ok) {
                        throw new Error(`Failed to fetch products: ${productsResponse.statusText}`);
                    }
                    const productsData = await productsResponse.json();
                    
                    const initialQuantities: { [key: string]: number } = {};
                    const initialSelectedOptions: {
                        [productDocId: string]: {
                            size: string | null;
                            color: string | null;
                            material: string | null;
                        };
                    } = {};

                    // Process each product to fetch detailed variant data if available
                    const fetchedProductsPromises = productsData.data.map(async (item: any) => {
                        const product = {
                            documentId: item.id, // Use 'id' from Strapi as documentId
                            ...item // Get all properties directly, no .attributes
                        };

                        // Declare currentSize, currentColor, currentMaterial before use
                        let currentSize: string | null = null;
                        let currentColor: string | null = null;
                        let currentMaterial: string | null = null;

                        // Check if product_variants exists and has items directly, not under .data
                        const hasVariants = product.product_variants && product.product_variants.length > 0;
                        
                        if (hasVariants) {

                            // Fetch detailed data for each variant
                            const detailedVariantsPromises = product.product_variants.map(async (v: any) => {
                                try {
                                    // Use variant.documentId for the fetch
                                    const variantResponse = await fetch(`${STRAPI_URL}/product-variants/${v.documentId}?populate=*`);
                                    if (!variantResponse.ok) {
                                        console.error(`Failed to fetch detailed variant ${v.documentId}: ${variantResponse.statusText}`);
                                        return null; // Return null for failed fetches
                                    }
                                    const detailedVariantData = await variantResponse.json();
                                    const variantItem = detailedVariantData.data; // Access data directly, no .attributes

                                    // Flatten the nested color, material, size objects into direct properties
                                    return {
                                        documentId: variantItem.documentId, // Use documentId from fetched item
                                        name: variantItem.name,
                                        price: variantItem.price,
                                        quantity: variantItem.quantity,
                                        minimum_quantity: variantItem.minimum_quantity,
                                        size: variantItem.size?.name || null, // Access name directly
                                        color: variantItem.color?.name || null, // Access name directly
                                        material: variantItem.material?.name || null, // Access name directly
                                    };
                                } catch (variantFetchError) {
                                    console.error(`Error fetching detailed variant ${v.documentId}:`, variantFetchError);
                                    return null; // Return null on error
                                }
                            });

                            // Wait for all detailed variant fetches to complete and filter out any nulls
                            product.product_variants = (await Promise.all(detailedVariantsPromises)).filter(Boolean);

                            // Now populate initial options based on the fully detailed variants
                            const variantsForInitialPop = product.product_variants;

                            let selectedVariant: ProductVariant | null = null;

                            const uniqueSizes = getUniqueOptions(variantsForInitialPop, 'size', {});
                            if (uniqueSizes.length === 1) {
                                currentSize = uniqueSizes[0];
                            }

                            const uniqueColors = getUniqueOptions(variantsForInitialPop, 'color', { size: currentSize });
                            if (uniqueColors.length === 1) {
                                currentColor = uniqueColors[0];
                            }

                            const uniqueMaterials = getUniqueOptions(variantsForInitialPop, 'material', { size: currentSize, color: currentColor });
                            if (uniqueMaterials.length === 1) {
                                currentMaterial = uniqueMaterials[0];
                            }

                            // Find the exact variant based on auto-selected or default options
                            selectedVariant = variantsForInitialPop.find((v: ProductVariant) =>
                                (currentSize ? v.size === currentSize : true) &&
                                (currentColor ? v.color === currentColor : true) &&
                                (currentMaterial ? v.material === currentMaterial : true)
                            );

                            if (selectedVariant) {
                                const key = `${product.documentId}-${selectedVariant.documentId}`;
                                initialQuantities[key] = 1;
                            } else {
                                // Fallback if no specific variant matches auto-selection, pick the first one with quantity > 0
                                const firstAvailableVariant = variantsForInitialPop.find((v: ProductVariant) => v.quantity > 0);
                                if (firstAvailableVariant) {
                                    currentSize = firstAvailableVariant.size || null;
                                    currentColor = firstAvailableVariant.color || null;
                                    currentMaterial = firstAvailableVariant.material || null;
                                    selectedVariant = firstAvailableVariant;
                                    const key = `${product.documentId}-${selectedVariant.documentId}`;
                                    initialQuantities[key] = 1;
                                } else {
                                    // If no variants are available, set quantity to 0
                                    initialQuantities[product.documentId] = 0;
                                }
                            }
                        } else {
                            // No variants, use product base quantity
                            initialQuantities[product.documentId] = 1;
                        }

                        initialSelectedOptions[product.documentId] = {
                            size: currentSize,
                            color: currentColor,
                            material: currentMaterial,
                        };
                        return product; // Return the modified product object
                    });

                    // Wait for all product processing (including nested variant fetches) to complete
                    const fetchedProducts = await Promise.all(fetchedProductsPromises);
                    setProducts(fetchedProducts); // Set state with the modified products
                    setQuantities(initialQuantities);
                    setSelectedOptions(initialSelectedOptions);

                } catch (err: any) {
                    setError(err.message);
                    console.error("Error fetching products by category:", err);
                } finally {
                    setLoading(false);
                }
            } else {
                setProducts([]);
                setQuantities({});
                setSelectedOptions({});
                setError(null);
            }
        };

        fetchProductsByCategory();
    }, [selectedCategory, STRAPI_URL]);

    // ---
    // Get product or variant details (price, stock, quantity, min_quantity, key)
    // ---
    const getProductOrVariantDetails = useCallback((product: Product) => {
        // Use the already fetched and flattened variants data directly, no .data
        const hasVariants = product.product_variants && product.product_variants.length > 0;
        const variantsData = hasVariants ? product.product_variants : [];

        let currentPrice = product.price; // Default to product's base price
        let currentStock = product.quantity; // Default to product's base quantity
        let currentMinimumQuantity = product.minimum_quantity; // Default to product's base minimum quantity
        let selectedVariantDocId: string | null = null;
        let selectedVariantName: string = '';
        let matchedVariant: ProductVariant | null = null;

        if (hasVariants) {
            const currentProductOptions = selectedOptions[product.documentId] || { size: null, color: null, material: null };

            // Find the variant that matches all selected options
            matchedVariant = variantsData.find((variant: ProductVariant) => {
                return (
                    (currentProductOptions.size === null || variant.size === currentProductOptions.size) &&
                    (currentProductOptions.color === null || variant.color === currentProductOptions.color) &&
                    (currentProductOptions.material === null || variant.material === currentProductOptions.material)
                );
            });

            if (matchedVariant) {
                currentPrice = matchedVariant.price !== undefined ? matchedVariant.price : product.price;
                currentStock = matchedVariant.quantity;
                currentMinimumQuantity = matchedVariant.minimum_quantity || product.minimum_quantity;
                selectedVariantDocId = matchedVariant.documentId;
                selectedVariantName = matchedVariant.name; // Use variant name if available
            } else {
                // If no exact match, try to find the first variant that matches available options
                const partiallyMatchedVariant = variantsData.find((variant: ProductVariant) => {
                    return (
                        (currentProductOptions.size === null || variant.size === currentProductOptions.size) &&
                        (currentProductOptions.color === null || variant.color === currentProductOptions.color)
                    );
                });
                if (partiallyMatchedVariant) {
                    currentPrice = partiallyMatchedVariant.price !== undefined ? partiallyMatchedVariant.price : product.price;
                    currentStock = partiallyMatchedVariant.quantity;
                    currentMinimumQuantity = partiallyMatchedVariant.minimum_quantity || product.minimum_quantity;
                    selectedVariantDocId = partiallyMatchedVariant.documentId;
                    selectedVariantName = partiallyMatchedVariant.name;
                }
            }
        }

        const key = selectedVariantDocId ? `${product.documentId}-${selectedVariantDocId}` : product.documentId;
        const currentQuantity = quantities[key] || 1; // La quantità è legata alla chiave specifica (prodotto o prodotto-variante)

        return { currentPrice, currentStock, currentQuantity, currentMinimumQuantity, key, selectedVariantDocId, selectedVariantName, matchedVariant };
    }, [quantities, selectedOptions]);


    // ---
    // Gestione della quantità del singolo prodotto/variante
    // ---
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
    const handleOptionChange = useCallback((productDocId: string, optionType: 'size' | 'color' | 'material', value: string) => {
        setSelectedOptions((prevSelected) => {
            const currentOptions = { ...prevSelected[productDocId] };

            // Reset subsequent options if a higher-level option changes
            if (optionType === 'size') {
                currentOptions.color = null;
                currentOptions.material = null;
            } else if (optionType === 'color') {
                currentOptions.material = null;
            }

            currentOptions[optionType] = value;
            return {
                ...prevSelected,
                [productDocId]: currentOptions,
            };
        });

        // Reset quantity to 1 for the new combination
        const product = products.find(p => p.documentId === productDocId);
        if (product) {
            const { key } = getProductOrVariantDetails(product); // Recalculate key based on new selection
            setQuantities(prev => ({ ...prev, [key]: 1 }));
        }
    }, [products, getProductOrVariantDetails]);


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

        // Determine if the item to add is a variant or a base product
        const isVariant = itemToAdd.variantDocId !== null && itemToAdd.hasVariant;

        const itemIndex = currentCart.findIndex(item =>
            item.productDocId === itemToAdd.productDocId &&
            (isVariant ? item.variantDocId === itemToAdd.variantDocId : true) // Match variantId only if it's a variant
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
        window.dispatchEvent(new Event('cartUpdated'));

        console.log("Carrello aggiornato nel cookie:", currentCart);
    };

    // ---
    // Aggiungi prodotto/variante al carrello (qui dovrai integrare con useCart in futuro)
    // ---
    const handleAddToCart = (product: Product) => {
        const { currentPrice, currentStock, currentQuantity, key, selectedVariantDocId, selectedVariantName, matchedVariant } = getProductOrVariantDetails(product);

        if (currentQuantity <= 0) {
            // Use a custom message box instead of alert()
            console.log("Seleziona una quantità valida.");
            return;
        }
        if (currentStock < currentQuantity) {
            console.log(`Siamo spiacenti, solo ${currentStock} disponibili per questa selezione.`);
            return;
        }

        // Check if product_variants exists and has items directly, not under .data
        const hasVariants = product.product_variants && product.product_variants.length > 0;
        const currentProductOptions = selectedOptions[product.documentId] || { size: null, color: null, material: null };

        // Check if all necessary options are selected for a product with variants
        if (hasVariants) {
            const uniqueSizes = getUniqueOptions(product.product_variants, 'size', {});
            const uniqueColors = getUniqueOptions(product.product_variants, 'color', { size: currentProductOptions.size });
            const uniqueMaterials = getUniqueOptions(product.product_variants, 'material', { size: currentProductOptions.size, color: currentProductOptions.color });

            if (uniqueSizes.length > 0 && currentProductOptions.size === null) {
                console.log("Per favore, seleziona una taglia.");
                return;
            }
            if (uniqueColors.length > 0 && currentProductOptions.color === null) {
                console.log("Per favore, seleziona un colore.");
                return;
            }
            if (uniqueMaterials.length > 0 && currentProductOptions.material === null) {
                console.log("Per favore, seleziona un materiale.");
                return;
            }
            if (!matchedVariant) {
                console.log("Nessuna variante esatta trovata per la tua selezione. Si prega di regolare le opzioni.");
                return;
            }
        }


        const itemToAdd = {
            productDocId: product.documentId,
            productName: product.name,
            hasVariant: hasVariants,
            variantDocId: selectedVariantDocId,
            variantName: selectedVariantName,
            price: currentPrice,
            quantity: currentQuantity,
            // Include selected options for clarity in cart
            selectedSize: currentProductOptions.size,
            selectedColor: currentProductOptions.color,
            selectedMaterial: currentProductOptions.material,
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
                Seleziona una categoria per visualizzare i prodotti.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-teal-800 text-white text-2xl w-full">
                Caricamento prodotti... ⏳
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-red-800 text-white text-2xl text-center p-4 w-full">
                Errore durante il caricamento dei prodotti: {error}. Riprova. 🚨
            </div>
        );
    }

    // ---
    // Renderizzazione dei prodotti
    // ---
    return (
        <div className="flex flex-col gap-y-8 items-center min-h-screen bg-teal-800 w-full p-4 rounded-md">
            <h2 className="text-center text-2xl font-bold text-white">Prodotti - {selectedCategory.label.toUpperCase()}</h2>
            {products.length === 0 && !loading && !error && (
                <p className="text-white text-lg w-full">Nessun prodotto trovato per questa categoria.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full min-w-full">
                {products.map((product: any) => {
                    // Check if product_variants exists and has items directly, not under .data
                    const hasVariants = product.product_variants && product.product_variants.length > 0;
                    // variantsData now directly contains the flattened variant objects
                    const variantsData = hasVariants ? product.product_variants : [];

                    const { currentPrice, currentStock, currentQuantity, currentMinimumQuantity, key, selectedVariantDocId, matchedVariant } = getProductOrVariantDetails(product);
                    const currentProductOptions = selectedOptions[product.documentId] || { size: null, color: null, material: null };

                    const availableSizes = hasVariants ? getUniqueOptions(variantsData, 'size', {}) : [];
                    const availableColors = hasVariants ? getUniqueOptions(variantsData, 'color', { size: currentProductOptions.size }) : [];
                    const availableMaterials = hasVariants ? getUniqueOptions(variantsData, 'material', { size: currentProductOptions.size, color: currentProductOptions.color }) : [];

                    // Determine if the "Add to Cart" button should be disabled
                    const isAddToCartDisabled = currentStock <= 0 || currentQuantity <= 0 || (hasVariants && !matchedVariant);

                    return (
                        <Card key={product.documentId} className="bg-teal-700 p-4 rounded-lg shadow-lg flex flex-col justify-between">
                            <div className="text-white">
                                <h3 className="font-semibold text-xl mb-2">{product.name}</h3>
                                {hasVariants && (
                                    <div className="mb-4 space-y-2">
                                        {/* Display product.peppe if it exists */}

                                        {/* Size Select */}
                                        {availableSizes.length > 0 && (
                                            <Select
                                                value={currentProductOptions.size || ''}
                                                onValueChange={(value) => handleOptionChange(product.documentId, 'size', value)}
                                                disabled={currentStock <= 0}
                                            >
                                                <SelectTrigger className="w-full bg-teal-600 text-white border-teal-500 focus:border-white">
                                                    <SelectValue placeholder="Select Size" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-teal-600 text-white">
                                                    {availableSizes.map((size: string) => (
                                                        <SelectItem key={size} value={size} className="hover:bg-teal-500">
                                                            Size: {size}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}

                                        {/* Color Select */}
                                        {availableColors.length > 0 && (
                                            <Select
                                                value={currentProductOptions.color || ''}
                                                onValueChange={(value) => handleOptionChange(product.documentId, 'color', value)}
                                                disabled={currentStock <= 0 || !currentProductOptions.size} // Disable if size not selected
                                            >
                                                <SelectTrigger className="w-full bg-teal-600 text-white border-teal-500 focus:border-white">
                                                    <SelectValue placeholder="Select Color" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-teal-600 text-white">
                                                    {availableColors.map((color: string) => (
                                                        <SelectItem key={color} value={color} className="hover:bg-teal-500">
                                                            Color: {color}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}

                                        {/* Material Select */}
                                        {availableMaterials.length > 0 && (
                                            <Select
                                                value={currentProductOptions.material || ''}
                                                onValueChange={(value) => handleOptionChange(product.documentId, 'material', value)}
                                                disabled={currentStock <= 0 || !currentProductOptions.size || !currentProductOptions.color} // Disable if size or color not selected
                                            >
                                                <SelectTrigger className="w-full bg-teal-600 text-white border-teal-500 focus:border-white">
                                                    <SelectValue placeholder="Select Material" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-teal-600 text-white">
                                                    {availableMaterials.map((material: string) => (
                                                        <SelectItem key={material} value={material} className="hover:bg-teal-500">
                                                            Material: {material}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                )}
                                <p className="text-md mb-1">Price: ${currentPrice !== undefined ? currentPrice.toFixed(2) : 'N/A'}</p>
                                <div className="flex items-center gap-2 mn-4">
                                    <p className="text-sm opacity-80">Available:</p>
                                    <p className={`text-sm opacity-80 ${currentStock > currentMinimumQuantity ? 'text-green-500' : 'text-yellow-500'}`}>{currentStock ?? 0}</p>
                                    <p className="text-sm opacity-80">pcs</p>
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
                                    disabled={isAddToCartDisabled}
                                >
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Add
                                </Button>
                            </div>
                            {currentStock <= 0 && (
                                <p className="text-red-300 text-sm text-center mt-2">Out of stock</p>
                            )}
                            {hasVariants && !matchedVariant && currentStock > 0 && (
                                <p className="text-yellow-300 text-sm text-center mt-2">Select all variant options.</p>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default ProductFetcher;
