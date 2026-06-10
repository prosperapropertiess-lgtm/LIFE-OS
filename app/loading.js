export default function Loading() {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "#f5f5f5",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "16px",
      fontFamily: "-apple-system, sans-serif",
    }}>
      {/* Avatar */}
      <div style={{
        width: 48, height: 48,
        borderRadius: "50%",
        background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff",
        fontSize: 18, fontWeight: 800,
        animation: "loPulse 1.6s ease-in-out infinite",
      }}>
        E
      </div>

      {/* Thin loading bar */}
      <div style={{
        width: 48, height: 2,
        borderRadius: 99,
        background: "rgba(0,0,0,0.08)",
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          left: 0, top: 0, height: "100%",
          width: "40%",
          background: "#000",
          borderRadius: 99,
          animation: "loBar 1.2s ease-in-out infinite",
        }} />
      </div>

      <style>{`
        @keyframes loPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.96); }
        }
        @keyframes loBar {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
