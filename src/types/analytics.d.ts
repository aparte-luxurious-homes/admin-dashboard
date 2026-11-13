// Global typing for the Microsoft Clarity tag.
// gtag/dataLayer typings are provided by @next/third-parties; only `clarity`
// needs declaring here.
export {};

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}
