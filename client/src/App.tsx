import { Switch, Route } from "wouter";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TranslationProvider } from "@/components/translation-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNavigation } from "@/components/layout/mobile-nav";
import { setAuthTokenGetter } from "@/lib/api";
import { useEffect } from "react";
import Home from "@/pages/home";
import Orders from "@/pages/orders";
import Earnings from "@/pages/earnings";
import Streams from "@/pages/streams";
import Settings from "@/pages/settings";
import { DispatchPage } from "@/pages/dispatch";
import { Dashboard } from "@/pages/dashboard";
import SafetyPage from "@/pages/safety";
import Payment from "@/pages/payment";
import LiveStreamPage from "@/pages/live-stream";
import NotFound from "@/pages/not-found";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/orders" component={Orders} />
      <Route path="/earnings" component={Earnings} />
      <Route path="/streams" component={Streams} />
      <Route path="/dispatch" component={DispatchPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/safety" component={SafetyPage} />
      <Route path="/payment/:orderId" component={Payment} />
      <Route path="/stream/:orderId" component={LiveStreamPage} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { getToken } = useAuth();
  
  // Set up global auth token getter - use "neon" JWT template
  useEffect(() => {
    setAuthTokenGetter(() => getToken({ template: "neon" }));
  }, [getToken]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <Router />
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <TranslationProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </TranslationProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
