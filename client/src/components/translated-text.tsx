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

    // Simple cache key
    const cacheKey = `${currentLanguage}-${children}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      setTranslatedText(cached);
      return;
    }

    // Simple translation without complex async handling
    setTranslatedText(children); // Show original text immediately
    
    // Try to translate in background
    const translate = async () => {
      try {
        // Use simple fetch directly to avoid hook dependencies
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(children)}&langpair=en|${currentLanguage}&mt=1`);
        const data = await response.json();
        const translated = data.responseData?.translatedText;
        
        if (translated && translated !== children) {
          sessionStorage.setItem(cacheKey, translated);
          setTranslatedText(translated);
        }
      } catch (error) {
        // Silent fallback
        setTranslatedText(children);
      }
    };

    const timeoutId = setTimeout(translate, 200);
    return () => clearTimeout(timeoutId);
  }, [children, currentLanguage]);

  return (
    <span className={className}>
      {translatedText}
    </span>
  );
}

