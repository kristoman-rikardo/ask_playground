
/**
 * Chat Widget Injection Script
 * This script places a chat widget above accordion items on FAQ pages.
 */

(function() {
  // Configuration
  const CHAT_APP_URL = "https://sleek-faq-buddy.lovable.app/"; // Updated URL to the actual deployed app
  const TARGET_SELECTOR = ".accordion-item"; // The class of elements to place the widget above
  const WIDGET_MAX_HEIGHT = "800px";
  
  // Create container for the chat widget that sits above the target element
  function createChatContainer(targetElement) {
    const container = document.createElement("div");
    container.id = "chat-widget-container";
    container.style.width = `${targetElement.offsetWidth}px`;
    container.style.maxHeight = WIDGET_MAX_HEIGHT;
    container.style.marginBottom = "20px";
    container.style.zIndex = "1000";
    container.style.borderRadius = "12px";
    container.style.overflow = "hidden";
    container.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.15)";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    return container;
  }
  
  // Create the iframe that will contain the chat widget
  function createChatIframe() {
    const iframe = document.createElement("iframe");
    iframe.src = CHAT_APP_URL;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.borderRadius = "12px";
    iframe.style.flexGrow = "1";
    return iframe;
  }
  
  // Scrape content from the specific target element
  function scrapeContent(targetElement) {
    try {
      let content = targetElement.innerText || "";
      
      // If there's no content or it's too short, get content from parent elements
      if (!content || content.length < 50) {
        const parentSection = targetElement.closest('section') || 
                             targetElement.closest('article') || 
                             targetElement.closest('.content-section');
        
        if (parentSection) {
          content = parentSection.innerText || content;
        }
      }
      
      // Clean up the content - remove excessive whitespace
      content = content.replace(/\s+/g, ' ').trim();
      
      return content || "FAQ content";
    } catch (error) {
      console.error("Error scraping content:", error);
      return "Could not scrape content.";
    }
  }
  
  // Initialize chat widget above the first matching element
  function initChatWidget() {
    console.log("Initializing chat widget...");
    const targetElements = document.querySelectorAll(TARGET_SELECTOR);
    if (!targetElements.length) {
      console.warn("No target elements found for chat widget");
      return;
    }
    
    console.log("Found target elements:", targetElements.length);
    
    // Use the first matching element as our target
    const targetElement = targetElements[0];
    
    // Create container and iframe
    const container = createChatContainer(targetElement);
    const iframe = createChatIframe();
    container.appendChild(iframe);
    
    // Insert before the target element (placing it above)
    targetElement.parentNode.insertBefore(container, targetElement);
    
    // Handle window resize to keep container width matching target element
    window.addEventListener("resize", function() {
      container.style.width = `${targetElement.offsetWidth}px`;
    });
    
    // Get content from the target element
    const content = scrapeContent(targetElement);
    console.log("Scraped content:", content.substring(0, 100) + "...");
    
    // Wait for iframe to be ready, then send content
    window.addEventListener("message", function(event) {
      if (event.data && event.data.type === "IFRAME_READY") {
        console.log("Iframe is ready, sending content...");
        iframe.contentWindow.postMessage({
          type: "PAGE_CONTENT",
          content: content
        }, "*");
      }
      
      // Dynamically set minimum height based on buttons loading
      if (event.data && event.data.type === "BUTTONS_LOADING_HEIGHT") {
        console.log("Received button height:", event.data.height);
        container.style.minHeight = `${event.data.height}px`;
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
