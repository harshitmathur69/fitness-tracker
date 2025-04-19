import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Workout from "./pages/Workout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* Sign-Up Page */}
          <Route path="/signup" element={<SignUp />} />

          {/* Dashboard Page */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Workout Page */}
          <Route path="/workout" element={<Workout />} />

          {/* Catch-All Route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;