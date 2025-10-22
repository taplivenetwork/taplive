import { MapPin, List, Video, User, Globe, Play, TrendingUp, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function MobileNavigation() {
  const [location] = useLocation();

  const navigation = [
    { name: "Live", href: "/", icon: Play },
    { name: "Orders", href: "/orders", icon: List },
    { name: "Streams", href: "/streams", icon: Video },
    { name: "Dashboard", href: "/dashboard", icon: TrendingUp },
  ];

  return (
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
                data-testid={`mobile-nav-${item.name.toLowerCase().replace(' ', '-')}`}
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
                  {item.name}
                </span>
              </Button>
            </Link>
          );
        })}
        
        {/* Floating Action Button for Creating Stream */}
        <div className="relative">
          <Link href="/?create=true">
            <Button
              size="sm"
              className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              data-testid="mobile-create-stream"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </Link>
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white animate-pulse">
            New
          </Badge>
        </div>
      </div>
      
      {/* Safe area padding for newer phones */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
