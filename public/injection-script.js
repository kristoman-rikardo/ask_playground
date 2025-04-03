
/**
 * Chat Widget Injection Script
 * This script scrapes the current page's content and injects the chat widget iframe.
 */

(function() {
  // Configuration
  const CHAT_APP_URL = "https://sleek-faq-buddy.lovable.app"; // Updated URL to your actual deployed app
  const CHAT_CONTAINER_ID = "chat-widget-container";
  
  // Create container for the chat widget
  function createChatContainer() {
    const container = document.createElement("div");
    container.id = CHAT_CONTAINER_ID;
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.width = "400px";
    container.style.height = "600px";
    container.style.maxHeight = "80vh";
    container.style.zIndex = "9999";
    container.style.borderRadius = "12px";
    container.style.overflow = "hidden";
    container.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.15)";
    return container;
  }
  
  // Create the iframe that will contain the chat widget
  function createChatIframe() {
    const iframe = document.createElement("iframe");
    
    // Add timestamp to URL to prevent caching issues
    const timestamp = new Date().getTime();
    iframe.src = `${CHAT_APP_URL}?t=${timestamp}`;
    
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.style.border = "none";
    iframe.style.borderRadius = "12px";
    iframe.allow = "microphone; camera; geolocation"; // Add permissions if needed
    return iframe;
  }
  
  // Scrape page content
  function scrapePageContent() {
    try {
      // Get main content - exclude navigation, footers, ads, etc.
      const mainContent = document.querySelector("main") || 
                         document.querySelector("article") || 
                         document.querySelector(".content") || 
                         document.querySelector(".accordion-item") || // Added accordion-item
                         document.body;
      
      // Get all text content
      let content = mainContent.innerText;
      
      // Clean up the content - remove excessive whitespace
      content = content.replace(/\s+/g, ' ').trim();
      
      // Log the first part of the content for debugging
      console.log("Scraped content (first 100 chars):", content.substring(0, 100));
      
      return content;
    } catch (error) {
      console.error("Error scraping page content:", error);
      return "Could not scrape page content.";
    }
  }
  
  // Initialize chat widget
  function initChatWidget() {
    console.log("Initializing chat widget...");
    
    // Create container and iframe
    const container = createChatContainer();
    const iframe = createChatIframe();
    container.appendChild(iframe);
    document.body.appendChild(container);
    
    // Get page content
    const pageContent = scrapePageContent();
    
    // Setup event handler for when iframe is loaded
    iframe.onload = function() {
      console.log("Iframe loaded, preparing to send content...");
      setTimeout(() => {
        console.log("Sending IFRAME_READY message to iframe...");
        iframe.contentWindow.postMessage({
          type: "IFRAME_READY_TRIGGER"
        }, "*");
      }, 1000); // Give the iframe some time to initialize
    };
    
    // When iframe is ready, send the page content
    window.addEventListener("message", function(event) {
      // Check origin for security
      if (event.origin !== CHAT_APP_URL && !event.origin.includes('lovable.app')) {
        // Only log if it's not from lovable domains to reduce console spam
        if (!event.origin.includes('lovable') && !event.origin.includes('localhost')) {
          console.log("Received message from unexpected origin:", event.origin);
        }
        return;
      }
      
      console.log("Received message from iframe:", event.data?.type);
      
      if (event.data && event.data.type === "IFRAME_READY") {
        console.log("Iframe is ready, sending page content...");
        iframe.contentWindow.postMessage({
          type: "PAGE_CONTENT",
          content: pageContent
        }, "*");
      }
    });
    
    return {
      container: container,
      iframe: iframe
    };
  }
  
  // Start the widget when page is fully loaded
  if (document.readyState === "complete") {
    console.log("Document already complete, initializing widget now");
    initChatWidget();
  } else {
    console.log("Setting up load listener for widget initialization");
    window.addEventListener("load", function() {
      console.log("Document loaded, initializing widget now");
      initChatWidget();
    });
  }
})();
