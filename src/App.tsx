import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, MemoryRouter } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { createContext } from "react";
// import IframeReceiver from "./components/IframeReceiver";

// Create a context to hold the chat configuration
export interface ChatContextType {
  apiEndpoint: string;
  apiKey: string;
  projectID: string;
  launchConfig?: {
    event: {
      type: string;
      payload: Record<string, any>;
    }
  };
  isEmbedded?: boolean;
  disableGlobalAutoScroll?: boolean;
}

export const ChatContext = createContext<ChatContextType>({
  apiEndpoint: '',
  apiKey: '',
  projectID: '',
  isEmbedded: false,
});

const queryClient = new QueryClient();

interface AppProps {
  apiEndpoint: string;
  apiKey: string;
  projectID: string;
  launchConfig?: {
    event: {
      type: string;
      payload: Record<string, any>;
    }
  };
  onClose?: () => void;
  onMaximize?: () => void;
  isEmbedded?: boolean;
  disableGlobalAutoScroll?: boolean;
}

export const App = ({ 
  apiEndpoint, 
  apiKey, 
  projectID, 
  launchConfig,
  onClose, 
  onMaximize, 
  isEmbedded = false,
  disableGlobalAutoScroll = false
}: AppProps) => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ChatContext.Provider value={{ 
        apiEndpoint, 
        apiKey, 
        projectID, 
        launchConfig, 
        isEmbedded,
        disableGlobalAutoScroll
      }}>
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
      </ChatContext.Provider>
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
