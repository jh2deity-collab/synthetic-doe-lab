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

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        let body: string | undefined;
        if (method !== 'GET' && method !== 'DELETE') {
            try {
                const json = await request.json();
                body = JSON.stringify(json);
            } catch {
                // No body or invalid JSON
            }
        }

        const response = await fetch(url, {
            method,
            headers,
            body,
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { detail: errorText || `Request to ${path} failed` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('API Proxy Error:', error);
        return NextResponse.json(
            { detail: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
