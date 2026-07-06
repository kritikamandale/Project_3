export default function VendorDashboardPage() {
  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-cinzel font-bold text-[#C9933A] drop-shadow-sm">Vendor Dashboard</h1>
      </div>
      
      <div className="rounded-[var(--radius-lg)] bg-[var(--card-bg)] border border-[var(--border-gold)] p-8 shadow-[var(--shadow-pichwai)]">
        <h2 className="text-xl font-cinzel font-semibold mb-4 text-[var(--foreground)]">Welcome to Milap</h2>
        <p className="text-base text-[var(--muted-fg)] leading-relaxed">
          Manage your vendor profile, view your bookings, and track your earnings all in one place.
        </p>
      </div>
    </div>
  );
}
