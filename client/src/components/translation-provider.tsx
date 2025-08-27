import { ReactNode } from 'react';
import { TranslationContext, useTranslationState } from '@/hooks/use-translation';

interface TranslationProviderProps {
  children: ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const translationState = useTranslationState();

  return (
    <TranslationContext.Provider value={translationState}>
      {children}
    </TranslationContext.Provider>
  );
}