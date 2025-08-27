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
    if (currentLanguage === 'en' || !children.trim()) {
      setTranslatedText(children);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const performTranslation = async () => {
      try {
        const translated = await translateText(children, sourceLanguage);
        if (isMounted) {
          setTranslatedText(translated);
        }
      } catch (error) {
        console.warn('Translation failed:', error);
        if (isMounted) {
          setTranslatedText(fallbackText || children);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    performTranslation();

    return () => {
      isMounted = false;
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

// Higher-order component for wrapping elements with translation
export function withTranslation<T extends { children?: React.ReactNode }>(
  Component: React.ComponentType<T>
) {
  return function TranslatedComponent(props: T) {
    const { children, ...rest } = props;
    
    if (typeof children === 'string') {
      return (
        <Component {...(rest as T)}>
          <TranslatedText>{children}</TranslatedText>
        </Component>
      );
    }
    
    return <Component {...props} />;
  };
}