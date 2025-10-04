import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Suspense, lazy } from "react";
import Index from "./pages/Index";

const queryClient = new QueryClient();

// Lazy load auth and health pages
const Auth = lazy(() => import("./pages/Auth"));
const Health = lazy(() => import("./pages/Health"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={
              <Suspense fallback={<div className="min-h-screen bg-gradient-space flex items-center justify-center">
                <div className="animate-pulse text-primary">Loading...</div>
              </div>}>
                <Auth />
              </Suspense>
            } />
            <Route path="/health" element={
              <Suspense fallback={<div className="min-h-screen bg-gradient-space flex items-center justify-center">
                <div className="animate-pulse text-primary">Loading...</div>
              </div>}>
                <Health />
              </Suspense>
            } />
            <Route path="/404" element={
              <Suspense fallback={<div className="min-h-screen bg-gradient-space flex items-center justify-center">
                <div className="animate-pulse text-primary">Loading...</div>
              </div>}>
                <NotFound />
              </Suspense>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
