
/**
 * Chat Widget Injection Script
 * This script scrapes the current page's content and injects the chat widget iframe.
 */

(function() {
  // Configuration
  const CHAT_APP_URL = "https://your-deployed-app-url.com"; // Replace with your deployed app URL
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
    iframe.src = CHAT_APP_URL;
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.style.border = "none";
    iframe.style.borderRadius = "12px";
    return iframe;
  }
  
  // Scrape page content
  function scrapePageContent() {
    try {
      // Get main content - exclude navigation, footers, ads, etc.
      const mainContent = document.querySelector("main") || 
                         document.querySelector("article") || 
                         document.querySelector(".content") || 
                         document.body;
      
      // Get all text content
      let content = mainContent.innerText;
      
      // Clean up the content - remove excessive whitespace
      content = content.replace(/\s+/g, ' ').trim();
      
      return content;
    } catch (error) {
      console.error("Error scraping page content:", error);
      return "Could not scrape page content.";
    }
  }
  
  // Initialize chat widget
  function initChatWidget() {
    // Create container and iframe
    const container = createChatContainer();
    const iframe = createChatIframe();
    container.appendChild(iframe);
    document.body.appendChild(container);
    
    // Get page content
    const pageContent = scrapePageContent();
    console.log("Scraped page content:", pageContent.substring(0, 100) + "...");
    
    // When iframe is ready, send the page content
    window.addEventListener("message", function(event) {
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
    initChatWidget();
  } else {
    window.addEventListener("load", initChatWidget);
  }
})();
