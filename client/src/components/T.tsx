import { useSimpleTranslation } from '@/hooks/useSimpleTranslation';

interface TProps {
  category: 'navigation' | 'main_content' | 'forms_buttons' | 'demo_content';
  k: string; // key
  className?: string;
  children?: React.ReactNode;
}

// 简单的翻译组件
export function T({ category, k, className, children }: TProps) {
  const { t } = useSimpleTranslation();
  
  const translatedText = t(category, k);
  
  return (
    <span className={className}>
      {translatedText}
      {children}
    </span>
  );
}