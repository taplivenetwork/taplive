import { Switch, Route } from "wouter";
<<<<<<< HEAD
import { queryClient } from "./lib/queryClient";
=======
import { queryClient } from "./lib/queryclient";
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import Payment from "@/pages/payment";
import LiveStreamPage from "@/pages/live-stream";
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
      <Route path="/payment/:orderId" component={Payment} />
      <Route path="/stream/:orderId" component={LiveStreamPage} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;
