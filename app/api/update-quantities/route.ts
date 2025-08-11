import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

async function handleStrapiError(response: Response, entity: string) {
    const responseBody = await response.text();
    console.error(`Strapi responded with status ${response.status} for ${entity}:`, responseBody);
    
    let errorMessage = `Failed to process ${entity}. Status: ${response.status}`;
    try {
        const parsedError = JSON.parse(responseBody);
        errorMessage = parsedError.error?.message || JSON.stringify(parsedError);
    } catch (e) {
        errorMessage = responseBody.substring(0, 200) + '...'; 
    }
    return new Error(errorMessage);
}

export async function POST(request: NextRequest) {
  const token = (await cookies()).get('jwt')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Authentication token not found. Please log in.' }, { status: 401 });
  }

  try {
    const { productDocId, quantity, isVariant } = await request.json();

    if (!productDocId || isVariant === undefined || quantity === undefined) {
      return NextResponse.json({ message: 'Missing required data (productDocId, quantity, or isVariant).' }, { status: 400 });
    }
    
    if (typeof quantity !== 'number' || quantity <= 0) {
        return NextResponse.json({ message: 'Quantity must be a positive number.' }, { status: 400 });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const entityName = isVariant ? 'Product Variant' : 'Product';
    const endpoint = isVariant 
      ? `${STRAPI_URL}/product-variants/${productDocId}`
      : `${STRAPI_URL}/products/${productDocId}`;

    const getResponse = await fetch(endpoint, { headers });
    
    if (!getResponse.ok) {
        throw await handleStrapiError(getResponse, `GET ${entityName}`);
    }

    const itemData = await getResponse.json();
    const currentQuantity = itemData.data.quantity;

    if (currentQuantity < quantity) {
        return NextResponse.json(
            { message: `Quantity not available for ${entityName}. Requested: ${quantity}, Available: ${currentQuantity}.` }, 
            { status: 400 }
        );
    }

    const newQuantity = currentQuantity - quantity;
    const updateResponse = await fetch(endpoint, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
            data: {
                quantity: newQuantity,
            }
        })
    });

    if (!updateResponse.ok) {
        throw await handleStrapiError(updateResponse, `UPDATE ${entityName}`);
    }

    return NextResponse.json({ success: true, newQuantity: newQuantity });

  } catch (error) {
    if(error instanceof Error) {

      console.error('API Route Error:', error.message);
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : 'An internal server error occurred.' }, { status: 500 });
  }
}