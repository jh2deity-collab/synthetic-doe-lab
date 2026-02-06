import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    return proxyRequest(request, params.path, 'GET');
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    return proxyRequest(request, params.path, 'POST');
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    return proxyRequest(request, params.path, 'PUT');
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    return proxyRequest(request, params.path, 'DELETE');
}

async function proxyRequest(
    request: NextRequest,
    pathSegments: string[],
    method: string
) {
    try {
        const path = pathSegments.join('/');
        const url = `${BACKEND_URL}/${path}`;

        console.log(`[API Proxy] ${method} ${url}`);

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        let body: string | undefined;
        let requestData: any = undefined;

        if (method !== 'GET' && method !== 'DELETE') {
            try {
                requestData = await request.json();
                body = JSON.stringify(requestData);
                console.log(`[API Proxy] Request body:`, requestData);
            } catch (e) {
                console.error(`[API Proxy] Failed to parse request body:`, e);
            }
        }

        const response = await fetch(url, {
            method,
            headers,
            body,
        });

        console.log(`[API Proxy] Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API Proxy] Error response:`, errorText);
            return NextResponse.json(
                { detail: errorText || `Request to ${path} failed` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API Proxy] Exception:', error);
        return NextResponse.json(
            { detail: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
