// Export font definition tokens for application typography.
// Loaded via optimized Google Fonts CDN in layout.tsx to prevent build-time network
// extraction failures (TypeError: Cannot read properties of null (reading '1') in next/font/google loader)
// during production builds on Firebase App Hosting / Cloud Build.

export const plusJakarta = {
  variable: 'font-plus-jakarta',
  className: 'font-plus-jakarta',
  style: { fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
};

export const playfair = {
  variable: 'font-playfair',
  className: 'font-playfair',
  style: { fontFamily: "'Playfair Display', Georgia, serif" },
};

export const outfit = {
  variable: 'font-outfit',
  className: 'font-outfit',
  style: { fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
};

export const montserrat = {
  variable: 'font-montserrat',
  className: 'font-montserrat',
  style: { fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
};
