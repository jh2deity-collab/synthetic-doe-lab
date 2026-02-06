import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const response = await fetch(`${BACKEND_URL}/arima`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { detail: errorText || 'ARIMA analysis failed' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('ARIMA API Error:', error);
        return NextResponse.json(
            { detail: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
