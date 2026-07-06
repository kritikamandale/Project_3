export default function VendorEarningsPage() {
  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-cinzel font-bold text-[#E8C06B] drop-shadow-sm">Earnings</h1>
      </div>
      
      <div className="rounded-3xl bg-black/20 backdrop-blur-xl border border-[#C9933A]/30 p-8 shadow-lg">
        <h2 className="text-xl font-cinzel font-semibold mb-4 text-[#D4AF37]">Your Earnings</h2>
        <p className="text-base text-[#D4AF37]/80 leading-relaxed">
          Track your earnings, view transaction history, and manage your payouts.
        </p>
      </div>
    </div>
  );
}
