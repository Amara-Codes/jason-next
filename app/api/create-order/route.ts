// src/app/api/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// Helper function to handle potential errors from Strapi
async function handleStrapiError(response: Response, entity: string) {
    const responseBody = await response.text();
    console.error(`Strapi responded with status ${response.status} for ${entity}:`, responseBody);
    
    let errorMessage = `Failed to create ${entity}. Status: ${response.status}`;
    try {
        const parsedError = JSON.parse(responseBody);
        // Access nested error details from Strapi's default error structure
        errorMessage = parsedError.error?.message || JSON.stringify(parsedError);
    } catch (e) {
        // If parsing fails, the response was likely not JSON (e.g., HTML error page)
        errorMessage = responseBody.substring(0, 200) + '...'; // Truncate for readability
    }
    return new Error(errorMessage);
}

export async function POST(request: NextRequest) {
  // Correctly get the cookie store and the token value
  const token = (await cookies()).get('jwt')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Authentication token not found. Please log in.' }, { status: 401 });
  }

  try {
    // Destructure all necessary fields from the client request
    const { cartItems, customerEmail, paymentMethod, total, subtotal, appliedDiscount, operator } = await request.json();

    if (!cartItems || cartItems.length === 0 || !operator || !customerEmail) {
      return NextResponse.json({ message: 'Missing required order data (cart, operator, or email).' }, { status: 400 });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // --- STEP 1: Create all OrderItems ---
    const orderItemPromises = cartItems.map((item: any) => {
      // The payload for each order item, wrapped in a 'data' object
      const orderItemPayload = {
        data: {
          productDocId: item.productDocId,
          quantity: item.quantity,
          productPrice: item.productPrice,
          orderItemPrice: item.productPrice * item.quantity,
          categoryDocId: item.categoryDocumentId || null,
          materialDocId: item.materialDocumentId || null,
          colorDocId: item.colorDocumentId || null,
          sizeDocId: item.sizeDocumentId || null,
          genderDocId: item.genderDocumentId || null,
        }
      };
      
      // *** THE FIX: Added /api/ to the URL ***
      return fetch(`${STRAPI_URL}/order-items`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(orderItemPayload),
      }).then(async res => {
        if (!res.ok) {
            // Use the robust error handler
            throw await handleStrapiError(res, 'OrderItem');
        }
        return res.json();
      });
    });

    const createdOrderItems = await Promise.all(orderItemPromises);
    // Extract the IDs from the successfully created items
    const createdOrderItemIds = createdOrderItems.map(item => item.data.documentId);

    // --- STEP 2: Create the final Order and link the OrderItems ---
    const orderPayload = {
        data: {
            orderStatus: 'completed',
            totalAmount: total,
            subtotalBeforeTaxes: subtotal,
            taxAmount: 0, // Assuming no tax for now
            discountAmount: appliedDiscount,
            paymentMethod: paymentMethod,
            operatorName: operator.username,
            customerEmail: customerEmail,
            notes: 'Order created via JASON FE checkout.',
            // This is the relation field, linking to the items created in Step 1
            order_items: createdOrderItemIds,
        }
    };

    console.log(orderPayload)
    // *** THE FIX: Added /api/ to the URL ***
    const orderResponse = await fetch(`${STRAPI_URL}/orders`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
        throw await handleStrapiError(orderResponse, 'Order');
    }

    const finalOrder = await orderResponse.json();

    // --- SUCCESS ---
    return NextResponse.json({ success: true, order: finalOrder.data });

  } catch (error: any) {
    // This will catch errors from both the fetch calls and any other issues
    console.error('API Route Error:', error.message);
    return NextResponse.json({ message: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}