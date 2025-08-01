"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ColorPickerButtonProps {
    colors: { id: string; name: string; image: string }[];
    selectedColorId: string | null;
    onSelectColor: (colorId: string) => void;
    disabled?: boolean;
}

const STRAPI_URL = "https://jason-production.up.railway.app";

const ColorPickerButton: React.FC<ColorPickerButtonProps> = ({
    colors,
    selectedColorId,
    onSelectColor,
    disabled = false,
}) => {
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

    const handleColorClick = (colorId: string) => {
        onSelectColor(colorId);
        setIsColorPickerOpen(false); // Close the dialog after selection
    };

    const selectedColor = colors.find(color => color.id === selectedColorId);

    return (
        <Dialog open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
            <DialogTrigger asChild disabled={disabled}>
                <Button variant="outline" className="w-full justify-between pr-3">
                    {selectedColor ? (
                        <div className="flex items-center gap-2">
                            <div
                                className="w-5 h-5 rounded-full border"
                                // Fallback style if image doesn't load or isn't provided
                                style={{
                                    backgroundColor: selectedColor.name.toLowerCase().includes('http') ? 'transparent' : selectedColor.name.toLowerCase()
                                }}
                            >
                                {selectedColor.image && (
                                    <Image
                                        src={`${STRAPI_URL}${selectedColor.image}`}
                                        alt={selectedColor.name}
                                        width={20}
                                        height={20}
                                        className="rounded-full object-cover"
                                        onError={(e) => (e.currentTarget.style.backgroundColor = selectedColor.name.toLowerCase())} // Fallback to color name on error
                                    />
                                )}
                            </div>
                            <span className="font-normal text-muted-foreground">{selectedColor.name}</span>
                        </div>
                    ) : (
                        <span className="font-normal text-muted-foreground">Select Color</span>
                    )}
                    <span className="ml-auto">&#9662;</span> {/* Down arrow */}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Select a Color</DialogTitle>
                    <DialogDescription>
                        Choose the variant color from the options below.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-4 py-4 max-h-60 overflow-y-auto px-4">
                    {colors.length > 0 ? (
                        colors.map((color) => (
                            <div
                                key={color.id}
                                className={`flex flex-col items-center cursor-pointer p-2 rounded-md transition-colors hover:bg-gray-100
                                    ${selectedColorId === color.id ? 'ring-2 ring-teal-500 bg-teal-50' : ''}`}
                                onClick={() => handleColorClick(color.id)}
                            >
                                <div className="w-12 h-12 rounded-full border border-gray-300 overflow-hidden flex items-center justify-center">
                                    {color.image ? (
                                        <Image
                                            src={`${STRAPI_URL}${color.image}`}
                                            alt={color.name}
                                            width={48}
                                            height={48}
                                            className="rounded-full object-cover"
                                            onError={(e) => (e.currentTarget.style.backgroundColor = color.name.toLowerCase())} // Fallback to color name on error
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full"
                                            style={{ backgroundColor: color.name.toLowerCase() }} // Fallback if no image
                                        ></div>
                                    )}
                                </div>
                                <span className="mt-2 text-sm text-center font-normal">{color.name}</span>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-3 text-center text-gray-500">No colors available.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ColorPickerButton;