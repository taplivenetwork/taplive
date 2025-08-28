import { Video, MapPin, List, Wallet, Settings, LogOut, User, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { LanguageSelector } from "@/components/language-selector";
import { TranslatedText } from "@/components/translated-text";
import { useTranslation } from "@/hooks/use-translation";

export function Sidebar() {
  const [location] = useLocation();
  const { currentLanguage, setCurrentLanguage } = useTranslation();

  const navigation = [
    { name: "Discover", href: "/", icon: MapPin, current: location === "/" },
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, current: location === "/dashboard" },
    { name: "My Orders", href: "/orders", icon: List, current: location === "/orders" },
    { name: "Live Streams", href: "/streams", icon: Video, current: location === "/streams" },
    { name: "Smart Dispatch", href: "/dispatch", icon: TrendingUp, current: location === "/dispatch" },
    { name: "Earnings", href: "/earnings", icon: Wallet, current: location === "/earnings" },
    { name: "Settings", href: "/settings", icon: Settings, current: location === "/settings" },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border p-6 hidden lg:block" data-testid="sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <Video className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground"><TranslatedText>TapLive</TranslatedText></h1>
          <p className="text-xs text-muted-foreground"><TranslatedText>MVP Platform</TranslatedText></p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={item.current ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  item.current
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="w-5 h-5" />
                <span>
                  <TranslatedText>{item.name}</TranslatedText>
                </span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Language Selector */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-2"><TranslatedText>Language / 语言</TranslatedText></p>
          <LanguageSelector 
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
            className="w-full"
          />
        </div>
      </div>

      {/* User Profile */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" data-testid="user-name"><TranslatedText>Sarah Chen</TranslatedText></p>
            <p className="text-xs text-muted-foreground" data-testid="user-role">
              <TranslatedText>Content Creator</TranslatedText>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
