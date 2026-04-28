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
              // Extract original font name, removing timestamp prefix
              const parts = url.split('/');
              const filenameWithExt = parts[parts.length - 1];
              const filename = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.')) || filenameWithExt;
              
              const nameParts = filename.split('-');
              let fontName = filename;
              if (nameParts.length > 1 && !isNaN(parseInt(nameParts[0]))) {
                fontName = nameParts.slice(1).join('-');
              }
              
              fontName = fontName.replace(/_/g, ' ');

              loadedFonts.push({ name: fontName, url });
              
              const absoluteUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
              
              // Define font-face with absolute URL first (acts as fallback and initial render)
              cssRules += `
                @font-face {
                  font-family: '${fontName}';
                  src: url('${absoluteUrl}');
                  font-weight: normal;
                  font-style: normal;
                }
              `;

              // Async fetch and swap to base64 for html2canvas compatibility
              if (typeof window !== 'undefined') {
                fetch(absoluteUrl)
                  .then(res => res.blob())
                  .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = reader.result as string;
                      if (styleEl) {
                        styleEl.innerHTML = styleEl.innerHTML.replace(`url('${absoluteUrl}')`, `url('${base64}')`);
                      }
                    };
                    reader.readAsDataURL(blob);
                  })
                  .catch(e => console.error("Base64 font fetch failed", e));
              }
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
    // Load Google Fonts
    const GOOGLE_FONTS = [
      "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Oswald", "Source Sans 3",
      "Raleway", "Ubuntu", "Playfair Display", "Merriweather", "PT Serif", "Lora", "Nunito",
      "Roboto Mono", "Fira Code", "Outfit", "Dancing Script", "Pacifico", "Caveat", "Righteous",
      "Lobster", "Bebas Neue", "Anton", "Josefin Sans", "Titillium Web", "Quicksand", "Rubik",
      "Inconsolata", "Cinzel", "Amatic SC", "Comfortaa", "Comic Neue", "Permanent Marker",
      "Bungee", "Rakkas", "Kalam", "Indie Flower", "Satisfy"
    ];
    
    const linkId = 'google-fonts-editor-link';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      const families = GOOGLE_FONTS.map(f => `${f.replace(/ /g, '+')}:400,700`).join('|');
      link.href = `https://fonts.googleapis.com/css?family=${families}&display=swap`;
      document.head.appendChild(link);
    }

    loadFonts();
  }, []);

  return { customFonts, refreshFonts: loadFonts };
}
