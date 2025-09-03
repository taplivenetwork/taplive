import { useTranslation } from '@/hooks/use-translation';
import { translations } from '@/lib/translations';

interface TranslatedTextProps {
  children: string;
  className?: string;
}

export function TranslatedText({ children, className = "" }: TranslatedTextProps) {
  const { currentLanguage } = useTranslation();
  
  // Get translation from the external translation file
  const translatedText = translations[currentLanguage as keyof typeof translations]?.[children as keyof typeof translations['en']] || children;
  
  return (
    <span className={className}>
      {translatedText}
    </span>
  );
}