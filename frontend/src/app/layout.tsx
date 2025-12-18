'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState } from 'react';
import { ThemeProvider } from '@/hooks/useTheme';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <html lang="es" suppressHydrationWarning>
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-screen antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
                <ThemeProvider>
                    <QueryClientProvider client={queryClient}>
                        {children}
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                style: {
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                    boxShadow: '0 4px 12px rgba(9, 30, 66, 0.15)',
                                },
                            }}
                        />
                    </QueryClientProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
