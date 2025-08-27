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
      if (cached) {
        setTranslatedText(cached);
        return;
      }
    } catch (error) {
      // Storage access might fail
    }
    
    // Try to translate in background
    const translate = async () => {
      try {
        // Use simple fetch directly to avoid hook dependencies
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(children)}&langpair=en|${currentLanguage}&mt=1`);
        const data = await response.json();
        const translated = data.responseData?.translatedText;
        
        if (translated && translated !== children && translated.trim()) {
          try {
            sessionStorage.setItem(cacheKey, translated);
          } catch (error) {
            // Storage write might fail
          }
          setTranslatedText(translated);
        }
      } catch (error) {
        // Silent fallback - keep original text
      }
    };

    const timeoutId = setTimeout(translate, 150);
    return () => clearTimeout(timeoutId);
  }, [children, currentLanguage]);

  return (
    <span className={className}>
      {translatedText}
    </span>
  );
}

