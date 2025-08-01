"use client"; // Mark this component as a Client Component

import React, { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie"; // Importa js-cookie per gestire i cookie
// Importa i componenti UI necessari da shadcn/ui
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, ShoppingCart } from "lucide-react"; // Icone per quantità e carrello
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Import the new ColorPickerButton component
import ColorPickerButton from "@/components/color-picker-button";
import { is, se } from "date-fns/locale";
import { set } from "date-fns";
import { json } from "stream/consumers";

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

    const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
    const [addingProductDocId, setAddingProductDocId] = useState<string | null>(null);

    // Nuovo stato per tenere traccia della variante selezionata per ogni prodotto.
    const [selectedOptions, setSelectedOptions] = useState<{
        [productDocId: string]: {
            size: string | null;
            color: string | null;
            material: string | null;
        };
    }>({});

    // Nuovo stato per tutti i colori disponibili (per il ColorPickerButton)
    const [allColors, setAllColors] = useState<{ id: string; name: string; image: string }[]>([]);


    const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337/api";
    // Aggiunto per costruire correttamente gli URL delle immagini


    // --- Helper function to get unique options for a given key (size, color, material) ---
    const getUniqueOptions = useCallback((variants: ProductVariant[], key: 'size' | 'color' | 'material', filters: { size?: string | null, color?: string | null, material?: string | null }) => {
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
    }, []);

    // ---
    // 🌍 Fetch di TUTTI i colori disponibili (per il ColorPickerButton)
    // ---
    useEffect(() => {
        const fetchAllColors = async () => {
            try {
                // Popola l'immagine per i colori per ottenere l'URL della thumbnail
                const colorsResponse = await fetch(`${STRAPI_URL}/colors?populate=*`);
                if (!colorsResponse.ok) {
                    throw new Error(`Failed to fetch all colors: ${colorsResponse.statusText}`);
                }
                const colorsData = await colorsResponse.json();
                const formattedColors = colorsData.data.map((item: any) => ({
                    id: item.id.toString(),
                    name: item.name,
                    // Accedi all'URL dell'immagine tramite formats.thumbnail.url
                    image: item.image?.formats?.thumbnail?.url ?? ''
                }));
                setAllColors(formattedColors);
            } catch (err: any) {
                console.error("Error fetching all colors for picker:", err);
                // Non impostare l'errore globale qui, poiché i prodotti possono comunque essere caricati
            }
        };
        fetchAllColors();
    }, [STRAPI_URL]); // Dipendenze per fetchAllColors


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
                    // *** NON MODIFICATA LA TUA CHIAMATA FETCH ESISTENTE ***
                    const productsResponse = await fetch(`${STRAPI_URL}/products?filters[categories][id][$eq]=${selectedCategory.id}&populate=*`);
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

                    const fetchedProductsPromises = productsData.data.map(async (item: any) => {
                        const product = {
                            documentId: item.id, // Use 'id' from Strapi as documentId
                            ...item // Get all properties directly, no .attributes
                        };

                        let currentSize: string | null = null;
                        let currentColor: string | null = null;
                        let currentMaterial: string | null = null;

                        const hasVariants = product.product_variants && product.product_variants.length > 0;

                        if (hasVariants) {
                            // *** NON MODIFICATA LA TUA LOGICA DI FETCH VARIANTE ESISTENTE ***
                            const detailedVariantsPromises = product.product_variants.map(async (v: any) => {
                                try {
                                    const variantResponse = await fetch(`${STRAPI_URL}/product-variants/${v.documentId}?populate=*`);
                                    if (!variantResponse.ok) {
                                        console.error(`Failed to fetch detailed variant ${v.documentId}: ${variantResponse.statusText}`);
                                        return null;
                                    }
                                    const detailedVariantData = await variantResponse.json();
                                    const variantItem = detailedVariantData.data; // Access data directly, no .attributes

                                    return {
                                        documentId: variantItem.documentId,
                                        name: variantItem.name,
                                        price: variantItem.price,
                                        quantity: variantItem.quantity,
                                        minimum_quantity: variantItem.minimum_quantity,
                                        size: variantItem.size?.name || null,
                                        color: variantItem.color?.name || null, // Mantenuto come stringa (nome del colore)
                                        material: variantItem.material?.name || null,
                                        sizeDocumentId: variantItem.size?.documentId || null,
                                        colorDocumentId: variantItem.color?.documentId || null,
                                        materialDocumentId: variantItem.material?.documentId || null,
                                    };
                                } catch (variantFetchError) {
                                    console.error(`Error fetching detailed variant ${v.documentId}:`, variantFetchError);
                                    return null;
                                }
                            });

                            product.product_variants = (await Promise.all(detailedVariantsPromises)).filter(Boolean);

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

                            selectedVariant = variantsForInitialPop.find((v: ProductVariant) =>
                                (currentSize ? v.size === currentSize : true) &&
                                (currentColor ? v.color === currentColor : true) &&
                                (currentMaterial ? v.material === currentMaterial : true)
                            );

                            if (selectedVariant) {
                                const key = `${product.documentId}-${selectedVariant.documentId}`;
                                initialQuantities[key] = 1;
                            } else {
                                const firstAvailableVariant = variantsForInitialPop.find((v: ProductVariant) => v.quantity > 0);
                                if (firstAvailableVariant) {
                                    currentSize = firstAvailableVariant.size || null;
                                    currentColor = firstAvailableVariant.color || null;
                                    currentMaterial = firstAvailableVariant.material || null;
                                    selectedVariant = firstAvailableVariant;
                                    const key = `${product.documentId}-${selectedVariant.documentId}`;
                                    initialQuantities[key] = 1;
                                } else {
                                    initialQuantities[product.documentId] = 0;
                                }
                            }
                        } else {
                            initialQuantities[product.documentId] = 1;
                        }

                        initialSelectedOptions[product.documentId] = {
                            size: currentSize,
                            color: currentColor,
                            material: currentMaterial,
                        };
                        return product;
                    });

                    const fetchedProducts = await Promise.all(fetchedProductsPromises);

                    setProducts(fetchedProducts);
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
    }, [selectedCategory, STRAPI_URL, getUniqueOptions]); // Aggiunto getUniqueOptions alle dipendenze


    // ---
    // Get product or variant details (price, stock, quantity, min_quantity, key)
    // ---
    const getProductOrVariantDetails = useCallback((product: Product) => {
        const hasVariants = product.product_variants && product.product_variants.length > 0;
        const variantsData = hasVariants ? product.product_variants : [];

        let currentPrice = product.price;
        let currentStock = product.quantity;
        let currentMinimumQuantity = product.minimum_quantity;
        let selectedVariantDocId: string | null = null;
        let selectedVariantName: string = '';
        let matchedVariant: ProductVariant | null = null;
        // Aggiunto per passare l'oggetto colore completo al ColorPickerButton
        let selectedColorObject: { id: string; name: string; image: string } | null = null;


        if (hasVariants) {
            const currentProductOptions = selectedOptions[product.documentId] || { size: null, color: null, material: null };

            matchedVariant = variantsData.find((variant: ProductVariant) => {
                return (
                    (currentProductOptions.size === null || variant.size === currentProductOptions.size) &&
                    // La tua logica originale usa variant.color come stringa (nome)
                    (currentProductOptions.color === null || variant.color === currentProductOptions.color) &&
                    (currentProductOptions.material === null || variant.material === currentProductOptions.material)
                );
            });

            if (matchedVariant) {
                currentPrice = matchedVariant.price !== undefined ? matchedVariant.price : product.price;
                currentStock = matchedVariant.quantity;
                currentMinimumQuantity = matchedVariant.minimum_quantity || product.minimum_quantity;
                selectedVariantDocId = matchedVariant.documentId;
                selectedVariantName = matchedVariant.name;

                // Trova l'oggetto colore completo da allColors basandoti sul nome del colore della variante
                selectedColorObject = allColors.find(color => color.name === matchedVariant.color) || null;

            } else {
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
                    selectedColorObject = allColors.find(color => color.name === partiallyMatchedVariant.color) || null;
                }
            }
        }

        const key = selectedVariantDocId ? `${product.documentId}-${selectedVariantDocId}` : product.documentId;
        const currentQuantity = quantities[key] || 1;

        return { currentPrice, currentStock, currentQuantity, currentMinimumQuantity, key, selectedVariantDocId, selectedVariantName, matchedVariant, selectedColorObject };
    }, [quantities, selectedOptions, allColors]); // Aggiunto allColors alle dipendenze


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
        const product = products.find(p => p.documentId === productDocId);
        if (!product || !product.product_variants) return;
        const variants = product.product_variants;

        setSelectedOptions(prevSelected => {
            // Crea una copia dello stato per garantirne l'immutabilità
            const newSelectedOptions = { ...prevSelected };
            const currentOptions = { ...newSelectedOptions[productDocId] };

            // 1. Aggiorna l'opzione che l'utente ha modificato
            currentOptions[optionType] = value;

            // 2. Se è cambiata la TAGLIA, resetta e auto-seleziona colore e materiale
            if (optionType === 'size') {
                currentOptions.color = null;
                currentOptions.material = null;

                // Trova i colori disponibili per la nuova taglia
                const availableColors = getUniqueOptions(variants, 'color', { size: value });
                if (availableColors.length > 0) {
                    const newColor = availableColors[0]; // Auto-seleziona il primo colore
                    currentOptions.color = newColor;

                    // In base alla taglia e al nuovo colore, trova i materiali disponibili
                    const availableMaterials = getUniqueOptions(variants, 'material', { size: value, color: newColor });
                    if (availableMaterials.length > 0) {
                        currentOptions.material = availableMaterials[0]; // Auto-seleziona il primo materiale
                    }
                }
            }
            // 3. Se è cambiato il COLORE, resetta e auto-seleziona il materiale
            else if (optionType === 'color') {
                currentOptions.material = null;

                // Trova i materiali disponibili per la taglia e il nuovo colore
                const availableMaterials = getUniqueOptions(variants, 'material', { size: currentOptions.size, color: value });
                if (availableMaterials.length > 0) {
                    currentOptions.material = availableMaterials[0]; // Auto-seleziona il primo materiale
                }
            }

            // 4. Aggiorna lo stato del prodotto con le nuove opzioni
            newSelectedOptions[productDocId] = currentOptions;
            return newSelectedOptions;
        });

    }, [products, getUniqueOptions]);


    const updateCartCookie = (itemToAdd: any) => {
        console.log("Aggiornamento del carrello:", itemToAdd);
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
            console.log("Seleziona una quantità valida.");
            return;
        }
        if (currentStock < currentQuantity) {
            console.log(`Siamo spiacenti, solo ${currentStock} disponibili per questa selezione.`);
            return;
        }

        const hasVariants = product.product_variants && product.product_variants.length > 0;
        const currentProductOptions = selectedOptions[product.documentId] || { size: null, color: null, material: null };

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


        console.log(product, '========')
        setAddingProductDocId(product.documentId); // Imposta l'ID del prodotto in fase di aggiunta
        setIsAddingToCart(true)
     
        const itemToAdd = {
            productDocId: product.documentId,
            productName: product.name,
            hasVariant: hasVariants,
            variantDocId: selectedVariantDocId,
            variantName: selectedVariantName,
            productPrice: currentPrice,
            quantity: currentQuantity,
            selectedSize: currentProductOptions.size,
            selectedColor: currentProductOptions.color,
            selectedMaterial: currentProductOptions.material,
            sizeDocumentId: "",
            colorDocumentId: "",
            materialDocumentId: "",
            genderDocumentId: product.genders.map((e: any) => e.documentId).join(", ") || [],
        };
        console.log(product)
        if(hasVariants){
            const variant = product.product_variants.filter((e: any) => e.documentId === selectedVariantDocId)[0];
            itemToAdd.sizeDocumentId = variant.sizeDocumentId;
            itemToAdd.materialDocumentId = variant.materialDocumentId;
            itemToAdd.colorDocumentId = variant.colorDocumentId
        }

        console.log(itemToAdd)
        updateCartCookie(itemToAdd);
        setQuantities((prevQuantities) => ({
            ...prevQuantities,
            [key]: 1
        }));

        setTimeout(() => {
            setAddingProductDocId("");
            setIsAddingToCart(false);
          
        }, 1000);
    };

    // ---
    // Visualizzazione dello stato di caricamento/errore
    // ---
    if (!selectedCategory) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-teal-800 text-white text-xl text-center p-4 w-full">
                Choose a Category to view products.
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
                <p>Error loading products: {error}. Please try again. 🚨</p>
            </div>
        );
    }

    // ---
    // Renderizzazione dei prodotti
    // ---
    return (
        <div className="flex flex-col gap-y-8 items-center min-h-screen bg-teal-800 w-full p-4 rounded-md">
            <h2 className="text-center text-2xl font-bold text-white">{selectedCategory.label.toUpperCase()}</h2>
            {products.length === 0 && !loading && !error && (
                <p className="text-white text-lg w-full">No products found for this category.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full min-w-full">
                {products.map((product: any) => {
                    const hasVariants = product.product_variants && product.product_variants.length > 0;
                    const variantsData = hasVariants ? product.product_variants : [];

                    const { currentPrice, currentStock, currentQuantity, currentMinimumQuantity, key, selectedVariantDocId, matchedVariant, selectedColorObject } = getProductOrVariantDetails(product);
                    const currentProductOptions = selectedOptions[product.documentId] || { size: null, color: null, material: null };

                    const availableSizes = hasVariants ? getUniqueOptions(variantsData, 'size', {}) : [];
                    // Filtra `allColors` basandosi sui nomi dei colori disponibili per la variante corrente
                    const availableColorsForPicker = allColors.filter(globalColor =>
                        variantsData.some((variant: any) =>
                            variant.color === globalColor.name && // Confronta il nome del colore della variante con il nome del colore globale
                            (currentProductOptions.size === null || variant.size === currentProductOptions.size)
                        )
                    );
                    const availableMaterials = hasVariants ? getUniqueOptions(variantsData, 'material', { size: currentProductOptions.size, color: currentProductOptions.color }) : [];

                    const isAddToCartDisabled = currentStock <= 0 || currentQuantity <= 0 || (hasVariants && !matchedVariant) || currentProductOptions.size === null || currentProductOptions.color === null || currentProductOptions.material === null;

                    return (
                        <Card key={product.documentId} className="bg-teal-700 p-4 rounded-lg shadow-lg flex flex-col justify-between">
                            <div className="text-white">
                                <h3 className="font-semibold text-xl mb-2">{product.name}</h3>
                                {hasVariants && (
                                    <div className="mb-4 space-y-2">
                                        {availableSizes.length > 0 && (
                                            <Select
                                                value={currentProductOptions.size || ''}
                                                onValueChange={(value) => handleOptionChange(product.documentId, 'size', value)}
                                                disabled={currentStock <= 0}
                                            >
                                                <SelectTrigger className="w-full bg-teal-600 !text-white border-teal-500 focus:border-white">
                                                    <SelectValue placeholder="Select Size" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-teal-600 !text-white">
                                                    {availableSizes.map((size: string) => (
                                                        <SelectItem key={size} value={size} className="hover:bg-teal-500">
                                                            Size: {size}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}

                                        {/* Sostituzione del Select per il colore con ColorPickerButton */}
                                        {availableColorsForPicker.length > 0 && (
                                            <div>
                                                <Label className="text-lg mb-2 block">Color</Label>
                                                <ColorPickerButton
                                                    colors={availableColorsForPicker}
                                                    selectedColorId={selectedColorObject?.id || null}
                                                    onSelectColor={(colorId) => {
                                                        const selectedColor = allColors.find(c => c.id === colorId);
                                                        // Passa il nome del colore a handleOptionChange, come richiesto dalla tua logica esistente
                                                        handleOptionChange(product.documentId, 'color', selectedColor?.name || '');
                                                    }}
                                                    disabled={currentStock <= 0 || !currentProductOptions.size}
                                                />
                                            </div>
                                        )}

                                        {availableMaterials.length > 0 && (



                                            <Select
                                                value={currentProductOptions.material || ''}
                                                onValueChange={(value) => handleOptionChange(product.documentId, 'material', value)}
                                                disabled={currentStock <= 0 || !currentProductOptions.size || !currentProductOptions.color}
                                            >
                                                <SelectTrigger className="w-full bg-teal-600 !text-white border-teal-500 focus:border-white">
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
                            {currentStock <= 0 && (
                                <p className="text-red-300 text-sm text-center mt-2">Out of stock</p>
                            )}
                            {hasVariants && !matchedVariant && currentStock > 0 && (
                                <p className="text-yellow-300 text-sm text-center mt-2">Select all variant options.</p>
                            )}
                            <div className="flex items-center justify-between gap-2 mt-auto flex-wrap">
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
                                    className="flex-1 ml-0 lg:ml-4 bg-emerald-900 text-white hover:bg-emerald-700 mt-8 lg:mt-0"
                                    disabled={isAddToCartDisabled || (isAddingToCart && addingProductDocId == product.documentId)}
                                >
                               
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    {isAddingToCart && addingProductDocId === product.documentId ? 'Adding...' : 'Add to Cart'}
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default ProductFetcher;