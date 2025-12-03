import { MapPin, List, Video, User, Globe, Play, TrendingUp, Plus, Settings, Shield, X, Wallet, BarChart3 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSelector } from "@/components/language-selector";
import { TranslatedText } from "@/components/translated-text";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";

export function MobileNavigation() {
  const [location] = useLocation();
  const { currentLanguage, setCurrentLanguage } = useTranslation();
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role from our database
  useEffect(() => {
    if (isLoaded && user?.id) {
      fetch(`/api/users/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUserRole(data.data.role);
          }
        })
        .catch(err => {
          console.error('Error fetching user role:', err);
        });
    }
  }, [isLoaded, user?.id]);

  const navigation = [
    { name: "Live", href: "/", icon: Play },
    { name: "Orders", href: "/orders", icon: List },
    { name: "Streams", href: "/streams", icon: Video },
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  ];

  // Extra menu items that appear when + is clicked
  const extraMenuItems = [
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Smart Dispatch", href: "/dispatch", icon: TrendingUp },
    { name: "Safety & AA", href: "/safety", icon: Shield },
    ...(userRole === 'provider' ? [{ name: "Earnings", href: "/earnings", icon: Wallet }] : []),
  ];

  const handleMenuToggle = () => {
    setIsMenuExpanded(!isMenuExpanded);
  };

  const handleMenuItemClick = () => {
    setIsMenuExpanded(false);
  };

  return (
    <>
      {/* Language selector for mobile - positioned at top right */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <LanguageSelector 
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          className="bg-white dark:bg-gray-800 shadow-xl border-2 border-primary/20 hover:border-primary/40 transition-colors"
        />
      </div>
      
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-2 z-40 shadow-lg tech-card" data-testid="mobile-nav">
        <div className="flex items-center justify-around">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center gap-1 h-auto py-3 px-4 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? "text-primary bg-primary/10 shadow-md" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                  data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                >
                  <div className="relative">
                    <Icon className="w-6 h-6" />
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}>
                    <TranslatedText>{item.name}</TranslatedText>
                  </span>
                </Button>
              </Link>
            );
          })}
          
          {/* Floating Action Button - Expandable Menu */}
          <div className="relative z-50">
            <Button
              size="sm"
              onClick={handleMenuToggle}
              className={`w-14 h-14 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 z-50 ${
                isMenuExpanded 
                  ? "bg-gray-600 hover:bg-gray-700" 
                  : "bg-gradient-to-r from-primary to-primary/80"
              } text-primary-foreground`}
              data-testid="mobile-menu-toggle"
            >
              {isMenuExpanded ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </Button>
            
            {!isMenuExpanded && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 z-50">
                <TranslatedText>More</TranslatedText>
              </Badge>
            )}
          </div>
        </div>
        
        {/* Safe area padding for newer phones */}
        <div className="h-safe-area-inset-bottom" />
      </nav>

      {/* Expanded Menu - Rendered outside the nav for proper z-index */}
      {isMenuExpanded && (
        <>
          {/* Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-[60]" 
            onClick={handleMenuToggle}
          />
          
          {/* Menu Items - Positioned above the nav bar */}
          <div className="lg:hidden fixed bottom-24 left-0 right-0 flex flex-col items-center gap-3 z-[70] px-4">
            {extraMenuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    onClick={handleMenuItemClick}
                    className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-xl transition-all duration-200 min-w-[200px] justify-center ${
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-card text-foreground hover:bg-primary/10 border border-border"
                    }`}
                    style={{ 
                      animation: `slideUp 0.3s ease-out ${index * 0.05}s both`
                    }}
                    data-testid={`mobile-menu-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium whitespace-nowrap">
                      <TranslatedText context="navigation">{item.name}</TranslatedText>
                    </span>
                  </Button>
                </Link>
              );
            })}
          </div>
          
          {/* CSS Animation */}
          <style>{`
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </>
      )}
    </>
  );
}
