import { useState, useEffect } from 'react';
import translationsData from '@/lib/translations.json';

// 简单的翻译Hook
export function useSimpleTranslation() {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  
  // 从localStorage加载语言设置
  useEffect(() => {
    const savedLang = localStorage.getItem('app-language') || 'en';
    setCurrentLanguage(savedLang);
  }, []);
  
  // 保存语言设置到localStorage
  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    localStorage.setItem('app-language', lang);
  };
  
  // 翻译函数 - 根据分类和key获取翻译
  const t = (category: string, key: string): string => {
    try {
      const translations = translationsData.translations[category as keyof typeof translationsData.translations];
      if (!translations) return key;
      
      const langTranslations = translations[currentLanguage as keyof typeof translations];
      if (!langTranslations) return key;
      
      return langTranslations[key as keyof typeof langTranslations] || key;
    } catch (error) {
      console.warn('Translation error:', error);
      return key;
    }
  };
  
  // 获取可用语言列表
  const getLanguages = () => {
    return Object.entries(translationsData.languages).map(([code, info]) => ({
      code,
      name: info.name,
      flag: info.flag
    }));
  };
  
  return {
    currentLanguage,
    changeLanguage,
    t,
    getLanguages
  };
}