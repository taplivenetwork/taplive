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
  sourceLanguage = 'auto', 
  className = "",
  fallbackText 
}: TranslatedTextProps) {
  const { translateText, currentLanguage, isTranslating } = useTranslation();
  const [translatedText, setTranslatedText] = useState(children);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only translate if current language is not English (source)
    if (currentLanguage === 'en' || !children?.trim()) {
      setTranslatedText(children);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const performTranslation = async () => {
      try {
        if (translateText && typeof translateText === 'function') {
          const translated = await translateText(children, sourceLanguage);
          if (isMounted && translated) {
            setTranslatedText(translated);
          }
        }
      } catch (error) {
        // Silent error handling
        if (isMounted) {
          setTranslatedText(fallbackText || children);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Add small delay to prevent rapid re-renders
    const timeoutId = setTimeout(performTranslation, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [children, currentLanguage, sourceLanguage, translateText, fallbackText]);

  if (isLoading) {
    return (
      <span className={`${className} opacity-70`}>
        {children}
      </span>
    );
  }

  return (
    <span className={className}>
      {translatedText}
    </span>
  );
}

