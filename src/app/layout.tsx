import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Speedy Nexus',
  description: 'Website to help people find early nexus appointments',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-primary-background-color">
      <head>
        {/* Place any meta tags, title, or external links here */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <title>{metadata.title?.toString() ?? 'Default Title'}</title>
        <meta name="description" content={metadata.description ?? ''} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`size-full ${inter.className} bg-primary-background-color`}>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}