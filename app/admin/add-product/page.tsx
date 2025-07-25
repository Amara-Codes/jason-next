"use client"; // Mark this component as a Client Component

import React, { useState, useEffect } from "react"; // Import useState and useEffect

// Import UI components from shadcn/ui
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
// 🚀 AddProduct Client Component
// ---
const AddProduct = () => {
    // Removed useToast initialization
    // const { toast } = useToast();

    // Form state management with useState
    const [productName, setProductName] = useState<string>("");
    const [price, setPrice] = useState<number>(0);
    const [description, setDescription] = useState<string>("");
    const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // State to store fetched data from Strapi
    const [genders, setGenders] = useState<{ id: string; label: string }[]>([]);
    const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    // ---
    // 🌍 Fetch data from Strapi on component mount
    // ---
    useEffect(() => {
        const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337/api";

        const fetchStrapiData = async () => {
            try {
                // Fetch Genders
                const gendersResponse = await fetch(`${STRAPI_URL}/genders`);
                if (!gendersResponse.ok) {
                    throw new Error(`Failed to fetch genders: ${gendersResponse.statusText}`);
                }
                const gendersData = await gendersResponse.json();
                const formattedGenders = gendersData.data.map((item: any) => ({
                    id: item.id.toString(),
                    label: item.name, // Adjust based on your Strapi version/schema
                }));
                setGenders(formattedGenders);

                // Fetch Categories
                const categoriesResponse = await fetch(`${STRAPI_URL}/categories`);
                if (!categoriesResponse.ok) {
                    throw new Error(`Failed to fetch categories: ${categoriesResponse.statusText}`);
                }
                const categoriesData = await categoriesResponse.json();
                const formattedCategories = categoriesData.data.map((item: any) => ({
                    id: item.id.toString(),
                    label: item.name, // Adjust based on your Strapi version/schema
                }));
                setCategories(formattedCategories);
            } catch (err: any) {
                setError(err.message);
                console.error("Error fetching data from Strapi:", err);
                // Using alert for error feedback
                alert(`Error fetching data: Could not load genders or categories. ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchStrapiData();
    }, []); // Empty dependency array means this effect runs once on mount

    // ---
    // 💾 Handle form submission
    // ---
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault(); // Prevent default form submission behavior
        setIsSubmitting(true); // Set loading state for submission

        const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337/api";

        const productData = {
            data: {
                name: productName,
                price: price,
                description: description,
                genders: selectedGenders,
                categories: selectedCategories,
            },
        };

        try {
            const response = await fetch(`${STRAPI_URL}/products`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // If your Strapi API requires authentication (e.g., a token),
                    // uncomment and replace `YOUR_STRAPI_API_TOKEN` with your actual token.
                    // "Authorization": `Bearer ${process.env.NEXT_PUBLIC_STRAPI_WRITE_TOKEN}`,
                },
                body: JSON.stringify(productData),
            });

            if (!response.ok) {
                const errorResponse = await response.json();
                console.error("Strapi API error:", errorResponse);
                throw new Error(
                    errorResponse.error?.message ||
                    `Failed to add product: ${response.statusText}`
                );
            }

            const result = await response.json();
            setIsDialogOpen(true);
            setProductName("");
            setPrice(0);
            setDescription("");
            setSelectedGenders([]);
            setSelectedCategories([]);
        } catch (submitError: any) {
            console.error("Error adding product:", submitError);
            // Using alert for error feedback
            alert(`Error Adding Product: ${submitError.message || "Something went wrong."}`);
        } finally {
            setIsSubmitting(false); // Reset loading state
        }
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
    };

    // Handle gender checkbox changes
    const handleGenderChange = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedGenders((prev) => [...prev, id]);
        } else {
            setSelectedGenders((prev) => prev.filter((genderId) => genderId !== id));
        }
    };

    // Handle category checkbox changes
    const handleCategoryChange = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedCategories((prev) => [...prev, id]);
        } else {
            setSelectedCategories((prev) => prev.filter((categoryId) => categoryId !== id));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-teal-800 text-white text-2xl">
                Loading genders and categories... ⏳
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
        <div className="flex flex-col gap-y-8 justify-center items-center min-h-screen bg-teal-800 p-4">
            <Card className="w-full max-w-xl mt-4">
                <CardContent className="pt-6">
                    {/* Simple HTML Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Product Name Field */}
                        <div>
                            <Label className="text-lg mb-4" htmlFor="productName">
                                Product Name
                            </Label>
                            <Input
                                id="productName"
                                placeholder="Product Name"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Base Price Field */}
                        <div>
                            <Label className="text-lg mb-4" htmlFor="price">
                                Base Price
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                placeholder="Price"
                                value={price === 0 ? "" : price}
                                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                                required
                            />
                        </div>

                        {/* Description Field */}
                        <div>
                            <Label className="text-lg mb-4" htmlFor="description">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Product description"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            {/* Gender Checkboxes */}
                            <div className="flex-1">
                                <Label className="text-lg">Gender</Label>
                                <p className="text-sm text-gray-500 mb-4">
                                    Select the applicable genders
                                </p>
                                <div className="space-y-2">
                                    {genders.map((item) => (
                                        <div key={item.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`gender-${item.id}`}
                                                checked={selectedGenders.includes(item.id)}
                                                onCheckedChange={(checked) =>
                                                    handleGenderChange(item.id, checked as boolean)
                                                }
                                            />
                                            <Label
                                                className="text-md font-normal"
                                                htmlFor={`gender-${item.id}`}
                                            >
                                                {item.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Categories Checkboxes */}
                            <div className="flex-1">
                                <Label className="text-lg">Categories</Label>
                                <p className="text-sm text-gray-500 mb-4">
                                    Select the applicable categories
                                </p>
                                <div className="space-y-2">
                                    {categories.map((item) => (
                                        <div key={item.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`category-${item.id}`}
                                                checked={selectedCategories.includes(item.id)}
                                                onCheckedChange={(checked) =>
                                                    handleCategoryChange(item.id, checked as boolean)
                                                }
                                            />
                                            <Label
                                                className="text-md font-normal"
                                                htmlFor={`category-${item.id}`}
                                            >
                                                {item.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Adding Product..." : "Add Product"} 🚀
                        </Button>
                    </form>
                </CardContent>
                <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Product Added! 🎉</AlertDialogTitle>
                            <AlertDialogDescription>
                                Your product has been successfully added. Don't forget to add variants next!
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={handleCloseDialog}>Cancel</AlertDialogCancel>
                            <AlertDialogAction>
                                <Link href="/add-variant" className="text-white hover:underline">
Add Variant
                                </Link>
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </Card>
        </div>
    );
};

export default AddProduct;