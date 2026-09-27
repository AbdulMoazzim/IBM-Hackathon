import './globals.css';

export const metadata = {
  title: 'VibeGuard',
  description: 'VibeGuard Security Scanner',
  icons: {
    icon: '/vibeguard-mark.svg',
    shortcut: '/vibeguard-mark.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="dark">{children}</body>
    </html>
  );
}
