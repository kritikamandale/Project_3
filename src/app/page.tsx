import { PublicNavbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import PublicPage from './(public)/page';

export default function RootPage() {
  return (
    <>
      <PublicNavbar />
      <main className="flex-1">
        <PublicPage />
      </main>
      <Footer />
    </>
  );
}
