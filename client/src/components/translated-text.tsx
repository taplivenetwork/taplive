import { useTranslation } from '@/hooks/use-translation';
import translationsData from '@/lib/translations.json';

interface TranslatedTextProps {
  children: string;
  className?: string;
  context?: string; // e.g., "home", "navigation", "demo"
}

export function TranslatedText({ children, className = "", context }: TranslatedTextProps) {
  const { currentLanguage } = useTranslation();
  
  // Try to get translation from context-specific translations first
  let translatedText = children;
  
  if (context) {
    const contextTranslations = (translationsData.translations as any)[context];
    if (contextTranslations && contextTranslations[currentLanguage]) {
      translatedText = contextTranslations[currentLanguage][children] || children;
    }
  } else {
    // Fallback: try all translation contexts
    const allTranslations = translationsData.translations as any;
    for (const ctx in allTranslations) {
      if (allTranslations[ctx][currentLanguage] && allTranslations[ctx][currentLanguage][children]) {
        translatedText = allTranslations[ctx][currentLanguage][children];
        break;
      }
    }
  }
  
  return (
    <span className={className}>
      {translatedText}
    </span>
  );
}