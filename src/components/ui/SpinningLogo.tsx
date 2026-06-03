"use client"

export default function SpinningLogo() {
  return (
    <div className="fixed top-3 left-3 z-[60] pointer-events-none">
      <div className="w-12 h-12 rounded-full border-2 border-brand-red/40 shadow-lg shadow-brand-red/20 bg-black/40 backdrop-blur-sm flex items-center justify-center">
        <div className="w-8 h-8 rounded-full overflow-hidden" style={{ perspective: "200px" }}>
          <img
            src="/logo-transparent.png"
            alt="Infinity Gym"
            className="w-full h-full object-contain"
            style={{
              animation: "spinEarth 4s linear infinite",
              transformStyle: "preserve-3d",
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes spinEarth {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  )
}
