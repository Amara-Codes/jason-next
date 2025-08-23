"use client"; // Mark this component as a Client Component

import React, { useState, useEffect, useRef, useCallback } from "react"; // Import useState, useEffect, useRef, and useCallback

// Import UI components from shadcn/ui
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Trash2 } from "lucide-react";
import { min } from "date-fns";

// Assuming you have an icon library like lucide-react installed
// import { PencilIcon } from 'lucide-react';

// You might need to adjust the path based on your project structure
// import Link from "next/link"; // Not directly used in this refactor, but kept for context

// ---
// 🚀 Search Client Component
// ---
const Search = () => {
    // Product data states
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Variant options states (materials, sizes, colors)
    const [materials, setMaterials] = useState<{ id: string; label: string }[]>([]);
    const [sizes, setSizes] = useState<{ id: string; label: string }[]>([]);
    const [colors, setColors] = useState<{ id: string; label: string }[]>([]);

    // Selected variant options for the currently edited variant
    const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
    const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
    const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

    // Pagination states
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);

    // UI states
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Modals states
    const [isEditProductModalOpen, setIsEditProductModalOpen] = useState<boolean>(false);
    const [productToEdit, setProductToEdit] = useState<any>(null);
    const [isVariantsModalOpen, setIsVariantsModalOpen] = useState<boolean>(false);
    const [variantsOfProduct, setVariantsOfProduct] = useState<any[]>([]);
    const [isEditVariantModalOpen, setIsEditVariantModalOpen] = useState<boolean>(false);
    const [variantToEdit, setVariantToEdit] = useState<any>(null);
    const [isDeleteProductModalOpen, setIsDeleteProductModalOpen] = useState<boolean>(false);
    const [productToDelete, setProductToDelete] = useState<any>(null);
    const [isDeleteVariantModalOpen, setIsDeleteVariantModalOpen] = useState<boolean>(false);
    const [variantToDelete, setVariantToDelete] = useState<any>(null);

    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState<boolean>(false);
    const [successDialogTitle, setSuccessDialogTitle] = useState<string>("");
    const [successDialogDescription, setSuccessDialogDescription] = useState<string>("");

    const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337/api";
    const STRAPI_API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;
    const PRODUCTS_PER_PAGE = 10; // Define how many products to fetch per page

    // Observer for infinite scroll
    const observer = useRef<IntersectionObserver | null>(null);
    const lastProductElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    // ---
    // 🌍 Fetch initial data (categories) from Strapi on component mount
    // ---
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const categoriesResponse = await fetch(`${STRAPI_URL}/categories`, {
                    headers: {
                    },
                });
                if (!categoriesResponse.ok) {
                    throw new Error(`Failed to fetch categories: ${categoriesResponse.statusText}`);
                }
                const categoriesData = await categoriesResponse.json();
                const formattedCategories = categoriesData.data.map((item: any) => ({
                    id: item.id.toString(),
                    label: item.name, // Assuming 'name' is the attribute for category name
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
    }, [STRAPI_URL, STRAPI_API_TOKEN]);

    // ---
    // 🛍️ Fetch products when page or selectedCategory changes
    // ---
    useEffect(() => {
        const fetchProducts = async () => {
            setLoadingMore(true);
            try {
                // Modified URL for deep population: populate product_variants and all their direct relations
                let url = `${STRAPI_URL}/products?pagination[page]=${page}&pagination[pageSize]=${PRODUCTS_PER_PAGE}&populate[product_variants][populate]=*`;

                if (selectedCategory) {
                    url += `&filters[categories][id][$eq]=${selectedCategory}`;
                }

                const productsResponse = await fetch(url, {
                    headers: {
                    },
                });

                if (!productsResponse.ok) {
                    throw new Error(`Failed to fetch products: ${productsResponse.statusText}`);
                }
                const productsData = await productsResponse.json();

                const newProducts = productsData.data.map((item: any) => ({
                    id: item.id,
                    ...item,
                    // Map product variants and their populated
                    product_variants: item.product_variants.map((variant: any) => ({
                        id: variant.id,
                        // Flatten variant for easier access
                        ...variant,
                        // Access nested populated data (e.g., material name from material object)
                        material: variant.material ? { id: variant.material.id.toString(), name: variant.material.name } : null,
                        size: variant.size ? { id: variant.size.id.toString(), name: variant.size.name } : null,
                        color: variant.color ? { id: variant.color.id.toString(), name: variant.color.name } : null,
                    }))
                }));

                setProducts(prevProducts => [...prevProducts, ...newProducts]);
                setHasMore(productsData.meta.pagination.page < productsData.meta.pagination.pageCount);

            } catch (err: any) {
                setError(err.message);
                console.error("Error fetching products:", err);
                alert(`Error fetching products: ${err.message}`);
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        };

        fetchProducts();
    }, [page, selectedCategory, STRAPI_URL, STRAPI_API_TOKEN]); // Re-fetch when page or category changes

    // ---
    // 🌍 Fetch variant options (materials, sizes, colors) on component mount
    // ---
    useEffect(() => {
        const fetchVariantOptions = async () => {
            setLoading(true);
            try {
                const fetchOptions = async (endpoint: string) => {
                    const response = await fetch(`${STRAPI_URL}/${endpoint}`, {
                        headers: {

                        },
                    });
                    if (!response.ok) throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
                    const data = await response.json();
                    return data.data.map((item: any) => ({ id: item.id.toString(), label: item.name }));
                };

                const [materialsData, sizesData, colorsData] = await Promise.all([
                    fetchOptions("materials"),
                    fetchOptions("sizes"),
                    fetchOptions("colors"),
                ]);

                setMaterials(materialsData);
                setSizes(sizesData);
                setColors(colorsData);

            } catch (err: any) {
                setError(err.message);
                console.error("Error fetching variant options:", err);
                alert(`Error fetching variant options: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchVariantOptions();
    }, [STRAPI_URL, STRAPI_API_TOKEN]); // Dependencies for fetching options

    // ---
    // 💡 Handle category change
    // ---
    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategory(categoryId === "all" ? null : categoryId);
        setProducts([]); // Clear products when category changes
        setPage(1); // Reset page to 1
        setHasMore(true); // Assume there's more data for the new category
    };

    // ---
    // ✏️ Handle Edit Product Click
    // ---
    const handleEditProductClick = (product: any) => {
        setProductToEdit(product);
        setIsEditProductModalOpen(true);
    };

    // ---
    // 💾 Handle Product Update
    // ---
    const handleProductUpdate = async () => {
        if (!productToEdit) return;

        setLoading(true);
        try {
            const response = await fetch(`${STRAPI_URL}/products/${productToEdit.documentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: { name: productToEdit.name, description: productToEdit.description } }), // Example fields
            });

            if (!response.ok) {
                throw new Error(`Failed to update product: ${response.statusText}`);
            }

            // Update the product in the local state
            setProducts(prevProducts =>
                prevProducts.map(p => (p.id === productToEdit.id ? { ...p, name: productToEdit.name, description: productToEdit.description } : p))
            );
            setIsEditProductModalOpen(false);
            setSuccessDialogTitle("Product Updated Successfully");
            setSuccessDialogDescription(`Product "${productToEdit.name}" has been updated successfully.`);
            setIsSuccessDialogOpen(true);
            setProductToEdit(null);
        } catch (err: any) {
            setError(err.message);
            console.error("Error updating product:", err);
            alert(`Error updating product: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ---
    // 📦 Handle Show Variants Click
    // ---
    const handleShowVariantsClick = (product: any) => {
        setVariantsOfProduct(product.product_variants || []);
        setIsVariantsModalOpen(true);
    };

    // ---
    // 🔄 Handle Edit Variant Click (from inside variants modal)
    // ---
    const handleEditVariantClick = (variant: any) => {
        setVariantToEdit(variant);
        // Set initial selected IDs for the select components
        setSelectedMaterialId(variant.material?.id || null);
        setSelectedSizeId(variant.size?.id || null);
        setSelectedColorId(variant.color?.id || null);
        setIsEditVariantModalOpen(true);
    };

    const handleDeleteProductClick = (product: any) => {
        setProductToDelete(product);
        setIsDeleteProductModalOpen(true);
    };

    const handleDeleteVariantClick = (variant: any) => {
        setVariantToDelete(variant);
        setIsDeleteVariantModalOpen(true);
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;

        setLoading(true);
        try {
            const response = await fetch('/api/delete-product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ documentId: productToDelete.documentId })
            });

            if (!response.ok) {
                throw new Error(`Failed to delete product: ${response.statusText}`);
            }

            setProducts(prevProducts => prevProducts.filter(p => p.documentId !== productToDelete.documentId));
            setIsDeleteProductModalOpen(false);
            setSuccessDialogTitle("Product Deleted Successfully");
            setSuccessDialogDescription(`Product "${productToDelete.name}" has been deleted.`);
            setIsSuccessDialogOpen(true);
            setProductToDelete(null);
        } catch (err: any) {
            setError(err.message);
            console.error("Error deleting product:", err);
            alert(`Error deleting product: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteVariant = async () => {
        if (!variantToDelete) return;

        setLoading(true);
        try {
            const response = await fetch('/api/delete-variant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ documentId: variantToDelete.documentId })
            });

            if (!response.ok) {
                throw new Error(`Failed to delete variant: ${response.statusText}`);
            }

            setVariantsOfProduct(prevVariants => prevVariants.filter(v => v.documentId !== variantToDelete.documentId));
            setIsDeleteVariantModalOpen(false);
            setSuccessDialogTitle("Variant Deleted Successfully");
            setSuccessDialogDescription(`Variant "${variantToDelete.name}" has been deleted.`);
            setIsSuccessDialogOpen(true);
            setVariantToDelete(null);
        } catch (err: any) {
            setError(err.message);
            console.error("Error deleting variant:", err);
            alert(`Error deleting variant: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ---
    // 💾 Handle Variant Update
    // ---
    const handleVariantUpdate = async () => {
        if (!variantToEdit) return;

        setLoading(true);
        try {
            const response = await fetch(`${STRAPI_URL}/product-variants/${variantToEdit.documentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: {
                        name: variantToEdit.name,
                        price: variantToEdit.price,
                        quantity: variantToEdit.quantity,
                        // Send only the ID for relations
                        material: selectedMaterialId,
                        size: selectedSizeId,
                        color: selectedColorId,
                        minimum_quantity: variantToEdit.minimum_quantity,
                        jah_quantity: variantToEdit.jah_quantity,
                        noik_quantity: variantToEdit.noik_quantity,
                    }
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update variant: ${response.statusText}`);
            }

            // Update the variant in the local state (nested within products)
            // We need to re-fetch the product to get the updated nested relation names
            // For simplicity, we'll trigger a full product list refresh for now.
            // A more optimized approach would be to update the specific variant in the state with new data.
            setProducts([]); // Clear current products to force a re-fetch from page 1
            setPage(1);
            setHasMore(true);

            setIsEditVariantModalOpen(false);
            setIsVariantsModalOpen(false);
            setSuccessDialogTitle("Variant Updated Successfully");
            setSuccessDialogDescription(`Variant "${variantToEdit.name}" has been updated successfully.`);
            setIsSuccessDialogOpen(true);
            setVariantToEdit(null);
            setSelectedMaterialId(null);
            setSelectedSizeId(null);
            setSelectedColorId(null);
            window.location.reload(); // Reload the page to reflect changes in the product list
        } catch (err: any) {
            setError(err.message);
            console.error("Error updating variant:", err);
            alert(`Error updating variant: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };


    if (loading && products.length === 0) {
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
            <h2 className="text-center text-3xl font-bold text-white mb-4">Search Products</h2>

            {/* Category Filter */}
            <div className="w-full max-w-md">
                <Label htmlFor="category-select" className="text-white text-lg mb-2 block">Filter by Category:</Label>
                <Select onValueChange={handleCategoryChange} value={selectedCategory || "all"}>
                    <SelectTrigger id="category-select" className="w-full bg-white">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Product List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
                {products.map((product, index) => {
                    if (products.length === index + 1) {
                        // Attach the ref to the last element for infinite scroll
                        return (
                            <Card key={product.id} ref={lastProductElementRef} className="bg-white text-gray-800 shadow-lg relative pt-0 min-h-[320px]">
                                <CardContent className="p-4 flex flex-col justify-between h-full">
                                    <div className="flex justify-end mb-8">

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditProductClick(product)}
                                            className="text-gray-600 hover:text-blue-600"
                                        >
                                            {/* <PencilIcon className="h-5 w-5" /> */}
                                            ✏️ Edit
                                        </Button>

                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProductClick} className="text-gray-600 hover:text-red-600">
                                            <Trash2 className="h-5 w-5" />
                                            `</Button>
                                    </div>
                                    <div className="flex mb-2">
                                        <h3 className="text-xl font-semibold uppercase">{product.name}</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                                    <Button
                                        onClick={() => handleShowVariantsClick(product)}
                                        className="mt-auto bg-teal-600 hover:bg-teal-700 text-white"
                                    >
                                        Show Variants
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    } else {
                        return (
                            <Card key={product.id} className="bg-white text-gray-800 shadow-lg relative pt-0 min-h-[320px]">
                                <CardContent className="p-4 flex flex-col justify-between h-full">
                                    <div className="flex justify-end mb-8">

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditProductClick(product)}
                                            className="text-gray-600 hover:text-teal-600"
                                        >
                                            {/* <PencilIcon className="h-5 w-5" /> */}
                                            ✏️ Edit
                                        </Button>

                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProductClick(product)} className="text-red-600 hover:text-red-800">
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <div className="flex mb-2">
                                        <h3 className="text-xl font-semibold uppercase">{product.name}</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                                    <Button
                                        onClick={() => handleShowVariantsClick(product)}
                                        className="mt-auto bg-teal-600 hover:bg-teal-700 text-white"
                                    >
                                        Show Variants
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    }
                })}
            </div>

            {loadingMore && (
                <div className="text-white text-lg mt-4">
                    Loading more products... ✨
                </div>
            )}

            {!hasMore && products.length > 0 && (
                <div className="text-white text-lg mt-4">
                    You've seen all products! 🎉
                </div>
            )}

            {/* Edit Product Modal */}
            <AlertDialog open={isEditProductModalOpen} onOpenChange={setIsEditProductModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Edit Product</AlertDialogTitle>
                        <AlertDialogDescription>
                            Make changes to the product details here.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {productToEdit && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={productToEdit.name}
                                    onChange={(e) => setProductToEdit({ ...productToEdit, name: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">
                                    Description
                                </Label>
                                <Input
                                    id="description"
                                    value={productToEdit.description || ""}
                                    onChange={(e) => setProductToEdit({ ...productToEdit, description: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            {/* Add other product fields as needed */}
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsEditProductModalOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleProductUpdate}>Save Changes</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Show Variants Modal */}
            <AlertDialog open={isVariantsModalOpen} onOpenChange={setIsVariantsModalOpen}>
                <AlertDialogContent className="max-h-[80vh] overflow-y-auto"> {/* Added max-h and overflow for scrollable content */}
                    <AlertDialogHeader>
                        <AlertDialogTitle>Product Variants</AlertDialogTitle>
                        <AlertDialogDescription>
                            View and manage variants for this product.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        {variantsOfProduct.length > 0 ? (
                            variantsOfProduct.map((variant) => (
                                <Card key={variant.id} className="bg-gray-50 p-3 shadow-sm">
                                    <CardContent className="p-0 flex flex-col">
                                        <p><strong>Name:</strong> {variant.name}</p>
                                        <p><strong>Price:</strong> ${variant.price?.toFixed(2)}</p>
                                        <p><strong>Quantity:</strong> {variant.quantity}</p>
                                        <p><strong>Min Quantity:</strong> {variant.minimum_quantity}</p>
                                        <p><strong>Stock Quantity at Jah:</strong> {variant.jah_quantity}</p>
                                        <p><strong>Stock Quantity at Shop 676:</strong> {variant.noik_quantity}</p>
                                        <p><strong>Material:</strong> {variant.material?.name || 'N/A'}</p>
                                        <p><strong>Size:</strong> {variant.size?.name || 'N/A'}</p>
                                        <p><strong>Color:</strong> {variant.color?.name || 'N/A'}</p>
                                        <div className="flex gap-x-2 justify-end">

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditVariantClick(variant)}
                                                className="mt-2  text-teal-600 hover:text-teal-700 border-teal-600 hover:border-teal-700"
                                            >
                                                Edit Variant
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2  text-red-600 hover:text-red-700"
                                                onClick={() => handleDeleteVariantClick(variant)}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <p>No variants found for this product.</p>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setIsVariantsModalOpen(false)}>Close</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Variant Modal */}
            <AlertDialog open={isEditVariantModalOpen} onOpenChange={setIsEditVariantModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Edit Product Variant</AlertDialogTitle>
                        <AlertDialogDescription>
                            Adjust the details for this specific variant.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {variantToEdit && (
                        <>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="variant-name" className="text-right">
                                        Name
                                    </Label>
                                    <Input
                                        id="variant-name"
                                        value={variantToEdit.name}
                                        onChange={(e) => setVariantToEdit({ ...variantToEdit, name: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="variant-price" className="text-right">
                                        Price
                                    </Label>
                                    <Input
                                        id="variant-price"
                                        type="number"
                                        value={variantToEdit.price}
                                        onChange={(e) => setVariantToEdit({ ...variantToEdit, price: parseFloat(e.target.value) || 0 })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="variant-quantity" className="text-right">
                                        Quantity
                                    </Label>
                                    <Input
                                        id="variant-quantity"
                                        type="number"
                                        value={variantToEdit.quantity}
                                        onChange={(e) => setVariantToEdit({ ...variantToEdit, quantity: parseInt(e.target.value) || 0 })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="variant-min-stock" className="text-right">
                                        Min Quantity
                                    </Label>
                                    <Input
                                        id="variant-min-stock"
                                        type="number"
                                        value={variantToEdit.minimum_quantity}
                                        onChange={(e) => setVariantToEdit({ ...variantToEdit, minimum_quantity: parseInt(e.target.value) || 0 })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="variant-jah-stock" className="text-right">
                                        Jah Quantity
                                    </Label>
                                    <Input
                                        id="variant-jah-stock"
                                        type="number"
                                        value={variantToEdit.jah_quantity}
                                        onChange={(e) => setVariantToEdit({ ...variantToEdit, jah_quantity: parseInt(e.target.value) || 0 })}
                                        className="col-span-3"
                                    />
                                </div>

                                             <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="variant-noik-stock" className="text-right">
                                        676 Quantity
                                    </Label>
                                    <Input
                                        id="variant-noik-stock"
                                        type="number"
                                        value={variantToEdit.noik_quantity}
                                        onChange={(e) => setVariantToEdit({ ...variantToEdit, noik_quantity: parseInt(e.target.value) || 0 })}
                                        className="col-span-3"
                                    />
                                </div>


                                {/* Size Select */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="variant-size" className="text-right col-span-1">Size</Label>
                                    <Select
                                        value={variantToEdit.size?.id || ""}
                                        onValueChange={(value) => {
                                            setSelectedSizeId(value);
                                            // Optionally update variantToEdit's size object if needed for display before saving
                                            const selectedSize = sizes.find(s => s.id === value);
                                            setVariantToEdit({ ...variantToEdit, size: selectedSize ? { id: selectedSize.id, name: selectedSize.label } : null });
                                        }}
                                    >
                                        <SelectTrigger id="variant-size" className="col-span-3 w-full">
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
                                {/* Color Select */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="variant-color" className="text-right">Color</Label>
                                    <Select
                                        value={variantToEdit.color?.id || ""}
                                        onValueChange={(value) => {
                                            setSelectedColorId(value);
                                            const selectedColor = colors.find(c => c.id === value);
                                            setVariantToEdit({ ...variantToEdit, color: selectedColor ? { id: selectedColor.id, name: selectedColor.label } : null });
                                        }}
                                    >
                                        <SelectTrigger id="variant-color" className="col-span-3 w-full">
                                            <SelectValue placeholder="Select Color" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {colors.map((color) => (
                                                <SelectItem key={color.id} value={color.id}>
                                                    {color.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Material Select */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="variant-material" className="text-right">Material</Label>
                                    <Select
                                        value={variantToEdit.material?.id || ""}
                                        onValueChange={(value) => {
                                            setSelectedMaterialId(value);
                                            const selectedMaterial = materials.find(m => m.id === value);
                                            setVariantToEdit({ ...variantToEdit, material: selectedMaterial ? { id: selectedMaterial.id, name: selectedMaterial.label } : null });
                                        }}
                                    >
                                        <SelectTrigger id="variant-material" className="col-span-3 w-full">
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
                                {/* Add other variant fields as needed */}
                            </div>
                        </>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsEditVariantModalOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleVariantUpdate}>Save Changes</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{successDialogTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{successDialogDescription}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        {isSuccessDialogOpen ? (
                            <AlertDialogAction onClick={() => setIsSuccessDialogOpen(false)}>
                                Done
                            </AlertDialogAction>
                        ) : (
                            <AlertDialogCancel onClick={() => setIsSuccessDialogOpen(false)}>
                                Close
                            </AlertDialogCancel>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteProductModalOpen} onOpenChange={setIsDeleteProductModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete

                            <strong> {productToDelete?.name.toUpperCase()}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteProductModalOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProduct}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={isDeleteVariantModalOpen} onOpenChange={setIsDeleteVariantModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Variant</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the variant
                            <strong> {variantToDelete?.name.toUpperCase()}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteVariantModalOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteVariant}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Search;
