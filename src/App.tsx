import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, MemoryRouter } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
// import IframeReceiver from "./components/IframeReceiver";

const queryClient = new QueryClient();

interface AppProps {
  apiEndpoint: string;
  onClose?: () => void;
  onMaximize?: () => void;
  isEmbedded?: boolean;
}

export const App = ({ apiEndpoint, onClose, onMaximize, isEmbedded = false }: AppProps) => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<Index isEmbedded={isEmbedded} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// export const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <Toaster />
//       <Sonner />
//       <BrowserRouter>
//         <Routes>
//           <Route path="/" element={<Index />} />
//           {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </BrowserRouter>
//     </TooltipProvider>
//   </QueryClientProvider>
// );
