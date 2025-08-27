import { useState, useEffect } from 'react';
import { Globe, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SUPPORTED_LANGUAGES, getUserLanguage, type Language } from '@/lib/translation';

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  className?: string;
}

export function LanguageSelector({ 
  currentLanguage, 
  onLanguageChange, 
  className = "" 
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-2 ${className}`}
          data-testid="language-selector-trigger"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang.flag}</span>
          <span className="hidden md:inline">{currentLang.nativeName}</span>
          <Languages className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64" data-testid="language-dropdown">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Select Language / 选择语言
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {SUPPORTED_LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            className="flex items-center justify-between gap-3 p-3 cursor-pointer"
            data-testid={`language-option-${language.code}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{language.flag}</span>
              <div>
                <div className="font-medium">{language.nativeName}</div>
                <div className="text-sm text-muted-foreground">{language.name}</div>
              </div>
            </div>
            
            {currentLanguage === language.code && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
        
      </DropdownMenuContent>
    </DropdownMenu>
  );
}