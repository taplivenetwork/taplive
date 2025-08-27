import { MapPin, List, Video, User, Globe } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/language-selector";
import { TranslatedText } from "@/components/translated-text";
import { useTranslation } from "@/hooks/use-translation";

export function MobileNavigation() {
  const [location] = useLocation();
  const { currentLanguage, setCurrentLanguage } = useTranslation();

  const navigation = [
    { name: "Discover", href: "/", icon: MapPin },
    { name: "Orders", href: "/orders", icon: List },
    { name: "Streams", href: "/streams", icon: Video },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <>
      {/* Language selector for mobile - positioned at top right */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <LanguageSelector 
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          className="bg-white shadow-lg"
        />
      </div>
      
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-40" data-testid="mobile-nav">
        <div className="flex items-center justify-around">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={`mobile-nav-${item.name.toLowerCase()}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">
                  <TranslatedText>{item.name}</TranslatedText>
                </span>
              </Button>
            </Link>
          );
        })}
        </div>
      </nav>
    </>
  );
}
