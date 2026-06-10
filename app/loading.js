// This file is intentionally minimal.
// Its only job is to tell Next.js to stream the layout HTML immediately
// (including the #__loader div) instead of waiting for getDashboard() to finish.
// The visual loading experience is handled entirely by #__loader in layout.js.
export default function Loading() {
  return null;
}
