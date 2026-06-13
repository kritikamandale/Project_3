import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EventNest',
  description: 'Your invitation from EventNest',
};

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-pichwai-cream/60 via-white to-pichwai-cream/30">
      {children}
    </main>
  );
}
