import { Inter, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata = {
  title: "Life OS",
  description: "Ebin's personal dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Life OS",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f5f5f5",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ background: "#f5f5f5" }}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Life OS" />
        <style>{`
          html, body { background: #f5f5f5; margin: 0; }

          #__loader {
            position: fixed; inset: 0; z-index: 9999;
            background: #f5f5f5;
            display: flex; flex-direction: column; justify-content: flex-end;
            padding: 0 28px calc(68px + env(safe-area-inset-bottom, 0px)) 28px;
            max-width: 480px; margin: 0 auto;
            transition: opacity 0.35s ease;
          }
          #__loader.out { opacity: 0; pointer-events: none; }

          @keyframes _fadeUp {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes _barFill {
            from { width: 0%; }
            to   { width: 83%; }
          }
          @keyframes _pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.4; }
          }

          #__loader-label {
            font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
            text-transform: uppercase; color: #c8c8c8; margin: 0 0 16px;
            font-family: -apple-system, sans-serif;
            animation: _fadeUp 0.5s cubic-bezier(0.22,0.7,0.18,1) 0.05s both;
          }
          #__loader-heading {
            font-size: clamp(30px, 8.5vw, 40px); font-weight: 800;
            letter-spacing: -0.04em; line-height: 1.1; margin: 0 0 40px;
            font-family: -apple-system, sans-serif; color: #0f0f0f;
          }
          #__loader-heading span { display: block; }
          #__loader-heading .l1 { animation: _fadeUp 0.55s cubic-bezier(0.22,0.7,0.18,1) 0.10s both; }
          #__loader-heading .l2 { animation: _fadeUp 0.55s cubic-bezier(0.22,0.7,0.18,1) 0.20s both; }
          #__loader-heading .l3 { color: #c0c0c0; animation: _fadeUp 0.55s cubic-bezier(0.22,0.7,0.18,1) 0.30s both; }
          #__loader-heading .l4 { color: #c0c0c0; animation: _fadeUp 0.55s cubic-bezier(0.22,0.7,0.18,1) 0.40s both; }

          #__loader-bar-wrap {
            animation: _fadeUp 0.5s cubic-bezier(0.22,0.7,0.18,1) 0.48s both;
          }
          #__loader-track {
            height: 1.5px; background: rgba(0,0,0,0.08);
            border-radius: 99px; overflow: hidden; margin-bottom: 14px;
          }
          #__loader-fill {
            height: 100%; background: #000; border-radius: 99px;
            animation: _barFill 2.6s cubic-bezier(0.16,1,0.3,1) 0.5s both;
          }
          #__loader-status {
            font-size: 13px; font-weight: 500; color: #999;
            font-family: -apple-system, sans-serif; margin: 0;
            animation: _pulse 2s ease-in-out 1s infinite;
          }
        `}</style>
      </head>
      <body className={`${inter.variable} ${hanken.variable} ${inter.className}`} style={{ background: "#f5f5f5" }}>

        {/* Pure HTML/CSS loader — visible before any JS runs */}
        <div id="__loader" aria-hidden="true">
          <p id="__loader-label">Life OS</p>
          <h1 id="__loader-heading">
            <span className="l1">Welcome back,</span>
            <span className="l2">Ebin.</span>
            <span className="l3">Good things are</span>
            <span className="l4">being cooked.</span>
          </h1>
          <div id="__loader-bar-wrap">
            <div id="__loader-track">
              <div id="__loader-fill" />
            </div>
            <p id="__loader-status">Loading your dashboard…</p>
          </div>
        </div>

        {children}

        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker'in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(e){console.warn('SW:',e)})})}`
          }}
        />
      </body>
    </html>
  );
}
