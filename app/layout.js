import './globals.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'SevenGhost | Wear Your Identity',
  description: 'Premium fashion e-commerce - Plain, Printed & Polo T-Shirts for Men & Women',
  keywords: 'fashion, t-shirts, polo, premium clothing, streetwear',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
