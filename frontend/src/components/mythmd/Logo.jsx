export default function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} data-testid="mythmd-logo">
      <div
        aria-hidden="true"
        className="relative grid h-9 w-9 place-items-center rounded-xl"
        style={{
          background: "linear-gradient(135deg, #86CB92 0%, #71B48D 55%, #404E7C 100%)",
          boxShadow: "0 6px 18px rgba(64, 78, 124, 0.22)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2.5l8 3.5v6.2c0 4.8-3.4 8.6-8 9.3-4.6-.7-8-4.5-8-9.3V6l8-3.5z"
            fill="white"
            fillOpacity="0.15"
            stroke="white"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 12.3l2.6 2.6 4.4-5.2"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span
        className="font-serif-display text-[1.35rem] font-semibold leading-none tracking-tight"
        style={{ color: "#251F47" }}
      >
        Myth<span style={{ color: "#71B48D" }}>MD</span>
      </span>
    </div>
  )
}
