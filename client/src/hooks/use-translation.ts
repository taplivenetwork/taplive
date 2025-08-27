import { useState, useEffect, createContext, useContext } from 'react';
import { translationService, getUserLanguage, detectLanguageFromText } from '@/lib/translation';

export interface TranslationContextType {
  currentLanguage: string;
  setCurrentLanguage: (language: string) => void;
  translateText: (text: string, sourceLanguage?: string) => Promise<string>;
  translateMultiple: (texts: string[], sourceLanguage?: string) => Promise<string[]>;
  isTranslating: boolean;
}

export const TranslationContext = createContext<TranslationContextType | null>(null);

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

export function useTranslationState() {
  const [currentLanguage, setCurrentLanguage] = useState(getUserLanguage());
  const [isTranslating, setIsTranslating] = useState(false);

  // Save language preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('user-language', currentLanguage);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  }, [currentLanguage]);

  // Load language preference from localStorage on mount
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('user-language');
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
      console.warn('Failed to load language preference:', error);
    }
  }, []);

  const translateText = async (text: string, sourceLanguage?: string): Promise<string> => {
    if (!text.trim() || currentLanguage === 'en') {
      return text;
    }

    setIsTranslating(true);
    try {
      const source = sourceLanguage || detectLanguageFromText(text);
      const translated = await translationService.translateText(text, source, currentLanguage);
      return translated;
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Return original text on error
    } finally {
      setIsTranslating(false);
    }
  };

  const translateMultiple = async (texts: string[], sourceLanguage?: string): Promise<string[]> => {
    if (!texts.length || currentLanguage === 'en') {
      return texts;
    }

    setIsTranslating(true);
    try {
      const source = sourceLanguage || 'auto';
      const translated = await translationService.translateMultiple(texts, source, currentLanguage);
      return translated;
    } catch (error) {
      console.error('Multiple translation failed:', error);
      return texts; // Return original texts on error
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    currentLanguage,
    setCurrentLanguage,
    translateText,
    translateMultiple,
    isTranslating,
  };
}