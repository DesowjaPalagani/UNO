import React from 'react';
import '../styles/globals.css';

export const metadata = {
  title: 'UNO Game Platform',
  description: 'Play UNO online with friends',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
