import { MapPin, List, Video, User, Globe, Play, TrendingUp, Plus, Settings, Shield, X, Wallet, BarChart3, LogIn, UserPlus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSelector } from "@/components/language-selector";
import { TranslatedText } from "@/components/translated-text";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useEffect } from "react";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { authFetch } from "@/lib/api";

export function MobileNavigation() {
  const [location] = useLocation();
  const { currentLanguage, setCurrentLanguage } = useTranslation();
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role from our database
  useEffect(() => {
    if (isLoaded && user?.id) {
      authFetch(`/api/users/${user.id}`)
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
      
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-background/90 backdrop-blur-lg border-t border-border/50 z-40 shadow-2xl" data-testid="mobile-nav">
        <div className="max-w-screen-xl mx-auto px-2 py-2">
          <div className="flex items-center justify-between gap-1">
            {/* Auth Buttons or User Profile - Left Side */}
            {!user && isLoaded ? (
              <div className="flex gap-1">
                <SignInButton mode="modal">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="flex flex-col items-center gap-0.5 h-auto py-2 px-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Sign In</span>
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button 
                    size="sm"
                    className="flex flex-col items-center gap-0.5 h-auto py-2 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Sign Up</span>
                  </Button>
                </SignUpButton>
              </div>
            ) : user && isLoaded ? (
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center gap-0.5 h-auto py-2 px-2 rounded-lg"
              >
                <UserButton afterSignOutUrl="/" />
              </Button>
            ) : (
              <div className="w-16 h-12 bg-muted/20 rounded-lg animate-pulse" />
            )}

            {/* Main Navigation Items */}
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col items-center gap-0.5 h-auto py-2 px-2 rounded-lg transition-all ${
                      isActive 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                    data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                    <span className="text-[10px] font-medium">
                      <TranslatedText>{item.name}</TranslatedText>
                    </span>
                  </Button>
                </Link>
              );
            })}
            
            {/* More Menu Button - Right Side */}
            <div className="relative">
              <Button
                size="sm"
                onClick={handleMenuToggle}
                variant="ghost"
                className={`flex flex-col items-center gap-0.5 h-auto py-2 px-2 rounded-lg transition-all ${
                  isMenuExpanded 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
                data-testid="mobile-menu-toggle"
              >
                {isMenuExpanded ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                <span className="text-[10px] font-medium">
                  <TranslatedText>More</TranslatedText>
                </span>
              </Button>
            </div>
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
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" 
            onClick={handleMenuToggle}
          />
          
          {/* Menu Items - Modern card layout above the nav bar */}
          <div className="lg:hidden fixed bottom-20 left-0 right-0 z-[70] px-4">
            <div className="bg-card/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
              <div className="grid grid-cols-2 gap-px bg-border/50">
                {extraMenuItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        onClick={handleMenuItemClick}
                        variant="ghost"
                        className={`w-full h-20 flex flex-col items-center justify-center gap-2 rounded-none bg-card hover:bg-primary/10 ${
                          isActive ? "text-primary bg-primary/5" : "text-foreground"
                        }`}
                        style={{ 
                          animation: `fadeIn 0.2s ease-out ${index * 0.05}s both`
                        }}
                        data-testid={`mobile-menu-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-medium text-center">
                          <TranslatedText context="navigation">{item.name}</TranslatedText>
                        </span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* CSS Animation */}
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
        </>
      )}
    </>
  );
}
