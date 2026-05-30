export default function Loading() {
  return (
    <main className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A] select-none font-sans">
      <div
        className="flex flex-col items-center gap-6 animate-pulse"
        style={{ animationDuration: "2000ms" }}
      >

        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#EB0A1E"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[84px] h-auto"
          aria-label="Loading Toyota Portal"
        >
          {/* Outer oval */}
          <path d="M12 12m-10 0a10 7 0 1 0 20 0a10 7 0 1 0 -20 0" />
          {/* Vertical oval */}
          <path d="M9 12c0 3.866 1.343 7 3 7s3 -3.134 3 -7s-1.343 -7 -3 -7s-3 3.134 -3 7z" />
          {/* Horizontal oval */}
          <path d="M6.415 6.191c-.888 .503 -1.415 1.13 -1.415 1.809c0 1.657 3.134 3 7 3s7 -1.343 7 -3c0 -.678 -.525 -1.304 -1.41 -1.806" />
        </svg>

        <div className="text-center">
          <p className="font-sans font-bold text-[11px] text-[#767676] uppercase tracking-widest leading-none">
            Initializing Portal
          </p>
          <p className="font-sans font-normal text-[12px] text-gray-500 mt-2">
            Nippon Toyota
          </p>
        </div>

      </div>
    </main>
  );
}
