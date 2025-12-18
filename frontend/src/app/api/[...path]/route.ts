import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://127.0.0.1:8000';

async function handleRequest(request: NextRequest, method: string, params: { path: string[] }) {
    try {
        let pathString = params.path.join('/');
        // Django requires trailing slash
        if (!pathString.endsWith('/')) {
            pathString += '/';
        }
        const url = `${BACKEND_URL}/api/${pathString}${request.nextUrl.search}`;

        console.log(`[PROXY ${method}] ${url}`);

        // Get the original content type
        const contentType = request.headers.get('Content-Type') || 'application/json';
        const isMultipart = contentType.includes('multipart/form-data');

        // Build headers - don't set Content-Type for multipart (let fetch handle boundary)
        const headers: HeadersInit = {};

        if (!isMultipart) {
            headers['Content-Type'] = 'application/json';
        }

        const authHeader = request.headers.get('Authorization');
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        const options: RequestInit = {
            method,
            headers,
        };

        // Add body for POST, PUT, PATCH
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            try {
                if (isMultipart) {
                    // For multipart/form-data, get the raw body and pass the content-type with boundary
                    const formData = await request.formData();

                    // Create a new FormData to send to the backend
                    const backendFormData = new FormData();

                    // Iterate over the original form data entries
                    for (const [key, value] of formData.entries()) {
                        if (value instanceof File) {
                            // For files, append with the original file name
                            backendFormData.append(key, value, value.name);
                        } else {
                            backendFormData.append(key, value);
                        }
                    }

                    options.body = backendFormData;
                    console.log(`[PROXY ${method} FormData] Sending multipart data`);
                } else {
                    const body = await request.text();
                    console.log(`[PROXY ${method} Body]`, body.substring(0, 300));
                    options.body = body;
                }
            } catch (e) {
                console.error(`[PROXY ${method} Body Error]`, e);
            }
        }

        console.log(`[PROXY ${method} Fetching...]`);
        const response = await fetch(url, options);
        console.log(`[PROXY ${method} Response]`, response.status, response.statusText);

        const text = await response.text();
        console.log(`[PROXY ${method} Response Body]`, text.substring(0, 300));

        if (response.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        try {
            const data = JSON.parse(text);
            return NextResponse.json(data, { status: response.status });
        } catch {
            return NextResponse.json({ error: text }, { status: response.status });
        }
    } catch (error) {
        console.error(`[PROXY ${method} Error]`, error);
        console.error(`[PROXY ${method} Error Stack]`, error instanceof Error ? error.stack : 'No stack');
        return NextResponse.json(
            {
                error: 'Proxy error',
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    return handleRequest(request, 'GET', params);
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    return handleRequest(request, 'POST', params);
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    return handleRequest(request, 'PUT', params);
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    return handleRequest(request, 'PATCH', params);
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    return handleRequest(request, 'DELETE', params);
}
