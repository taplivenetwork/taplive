import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/use-translation';

interface TranslatedTextProps {
  children: string;
  sourceLanguage?: string;
  className?: string;
  fallbackText?: string;
}

export function TranslatedText({ 
  children, 
  sourceLanguage = 'en', 
  className = "",
  fallbackText 
}: TranslatedTextProps) {
  const { currentLanguage } = useTranslation();
  const [translatedText, setTranslatedText] = useState(children || '');

  useEffect(() => {
    // Only translate if current language is not English and we have text
    if (!children || currentLanguage === 'en') {
      setTranslatedText(children || '');
      return;
    }

    // Clear previous translations when language changes
    setTranslatedText(children);

    // Simple cache key
    const cacheKey = `${currentLanguage}-${children}`;
    
    try {
      const cached = sessionStorage.getItem(cacheKey);
      // Check if cached translation contains error messages
      if (cached && 
          !cached.includes('MYMEMORY WARNING') && 
          !cached.includes('QUOTA EXCEEDED') &&
          !cached.includes('NEXT AVAILABLE IN')) {
        setTranslatedText(cached);
        return;
      } else if (cached) {
        // Clear bad cached translations
        sessionStorage.removeItem(cacheKey);
      }
    } catch (error) {
      // Storage access might fail
    }
    
    // Try to translate in background with multiple APIs
    const translate = async () => {
      const apis = [
        {
          name: 'Lingva',
          url: `https://lingva.ml/api/v1/en/${currentLanguage}/${encodeURIComponent(children)}`,
          parser: (data: any) => data.translation
        },
        {
          name: 'Lingva2',
          url: `https://translate.plausibility.cloud/api/v1/en/${currentLanguage}/${encodeURIComponent(children)}`,
          parser: (data: any) => data.translation
        },
        {
          name: 'MyMemory',
          url: `https://api.mymemory.translated.net/get?q=${encodeURIComponent(children)}&langpair=en|${currentLanguage}&mt=1`,
          parser: (data: any) => data.responseData?.translatedText
        }
      ];

      for (const api of apis) {
        try {
          const response = await fetch(api.url, {
            headers: {
              'User-Agent': 'TapLive/1.0'
            }
          });
          
          if (!response.ok) continue;
          
          const data = await response.json();
          const translated = api.parser(data);
          
          if (translated && 
              translated !== children && 
              translated.trim() &&
              !translated.includes('MYMEMORY WARNING') &&
              !translated.includes('QUOTA EXCEEDED')) {
            
            try {
              sessionStorage.setItem(cacheKey, translated);
            } catch (error) {
              // Storage write might fail
            }
            setTranslatedText(translated);
            return; // Success, stop trying other APIs
          }
        } catch (error) {
          // Try next API
          continue;
        }
      }
      
      // All APIs failed, keep original text
    };

    const timeoutId = setTimeout(translate, 100);
    return () => clearTimeout(timeoutId);
  }, [children, currentLanguage]);

  return (
    <span className={className}>
      {translatedText}
    </span>
  );
}

