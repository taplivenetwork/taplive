import { Video, MapPin, List, Wallet, Settings, LogOut, User, TrendingUp, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { SimpleLanguageSelector } from "@/components/SimpleLanguageSelector";
import { T } from "@/components/T";
import { useSimpleTranslation } from "@/hooks/useSimpleTranslation";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";

export function Sidebar() {
  const [location] = useLocation();
  const { currentLanguage, changeLanguage } = useSimpleTranslation();
  const { user, isLoaded } = useUser();

  const navigation = [
    { name: "Discover", href: "/", icon: MapPin, current: location === "/" },
    { name: "Dashboard", href: "/dashboard", icon: BarChart3, current: location === "/dashboard" },
    { name: "My Orders", href: "/orders", icon: List, current: location === "/orders" },
    { name: "Live Streams", href: "/streams", icon: Video, current: location === "/streams" },
    { name: "Smart Dispatch", href: "/dispatch", icon: TrendingUp, current: location === "/dispatch" },
    { name: "Safety & AA", href: "/safety", icon: Shield, current: location === "/safety" },
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
          <h1 className="text-xl font-bold text-foreground"><T category="navigation" k="TapLive" /></h1>
          <p className="text-xs text-muted-foreground"><T category="navigation" k="MVP Platform" /></p>
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
                  <T category="navigation" k={item.name} />
                </span>
              </Button>
            </Link>
          );
        })}
      </nav>


      {/* Language Selector */}
      <div className="pt-4 border-t border-border">
        <SimpleLanguageSelector className="w-full" />
      </div>

      {/* User Profile */}
      <div className="pt-4 border-t border-border">
        {isLoaded && user ? (
          <div className="flex items-center gap-3">
            {user.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.firstName || user.username || 'User'}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium" data-testid="user-name">
                {user.firstName || user.username || 'User'}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="user-role">
                {user.emailAddresses[0]?.emailAddress || ''}
              </p>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        ) : isLoaded ? (
          <div className="space-y-2">
            <SignInButton mode="modal">
              <Button variant="outline" className="w-full">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Sign Up
              </Button>
            </SignUpButton>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-primary/20 rounded animate-pulse mb-1" />
              <div className="h-3 bg-primary/10 rounded animate-pulse w-2/3" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
