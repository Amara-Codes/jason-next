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
    const { documentId } = await request.json();

    if (!documentId) {
        return NextResponse.json({ error: 'Missing product document ID.' }, { status: 400 });
    }

    const cookieStore = cookies();
    const token = await (await cookieStore).get('jwt');

    try {
        const res = await fetch(`${STRAPI_URL}/product-variants/${documentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token.value}` } : {}),
            },
        });

   
        console.log(res)

        if (!res.ok) {
            throw await handleStrapiError(res, 'product');
        }

        return NextResponse.json({ message: 'Product deleted successfully.' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
