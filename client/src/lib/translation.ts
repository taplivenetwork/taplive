// Translation service using LibreTranslate API (free, no API key required)

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

class TranslationService {
  private cache = new Map<string, string>();
  private retryAttempts = 2;
  private retryDelay = 1000;

  async translateText(
    text: string, 
    sourceLanguage: string = 'en', 
    targetLanguage: string = 'en'
  ): Promise<string> {
    // Return original text if no translation needed or if target is same as source
    if (sourceLanguage === targetLanguage || !text.trim() || targetLanguage === 'en') {
      return text;
    }

    // Check cache first
    const cacheKey = `${sourceLanguage}-${targetLanguage}-${text}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let lastError: Error | null = null;

    // Ensure source language is valid (default to 'en' if 'auto')
    const validSourceLanguage = sourceLanguage === 'auto' ? 'en' : sourceLanguage;
    
    // Translation providers to try (all free, no API key required)
    const providers = [
      {
        name: 'MyMemory',
        url: `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${validSourceLanguage}|${targetLanguage}&mt=1`,
        parseResponse: (data: any) => data.responseData?.translatedText
      }
    ];

    // Try each provider
    for (const provider of providers) {
      try {
        const response = await fetch(provider.url, {
          headers: {
            'User-Agent': 'TapLive-Translation-Service/1.0',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const translatedText = provider.parseResponse(data);
        
        if (translatedText && translatedText !== text) {
          // Cache the result
          this.cache.set(cacheKey, translatedText);
          console.log(`Translated "${text}" to "${translatedText}" via ${provider.name}`);
          return translatedText;
        }

      } catch (error) {
        lastError = error as Error;
        console.warn(`${provider.name} translation failed:`, error);
      }
    }

    // If all providers fail, return original text
    console.error('All translation providers failed:', lastError);
    return text;
  }

  async translateMultiple(
    texts: string[], 
    sourceLanguage: string = 'auto', 
    targetLanguage: string = 'en'
  ): Promise<string[]> {
    const promises = texts.map(text => 
      this.translateText(text, sourceLanguage, targetLanguage)
    );
    return Promise.all(promises);
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const translationService = new TranslationService();

// Language detection utility
export function detectLanguageFromText(text: string): string {
  // Simple language detection based on character patterns
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (/[\u0900-\u097f]/.test(text)) return 'hi';
  if (/[\u0400-\u04ff]/.test(text)) return 'ru';
  
  // Default to auto-detect for other languages
  return 'auto';
}

// Get user's preferred language from browser
export function getUserLanguage(): string {
  const browserLang = navigator.language.split('-')[0];
  const supportedCodes = SUPPORTED_LANGUAGES.map(lang => lang.code);
  return supportedCodes.includes(browserLang) ? browserLang : 'en';
}