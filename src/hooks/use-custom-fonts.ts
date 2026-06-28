import { useState, useEffect, useCallback } from 'react';

export type CustomFont = { name: string; url: string; };

export function useCustomFonts() {
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadFonts = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/uploads/list');
      const data = await res.json();

      if (data.success) {
        const fontsFolder = data.folders.find((f: any) => f.name === 'fonts');
        if (fontsFolder && fontsFolder.files) {
          const styleId = 'custom-fonts-style';
          let styleEl = document.getElementById(styleId) as HTMLStyleElement;
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
          }

          // Group fonts by name to handle priority (newest first)
          // The API returns them newest first already
          const uniqueFonts = new Map<string, string>(); // name -> url
          const fontList: CustomFont[] = [];

          fontsFolder.files.forEach((url: string) => {
            const parts = url.split('/');
            const filenameWithExt = parts[parts.length - 1];
            const filename = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.')) || filenameWithExt;
            
            const nameParts = filename.split('-');
            let fontName = filename;
            if (nameParts.length > 1 && !isNaN(parseInt(nameParts[0]))) {
              fontName = nameParts.slice(1).join('-');
            }
            
            fontName = fontName.replace(/_/g, ' ');

            if (!uniqueFonts.has(fontName)) {
              uniqueFonts.set(fontName, url);
              fontList.push({ name: fontName, url });
            }
          });

          setCustomFonts(fontList);

          // Generate initial CSS with URLs (fast)
          let cssRules = '';
          uniqueFonts.forEach((url, name) => {
            const absoluteUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
            cssRules += `
              @font-face {
                font-family: '${name}';
                src: url('${absoluteUrl}');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
              }\n`;
          });
          styleEl.innerHTML = cssRules;

          // Background task: Convert to base64 for html2canvas/export compatibility
          // We do this one by one to avoid race conditions on innerHTML
          for (const [name, url] of uniqueFonts.entries()) {
            const absoluteUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
            try {
                const response = await fetch(absoluteUrl);
                if (response.ok) {
                    const blob = await response.blob();
                    const reader = new FileReader();
                    const base64Promise = new Promise<string>((resolve) => {
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });
                    const base64 = await base64Promise;
                    
                    const currentStyle = document.getElementById(styleId);
                    if (currentStyle) {
                        currentStyle.innerHTML = currentStyle.innerHTML.replace(`url('${absoluteUrl}')`, `url('${base64}')`);
                    }
                }
            } catch (err) {
                console.warn(`Failed to base64 encode font ${name}:`, err);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading custom fonts:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);
  
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
      link.crossOrigin = 'anonymous';
      const families = GOOGLE_FONTS.map(f => `${f.replace(/ /g, '+')}:400,700`).join('|');
      link.href = `https://fonts.googleapis.com/css?family=${families}&display=swap`;
      document.head.appendChild(link);
    }

    loadFonts();
  }, []);

  return { customFonts, refreshFonts: loadFonts };
}
