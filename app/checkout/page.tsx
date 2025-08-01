"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { CreditCard, DollarSign, X, QrCodeIcon, Landmark } from 'lucide-react';
import PublicHeader from '@/components/public-header';

// --- Type Definitions ---
type CartItem = any; // Using 'any' as it is in your code

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export default function CheckoutPage() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [customerEmail, setCustomerEmail] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('qr');

    // Discount States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [discountInput, setDiscountInput] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(0);

    // Operator States
    const [operator, setOperator] = useState<any | null>(null);
    const [isOperatorLoading, setIsOperatorLoading] = useState(true);

    // --- NEW: State to handle submission ---
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();

    // Load Cart Data from Cookie
    useEffect(() => {
        const cartCookie = Cookies.get('cart');
        if (cartCookie) {
            try {
                const parsedCart = JSON.parse(cartCookie);
                if (parsedCart.length > 0) {
                    setCartItems(parsedCart);
                } else {
                    router.push('/');
                }
            } catch (error) {
                console.error("Failed to parse cart cookie:", error);
                Cookies.remove('cart');
                router.push('/');
            }
        } else {
            router.push('/');
        }
        setLoading(false);
    }, [router]);

    // Fetch logged-in operator data
    useEffect(() => {
        const fetchOperator = async () => {
            try {
                // IMPORTANT: Assumes your /api/info endpoint returns the authenticated user's data
                // and handles authentication (e.g., via HTTP-only cookies).
                const response = await fetch(`/api/info`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    throw new Error('Operator not authenticated.');
                }
                const data: any = await response.json();
                setOperator(data);
            } catch (error) {
                console.error("Error retrieving operator data:", error);
            } finally {
                setIsOperatorLoading(false);
            }
        };
        fetchOperator();
    }, []);

    // --- Calculations ---
    const subtotal = useMemo(() =>
        cartItems.reduce((acc, item) => acc + item.productPrice * item.quantity, 0),
        [cartItems]
    );

    const total = useMemo(() => {
        const finalTotal = subtotal - appliedDiscount;
        return finalTotal > 0 ? finalTotal : 0;
    }, [subtotal, appliedDiscount]);

    // --- Event Handlers ---
    const handleApplyDiscount = () => {
        const discountValue = parseFloat(discountInput);
        if (!isNaN(discountValue) && discountValue > 0) {
            setAppliedDiscount(Math.min(discountValue, subtotal));
        }
        setIsModalOpen(false);
        setDiscountInput('');
    };

    // --- MODIFIED: handlePayment function to create order in Strapi ---
 const handlePayment = async () => {
    if (!customerEmail || cartItems.length === 0 || !operator) {
        alert("Please fill in the customer email. An operator must be logged in.");
        return;
    }

    setIsSubmitting(true);

    try {
        // Prepare the payload for your own API route
        const payload = {
            cartItems,
            customerEmail,
            paymentMethod,
            total,
            subtotal,
            appliedDiscount,
            operator, // Send operator info to the backend
        };


        console.log('prima di chimare api interna:', payload)
        // Call your own Next.js API route. The browser will send the HttpOnly cookie automatically.
        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create order.');
        }

        // SUCCESS: Clear cart and redirect
        alert('Order created successfully!');
        Cookies.remove('cart');
        router.push('/'); // Redirect to homepage or a success page

    } catch (error: any) {
        console.error('An error occurred during payment processing:', error);
        alert(`Error: ${error.message}`);
    } finally {
        setIsSubmitting(false);
    }
};

    if (loading || isOperatorLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-xl text-gray-700">Loading...</p>
            </div>
        );
    }

    return (
        <>
            <div className="w-full min-h-screen font-inter bg-gray-50">
                <PublicHeader />

                {operator ? (
                    <div className="bg-teal-100 text-teal-800 text-center p-2 text-sm">
                        Checkout managed by logged operator: {operator.username} (ID: {operator.id})
                    </div>
                ) : (
                    <div className="bg-yellow-100 text-yellow-800 text-center p-2 text-sm">
                        <strong>Warning:</strong> No operator logged in. You cannot complete the checkout.
                    </div>
                )}

                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">Checkout</h1>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Customer & Payment Details */}
                        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md">
                            <div className="mb-8">
                                <label htmlFor="email" className="block text-lg font-semibold text-gray-700 mb-2">
                                    Customer Email
                                </label>
                                <input
                                    type="email" id="email" value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    placeholder="your@example.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    required
                                />
                            </div>
                            {/* Payment Method Section (unchanged) */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-700 mb-4">Payment Method</h2>
                                <div className="space-y-4">
                                    <div onClick={() => setPaymentMethod('card')} className={`p-4 border rounded-md cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-teal-500 ring-2 ring-teal-500' : 'border-gray-300'}`}>
                                        <input type="radio" id="card" name="payment" value="card" checked={paymentMethod === 'card'} className="hidden" readOnly />
                                        <label htmlFor="card" className="flex items-center cursor-pointer"><CreditCard className="mr-3 text-gray-600" /> <span className="font-medium">Credit Card</span></label>
                                    </div>
                                    <div onClick={() => setPaymentMethod('cash')} className={`p-4 border rounded-md cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-teal-500 ring-2 ring-teal-500' : 'border-gray-300'}`}>
                                        <input type="radio" id="cash" name="payment" value="cash" checked={paymentMethod === 'cash'} className="hidden" readOnly />
                                        <label htmlFor="cash" className="flex items-center cursor-pointer"><DollarSign className="mr-3 text-gray-600" /> <span className="font-medium">Cash</span></label>
                                    </div>
                                    <div onClick={() => setPaymentMethod('qr')} className={`p-4 border rounded-md cursor-pointer transition-all ${paymentMethod === 'qr' ? 'border-teal-500 ring-2 ring-teal-500' : 'border-gray-300'}`}>
                                        <input type="radio" id="qr" name="payment" value="qr" checked={paymentMethod === 'qr'} className="hidden" readOnly />
                                        <label htmlFor="qr" className="flex items-center cursor-pointer"><QrCodeIcon className="mr-3 text-gray-600" /> <span className="font-medium">QR</span></label>
                                    </div>
                                    <div onClick={() => setPaymentMethod('transfer')} className={`p-4 border rounded-md cursor-pointer transition-all ${paymentMethod === 'transfer' ? 'border-teal-500 ring-2 ring-teal-500' : 'border-gray-300'}`}>
                                        <input type="radio" id="transfer" name="payment" value="transfer" checked={paymentMethod === 'transfer'} className="hidden" readOnly />
                                        <label htmlFor="transfer" className="flex items-center cursor-pointer"><Landmark className="mr-3 text-gray-600" /> <span className="font-medium">Bank Transfer</span></label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Order Summary */}
                        <div className="bg-white p-8 rounded-lg shadow-md h-full flex flex-col">
                            <h2 className="text-2xl font-bold text-gray-800 border-b-2 pb-4 mb-4">Order Summary</h2>
                            <div className="space-y-3 mb-6">
                                {cartItems.map(item => (
                                    <div key={item.variantDocId ? `${item.productDocId}-${item.variantDocId}` : item.productDocId} className="flex justify-between text-gray-600">
                                        <span>{item.productName} <span className="text-sm text-teal-600">x{item.quantity}</span></span>
                                        <span className="font-medium">${(item.productPrice * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 space-y-3 grow">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={() => setIsModalOpen(true)} className="text-teal-600 hover:underline text-sm">Apply Discount</button>
                                    {appliedDiscount > 0 && (
                                        <span className="font-semibold text-teal-600 ps-4">-${appliedDiscount.toFixed(2)}</span>
                                    )}
                                </div>
                                <div className="flex justify-between text-xl font-bold text-gray-800 border-t pt-4 mt-4">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={isSubmitting || !operator} // Disable button while submitting or if no operator
                                className="w-full mt-8 bg-teal-600 text-white py-3 rounded-md text-lg font-semibold hover:bg-teal-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Processing...' : 'Pay Now'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Discount Modal (unchanged) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-teal-900 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"><X size={24} /></button>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Apply Discount</h3>
                        <p className="text-sm text-gray-600 mb-4">Enter a fixed amount in dollars to discount from the total.</p>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="number" value={discountInput} onChange={(e) => setDiscountInput(e.target.value)}
                                placeholder="e.g., 10.00"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                        <button
                            onClick={handleApplyDiscount}
                            className="w-full mt-6 bg-teal-600 text-white py-3 rounded-md font-semibold hover:bg-teal-700 transition"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}