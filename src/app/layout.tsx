import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CricPredict AI | Cricket Match Winner Predictions',
  description: 'High-fidelity 3D analytics dashboard predicting cricket match winner outcomes using deterministic weighted multi-factor regression.',
  keywords: 'cricket prediction, match prediction, win probability, cricket analytics, T20 prediction, IPL predictions, 3D stadium',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <meta name="theme-color" content="#020617" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} bg-slate-950 text-slate-50 min-h-screen antialiased flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
