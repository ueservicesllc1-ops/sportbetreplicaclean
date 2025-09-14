import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'SportBet Replica',
  description: 'A replica of SportBet.ec',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
        <Script
          src="https://www.paypal.com/sdk/js?client-id=BAAExruK8cItNiwKuvePmimHr0cyBLKPF8iJMrEaRU4a5Wnze3zTukViknzWV2Y_NKHEXj-8P-ortO2JqQ&components=hosted-buttons&enable-funding=venmo&currency=USD"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
