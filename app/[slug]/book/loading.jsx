export default function Loading() {
  return (
    <div className="min-h-dvh w-full bg-white flex items-center justify-center">
      <div className="relative overflow-hidden">
        <span className="text-[#141414] text-2xl font-medium tracking-[0.18em] lowercase">
          acme reserve
        </span>

        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>
    </div>
  );
}