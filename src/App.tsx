import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import RegisterCase from "./pages/RegisterCase";
import LiveSearch from "./pages/LiveSearch";
import FootageSearch from "./pages/FootageSearch";
import Cases from "./pages/Cases";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/register" element={<ProtectedRoute><RegisterCase /></ProtectedRoute>} />
            <Route path="/dashboard/live-search" element={<ProtectedRoute><LiveSearch /></ProtectedRoute>} />
            <Route path="/dashboard/footage-search" element={<ProtectedRoute><FootageSearch /></ProtectedRoute>} />
            <Route path="/dashboard/cases" element={<ProtectedRoute><Cases /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
export default App;
