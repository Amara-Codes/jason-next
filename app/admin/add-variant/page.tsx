"use client"; // Mark this component as a Client Component

import React, { useState, useEffect } from "react"; // Import useState and useEffect

// Import UI components from shadcn/ui
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ColorPickerButton from "@/components/color-picker-button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import Link from "next/link";
// Removed useToast import
// import { useToast } from "@/components/ui/use-toast";

// ---
// 🚀 AddProductVariant Client Component
// ---
const AddProductVariant = () => {
    // Variant form state
    const [variantName, setVariantName] = useState<string>("");
    const [variantPrice, setVariantPrice] = useState<number>(0);
    const [variantQuantity, setVariantQuantity] = useState<number>(0);
    const [variantMinimumQuantity, setVariantMinimumQuantity] = useState<number>(5);

    // Variant options states (materials, sizes, colors)
    const [materials, setMaterials] = useState<{ id: string; label: string }[]>([]);
    const [sizes, setSizes] = useState<{ id: string; label: string }[]>([]);
    const [colors, setColors] = useState<{ id: string; name: string; image: string }[]>([]);

    // Selected variant options
    const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
    const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
    const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

    // Initial data (categories) & product selection states
    const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    // UI states
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [dialogTitle, setDialogTitle] = useState<string>("");
    const [dialogDescription, setDialogDescription] = useState<string>("");
    const [isSuccessDialog, setIsSuccessDialog] = useState<boolean>(false);

    const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337/api";
    const STRAPI_API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;


    // ---
    // 🌍 Fetch initial data (categories) from Strapi on component mount
    // ---
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const categoriesResponse = await fetch(`${STRAPI_URL}/categories`);
                if (!categoriesResponse.ok) {
                    throw new Error(`Failed to fetch categories: ${categoriesResponse.statusText}`);
                }
                const categoriesData = await categoriesResponse.json();
                const formattedCategories = categoriesData.data.map((item: any) => ({
                    id: item.id.toString(),
                    label: item.name,
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
    // 🛍️ Fetch products when a category is selected
    // ---
    useEffect(() => {
        const fetchProductsByCategory = async () => {
            if (selectedCategory) {
                setLoading(true);
                setProducts([]);
                setSelectedProduct(null);
                try {
                    const productsResponse = await fetch(`${STRAPI_URL}/products?filters[categories][id][$eq]=${selectedCategory}&populate=product_variants`); // Populate product_variants for later use
                    if (!productsResponse.ok) {
                        throw new Error(`Failed to fetch products: ${productsResponse.statusText}`);
                    }
                    const productsData = await productsResponse.json();
                    setProducts(productsData.data.map((item: any) => ({
                        id: item.id,
                        ...item
                    })));
                } catch (err: any) {
                    setError(err.message);
                    console.error("Error fetching products by category:", err);
                    alert(`Error fetching products for category: ${err.message}`);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchProductsByCategory();
    }, [selectedCategory]);

    // ---
    // 🎨 Fetch variant options (materials, sizes, colors)
    // ---
    useEffect(() => {
        const fetchVariantOptions = async () => {
            setLoading(true);
            try {
                const [materialsRes, sizesRes, colorsRes] = await Promise.all([
                    fetch(`${STRAPI_URL}/materials`),
                    fetch(`${STRAPI_URL}/sizes`),
                    fetch(`${STRAPI_URL}/colors?populate=*`),
                ]);

                if (!materialsRes.ok) throw new Error(`Failed to fetch materials: ${materialsRes.statusText}`);
                if (!sizesRes.ok) throw new Error(`Failed to fetch sizes: ${sizesRes.statusText}`);
                if (!colorsRes.ok) throw new Error(`Failed to fetch colors: ${colorsRes.statusText}`);

                const materialsData = await materialsRes.json();
                const sizesData = await sizesRes.json();
                const colorsData = await colorsRes.json();

                console.log(colorsData.data.map((i: any)=>({color: JSON.stringify(i.image.formats.thumbnail.url)}))); // Debugging: Log the colors data to check structure


                setMaterials(materialsData.data.map((item: any) => ({ id: item.id.toString(), label: item.name })));
                setSizes(sizesData.data.map((item: any) => ({ id: item.id.toString(), label: item.name })));
                setColors(colorsData.data.map((item: any) => ({ id: item.id.toString(), name: item.name, image: item.image?.formats?.thumbnail?.url ?? "" }))); // Ensure image URL is set correctly

            } catch (err: any) {
                setError(err.message);
                console.error("Error fetching variant options:", err);
                alert(`Error fetching variant options: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchVariantOptions();
    }, []);

    // ---
    // 💡 Handle category click
    // ---
    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategory(categoryId);
    };

    // ---
    // 📋 Handle product click
    // ---
    const handleProductClick = (product: any) => {
        setSelectedProduct(product);
    };

    // ---
    // 🚀 Handle Product Variant Submission (Two-step process)
    // ---
    const handleSubmitVariant = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!selectedProduct) {
            setDialogTitle("Error!");
            setDialogDescription("Please select a product first.");
            setIsSuccessDialog(false);
            setIsDialogOpen(true);
            setIsSubmitting(false);
            return;
        }

        if (!selectedMaterialId || !selectedSizeId || !selectedColorId) {
            setDialogTitle("Error!");
            setDialogDescription("Please select all variant (Material, Size, Color).");
            setIsSuccessDialog(false);
            setIsDialogOpen(true);
            setIsSubmitting(false);
            return;
        }

        try {
            // STEP 1: Create the Product Variant without linking to product initially
            const createVariantResponse = await fetch(`${STRAPI_URL}/product-variants`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(STRAPI_API_TOKEN && { Authorization: `Bearer ${STRAPI_API_TOKEN}` }),
                },
                body: JSON.stringify({
                    data: {
                        name: variantName,
                        price: variantPrice,
                        quantity: variantQuantity,
                        minimum_quantity: variantMinimumQuantity,
                        material: selectedMaterialId,
                        size: selectedSizeId,
                        color: selectedColorId,
                        // DO NOT include 'product' here initially
                    },
                }),
            });

            if (!createVariantResponse.ok) {
                const errorData = await createVariantResponse.json();
                throw new Error(`Failed to create product variant: ${errorData.error?.message || createVariantResponse.statusText}`);
            }

            const newVariant = await createVariantResponse.json();
            const newVariantId = newVariant.data.id; // Get the ID of the newly created variant

            // STEP 2: Update the Product to add the new variant to its product_variants relation
            // First, get the current product variants linked to the selected product
            // We need to fetch the product again to ensure we have the latest list of variants.
            // Even though we populate `product_variants` on initial fetch, another user might have added one.
            const currentProductResponse = await fetch(`${STRAPI_URL}/products/${selectedProduct.documentId}?populate=product_variants`);
            if (!currentProductResponse.ok) {
                throw new Error(`Failed to fetch current product data: ${currentProductResponse.statusText}`);
            }
            const currentProductData = await currentProductResponse.json();
            const existingVariantIds = currentProductData.data.product_variants.map((variant: any) => variant.id);

            // Add the new variant ID to the list of existing variant IDs
            const updatedVariantIds = [...existingVariantIds, newVariantId];

            const updateProductResponse = await fetch(`${STRAPI_URL}/products/${selectedProduct.documentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(STRAPI_API_TOKEN && { Authorization: `Bearer ${STRAPI_API_TOKEN}` }),
                },
                body: JSON.stringify({
                    data: {
                        product_variants: updatedVariantIds, // Use the correct relation field name (likely 'product_variants')
                    },
                }),
            });

            if (!updateProductResponse.ok) {
                const errorData = await updateProductResponse.json();
                throw new Error(`Failed to link variant to product: ${errorData.error?.message || updateProductResponse.statusText}`);
            }

      
            setDialogTitle("Product Variant Added & Linked! 🎉");
            setDialogDescription(`Variant "${variantName}" has been successfully added and linked to "${selectedProduct.name}".`);
            setIsSuccessDialog(true);
            setIsDialogOpen(true);

            // Reset form fields after successful submission
            setVariantName("");
            setVariantPrice(0);
            setVariantQuantity(0);
            setVariantMinimumQuantity(5);
            setSelectedMaterialId(null);
            setSelectedSizeId(null);
            setSelectedColorId(null);

            // Optionally, re-fetch products for the current category to update the UI
            // This would ensure the selected product now shows the new variant
            // if you expand your UI to list product variants.
            // You might trigger fetchProductsByCategory() here.

        } catch (err: any) {
            console.error("Error submitting product variant:", err);
            setDialogTitle("Submission Error! 😢");
            setDialogDescription(`There was an error adding the product variant: ${err.message}`);
            setIsSuccessDialog(false);
            setIsDialogOpen(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && (!categories.length || (selectedCategory && !products.length) || !materials.length || !sizes.length || !colors.length)) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-teal-800 text-white text-2xl">
                Loading data... ⏳
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-red-800 text-white text-2xl text-center p-4">
                Error: {error}. Please ensure your Strapi server is running and permissions are set correctly. 🚨
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-y-8 items-center min-h-screen bg-teal-800 p-4">
            <h2 className="text-center text-3xl font-bold text-white mb-4">Add Product Variant</h2>

            <h2 className="text-center text-2xl font-bold text-white">Select the Product Category</h2>
            <div className="flex w-full max-w-4xl gap-4 flex-wrap justify-center">
                {categories.map((item) => (
                    <div
                        key={item.id}
                        className={`bg-emerald-900 p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-700 transition-colors
                            ${selectedCategory === item.id ? 'ring-4 ring-white' : ''}`}
                        onClick={() => handleCategoryClick(item.id)}
                    >
                        <p className="text-center text-white font-bold">{item.label}</p>
                    </div>
                ))}
            </div>

            {selectedCategory && (
                <>
                    <h2 className="text-center text-2xl font-bold text-white mt-8">Select a Product</h2>
                    <Card className="w-full max-w-6xl p-4">
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {loading && selectedCategory ? (
                                <p className="text-center text-lg col-span-full">Loading products... ⏳</p>
                            ) : products.length > 0 ? (
                                products.map((product) => (
                                    <div
                                        key={product.id}
                                        className={`border p-4 rounded-lg cursor-pointer hover:shadow-lg transition-shadow
                                            ${selectedProduct && selectedProduct.id === product.id ? 'border-2 border-teal-500 bg-teal-50' : 'bg-white'}`}
                                        onClick={() => handleProductClick(product)}
                                    >
                                        <h3 className="font-semibold text-lg">{product.name}</h3>
                                        <p className="text-gray-600">${product.price}</p>
                                        <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-lg col-span-full">No products found for this category.</p>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {selectedProduct && (
                <div className="w-full max-w-6xl p-4 bg-teal-900 rounded-lg text-white">
                    <div className="my-8 ps-2 text-white">
                        <h3 className="text-xl font-bold mb-4">Selected Product for Variant Creation:</h3>
                        <div className="flex items-baseline mb-2">
                            <span className="text-lg font-medium">Product Name:</span>
                            <span className="text-sm ps-2">{selectedProduct.name}</span>
                        </div>
                        <div className="flex items-baseline mb-4">
                            <span className="text-lg font-medium">Product Price:</span>
                            <span className="text-sm ps-2">${selectedProduct.price}</span>
                        </div>
                    </div>

                    <Card className="w-full max-w-6xl mt-4">
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmitVariant} className="space-y-6">
                                <div>
                                    <Label className="text-lg mb-2 block" htmlFor="variantName">
                                        Variant Name
                                    </Label>
                                    <Input
                                        id="variantName"
                                        placeholder="e.g., Linen Shirt - L - White"
                                        value={variantName}
                                        onChange={(e) => setVariantName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label className="text-lg mb-2 block" htmlFor="variantPrice">
                                        Variant Price
                                    </Label>
                                    <Input
                                        id="variantPrice"
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g., 30.00"
                                        value={variantPrice === 0 ? "" : variantPrice}
                                        onChange={(e) => setVariantPrice(parseFloat(e.target.value) || 0)}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label className="text-lg mb-2 block" htmlFor="variantQuantity">
                                        Variant Quantity
                                    </Label>
                                    <Input
                                        id="variantQuantity"
                                        type="number"
                                        placeholder="e.g., 100"
                                        value={variantQuantity === 0 ? "" : variantQuantity}
                                        onChange={(e) => setVariantQuantity(parseInt(e.target.value) || 0)}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label className="text-lg mb-2 block" htmlFor="variantMinimumQuantity">
                                        Variant Minimum Quantity
                                    </Label>
                                    <Input
                                        id="variantMinimumQuantity"
                                        type="number"
                                        placeholder="e.g., 5"
                                        value={variantMinimumQuantity === 0 ? "" : variantMinimumQuantity}
                                        onChange={(e) => setVariantMinimumQuantity(parseInt(e.target.value) || 0)}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1">
                                        <Label className="text-lg mb-2 block">Size</Label>
                                        <Select value={selectedSizeId || ""} onValueChange={setSelectedSizeId}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Size" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sizes.map((size) => (
                                                    <SelectItem key={size.id} value={size.id}>
                                                        {size.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex-1">
                                  <Label className="text-lg mb-2 block">Color</Label>
                                        {/* Use the new ColorPickerButton here */}
                                        <ColorPickerButton
                                            colors={colors}
                                            selectedColorId={selectedColorId}
                                            onSelectColor={setSelectedColorId}
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <Label className="text-lg mb-2 block">Material</Label>
                                        <Select value={selectedMaterialId || ""} onValueChange={setSelectedMaterialId}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Material" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {materials.map((material) => (
                                                    <SelectItem key={material.id} value={material.id}>
                                                        {material.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? "Adding Variant..." : "Add Variant"} 🚀
                                </Button>
                            </form>
                        </CardContent>
                        <AlertDialog open={isDialogOpen} onOpenChange={(setIsDialogOpen)}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
                                    <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    {isSuccessDialog ? (
                                        <AlertDialogAction onClick={() =>{
                                             setIsDialogOpen(false);
                                                window.location.reload()
                                        }}>
                                            Done
                                        </AlertDialogAction>
                                    ) : (
                                        <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>
                                            Close
                                        </AlertDialogCancel>
                                    )}
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AddProductVariant;