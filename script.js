(function() {
  const actionsWrapper = document.querySelector('.actions-wrapper');
  if (!actionsWrapper) {
    console.error('Could not find .actions-wrapper element');
    return;
  }

  // Create chat container
  const container = document.createElement('div');
  container.id = 'chat-widget-container';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.flex = '1 1 auto';
  actionsWrapper.insertAdjacentElement('afterend', container);

  // Inject styles
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://kristoman-rikardo.github.io/ask1proto-21/dist/widget/chatWidget.css';
  document.head.appendChild(link);

  // Load chat widget core
  const widgetScript = document.createElement('script');
  widgetScript.src = 'https://kristoman-rikardo.github.io/ask1proto-21/dist/widget/chatWidget.js';
  
  widgetScript.onload = function() {
    let widgetInitialized = false;

    // Setup event listener for scraping completion
    window.addEventListener('scrapeComplete', function(event) {
      if (widgetInitialized) return;
      
      const { side_innhold, browser_url } = event.detail;
      
      if (side_innhold) {
        console.log('Initializing with scraped content length:', side_innhold.length);
        
        window.ChatWidget?.init({
          containerId: 'chat-widget-container',
          apiKey: 'VF.DM.67f3a3aabc8d1cb788d71d55.oO0bhO9dNnsn67Lv',
          projectID: '67f291952280faa3b19ddfcb',
          launchConfig: {
            event: {
              type: "launch",
              payload: {
                browser_url: browser_url,
                side_innhold: side_innhold
              }
            }
          }
        });
        
        widgetInitialized = true;
      }
    });

    // Load scraping utility from a valid URL
    const scrapeScript = document.createElement('script');
    scrapeScript.src = 'https://kristoman-rikardo.github.io/ask1proto-21/scrapeSite.js';
    document.body.appendChild(scrapeScript);
  };

  document.body.appendChild(widgetScript);
})();
