import { useState, useEffect } from 'react';

export type CustomFont = { name: string; url: string; };

export function useCustomFonts() {
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);

  const loadFonts = async () => {
      try {
        const res = await fetch('/api/uploads/list');
        const data = await res.json();
        
        if (data.success) {
          const fontsFolder = data.folders.find((f: any) => f.name === 'fonts');
          
          if (fontsFolder && fontsFolder.files) {
            const loadedFonts: CustomFont[] = [];
            const styleId = 'custom-fonts-style';
            let styleEl = document.getElementById(styleId) as HTMLStyleElement;
            
            if (!styleEl) {
              styleEl = document.createElement('style');
              styleEl.id = styleId;
              document.head.appendChild(styleEl);
            }

            let cssRules = '';

            fontsFolder.files.forEach((url: string) => {
              // Extract original font name, removing timestamp prefix e.g., /uploads/fonts/164000-MyFont.ttf -> MyFont
              const parts = url.split('/');
              const filenameWithExt = parts[parts.length - 1];
              const filename = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.')) || filenameWithExt;
              
              // Remove the timestamp prefix if it exists (e.g. 1700000000000-FontName)
              const nameParts = filename.split('-');
              let fontName = filename;
              if (nameParts.length > 1 && !isNaN(parseInt(nameParts[0]))) {
                fontName = nameParts.slice(1).join('-');
              }
              
              fontName = fontName.replace(/_/g, ' '); // Replace underscores with spaces

              loadedFonts.push({ name: fontName, url });
              
              const absoluteUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
              
              cssRules += `
                @font-face {
                  font-family: '${fontName}';
                  src: url('${absoluteUrl}');
                  font-weight: normal;
                  font-style: normal;
                }
              `;
            });

            styleEl.innerHTML = cssRules;
            setCustomFonts(loadedFonts);
          } else {
            setCustomFonts([]);
          }
        }
      } catch (e) {
        console.error('Failed to load custom fonts', e);
      }
  };
  
  useEffect(() => {
    loadFonts();
  }, []);

  return { customFonts, refreshFonts: loadFonts };
}
