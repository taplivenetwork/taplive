import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TranslationProvider } from "@/components/translation-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNavigation } from "@/components/layout/mobile-nav";
import Home from "@/pages/home";
import Orders from "@/pages/orders";
import Earnings from "@/pages/earnings";
import Streams from "@/pages/streams";
import Settings from "@/pages/settings";
import { DispatchPage } from "@/pages/dispatch";
import { Dashboard } from "@/pages/dashboard";
import SafetyPage from "@/pages/safety";
import NotFound from "@/pages/not-found";

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
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 flex flex-col">
                <Router />
              </main>
            </div>
            <MobileNavigation />
          </div>
          <Toaster />
        </TooltipProvider>
      </TranslationProvider>
    </QueryClientProvider>
  );
}

export default App;
