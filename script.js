(function() {
  // Konfigurasjon - kan endres basert på implementasjon
  const config = {
    apiKey: 'VF.DM.67f3a3aabc8d1cb788d71d55.oO0bhO9dNnsn67Lv',
    projectID: '67f291952280faa3b19ddfcb',
    cssPath: 'https://kristoman-rikardo.github.io/ask1proto-21/dist/widget/chatWidget.css',
    jsPath: 'https://kristoman-rikardo.github.io/ask1proto-21/dist/widget/chatWidget.js',
    scrapePath: 'https://kristoman-rikardo.github.io/ask1proto-21/scrapeSite.js',
    containerID: 'ask-chat-widget-container',
    targetSelector: '.product-accordion',
    minHeight: 300,
    debug: false
  };
  
  // Globale variabler for å holde styr på widgetstatus
  let isWidgetInitialized = false;
  let logContainer = null;
  
  // Opprett en logger for debugging
  function setupLogging() {
    if (!config.debug) return;
    
    // Opprett container for loggmeldinger
    logContainer = document.createElement('div');
    logContainer.id = 'ask-debug-log';
    logContainer.style.cssText = `
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      padding: 10px;
      margin: 10px 0;
      font-family: monospace;
      max-height: 200px;
      overflow: auto;
      display: ${config.debug ? 'block' : 'none'};
      font-size: 12px;
      line-height: 1.2;
    `;
    
    // Sett inn loggcontaineren i dokumentet
    document.body.appendChild(logContainer);
  }
  
  // Loggfunksjon
  function log(message) {
    const time = new Date().toLocaleTimeString();
    const formattedMsg = `[${time}] [AskWidget] ${message}`;
    
    // Logg til konsoll uansett
    console.log(formattedMsg);
    
    // Logg til UI-container hvis debug er aktivert
    if (config.debug && logContainer) {
      const entry = document.createElement('div');
      entry.textContent = formattedMsg;
      entry.style.borderBottom = '1px solid #eee';
      entry.style.padding = '2px 0';
      logContainer.appendChild(entry);
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }
  
  // Finn target-elementet og sett inn widget-containeren
  function setupContainer() {
    log('Setting up widget container');
    
    // Finn elementet der widgeten skal settes inn
    const targetElement = document.querySelector(config.targetSelector);
    if (!targetElement) {
      log('ERROR: Could not find target element: ' + config.targetSelector);
      return false;
    }
    
    // Sjekk om en container allerede finnes, fjern den først
    const existingContainer = document.getElementById(config.containerID);
    if (existingContainer) {
      existingContainer.remove();
      log('Removed existing widget container');
    }
    
    // Opprett ny container for chat-widgeten
    const container = document.createElement('div');
    container.id = config.containerID;
    
    // Sett grunnleggende stiler på containeren
    container.style.cssText = `
      width: 100%;
      max-width: 100%;
      margin: 20px 0;
      position: relative;
      display: none;
      opacity: 0;
      transition: opacity 0.3s ease;
      overflow: visible !important;
      min-height: ${config.minHeight}px;
      height: auto !important;
      box-sizing: border-box;
    `;
    
    // Sjekk om koden kjøres innebygd (tredjepartsside) og deaktiver autoscroll/autofokus
    const isEmbedded = window.top !== window.self;
    if (isEmbedded) {
      // Overstyr scrollIntoView- og focus-metoden
      container.scrollIntoView = function() {};
      container.focus = function() {};
    }
    
    // Sett inn containeren etter target-elementet
    targetElement.insertAdjacentElement('afterend', container);
    log('Widget container created and inserted into page');
    
    return true;
  }
  
  // Last inn nødvendige stilark
  function loadStyles() {
    log('Loading widget styles');
    
    return new Promise((resolve) => {
      // Last inn stilark for widgeten
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = config.cssPath;
      
      link.onload = () => {
        log('Widget stylesheet loaded');
        resolve();
      };
      
      link.onerror = () => {
        log('WARNING: Failed to load widget stylesheet');
        resolve(); // Fortsett likevel
      };
      
      document.head.appendChild(link);
    });
  }
  
  // Funksjon for å måle faktisk høyde av widget
  function measureWidgetHeight() {
    const container = document.getElementById(config.containerID);
    if (!container) return 0;
    
    // Prøv å finne høyde gjennom shadow DOM
    if (container.shadowRoot) {
      const shadowContainer = container.shadowRoot.getElementById('chat-widget-shadow-container');
      if (shadowContainer) {
        return shadowContainer.scrollHeight;
      }
    }
    
    // Prøv å finne via children hvis vi har tilgang
    const calculateMaxChildHeight = (element) => {
      if (!element) return 0;
      let height = element.offsetHeight || element.scrollHeight || 0;
      
      // Sjekk barn rekursivt
      Array.from(element.children || []).forEach(child => {
        const childHeight = calculateMaxChildHeight(child);
        height = Math.max(height, childHeight);
      });
      
      return height;
    };
    
    // Beregn høyde basert på alle barn
    return Math.max(calculateMaxChildHeight(container), container.scrollHeight, config.minHeight);
  }
  
  // Funksjon for å sette container høyde
  function setContainerHeight(height) {
    const container = document.getElementById(config.containerID);
    if (!container) return;
    
    // Bruk viktige stiler for å overstyre eventuelle Shadow DOM styles
    container.style.minHeight = `${height}px !important`;
    container.style.height = 'auto !important';
    
    log(`Container height set to ${height}px`);
  }
  
  // Vis widgeten
  function showWidget() {
    log('Showing widget with fade-in effect');
    const container = document.getElementById(config.containerID);
    if (!container) return;
    
    container.style.display = 'block';
    
    // Liten forsinkelse før opacity settes for å sikre at display-endringen har tatt effekt
    setTimeout(() => {
      container.style.opacity = '1';
      log('Widget now visible');
    }, 10);
  }
  
  // Kontinuerlig høydejustering
  function setupHeightMonitoring() {
    log('Setting up continuous height monitoring');
    
    const container = document.getElementById(config.containerID);
    if (!container) return;
    
    // Første høydejustering
    const initialHeight = measureWidgetHeight();
    setContainerHeight(initialHeight || config.minHeight);
    
    // Periodisk høydesjekk (hyppig i begynnelsen, så mindre hyppig)
    const checkHeight = () => {
      const height = measureWidgetHeight();
      if (height > 0) {
        setContainerHeight(height);
      }
    };
    
    // Kjør høydesjekk med ulike intervaller for å fange opp endringer
    const intervals = [100, 300, 500, 1000, 2000];
    intervals.forEach(delay => {
      setTimeout(checkHeight, delay);
    });
    
    // Langsiktig intervallsjekk for å fange opp senere endringer
    setInterval(checkHeight, 2000);
    
    // Observer DOM-endringer hvis MutationObserver er tilgjengelig
    if (window.MutationObserver) {
      const observer = new MutationObserver(checkHeight);
      
      observer.observe(container, { 
        childList: true, 
        subtree: true, 
        attributes: true,
        characterData: true 
      });
      
      log('MutationObserver activated for DOM changes');
    }
  }
  
  // Håndter scrapeComplete-hendelsen
  function handleScrapeComplete(event) {
    // Sjekk om widget allerede er initialisert
    if (isWidgetInitialized) {
      log('Widget already initialized, ignoring duplicate scrapeComplete event');
      return;
    }
    
    log('Received scrapeComplete event');
    const { side_innhold, browser_url } = event.detail || {};
    
    if (!side_innhold || side_innhold.length === 0) {
      log('ERROR: No content extracted from page');
      return;
    }
    
    log(`Content extracted successfully, length: ${side_innhold.length}`);
    
    // Marker at widgeten er initialisert for å unngå duplikat-initialisering
    isWidgetInitialized = true;
    
    // Sett opp containeren for å sikre at den er synlig før initialisering
    const container = document.getElementById(config.containerID);
    if (!container) {
      log('ERROR: Container not found during initialization');
      return;
    }
    
    // Forbered containeren
    container.style.minHeight = `${config.minHeight}px`;
    container.style.height = 'auto';
    
    log('Initializing widget with scraped content');
    
    // Initialiser widget
    if (window.ChatWidget) {
      // Kjør i en try-catch for å fange opp eventuelle feil
      try {
        window.ChatWidget.init({
          containerId: config.containerID,
          apiKey: config.apiKey,
          projectID: config.projectID,
          disableAutoScroll: true, // Alltid deaktivere auto-scroll i embedded miljø
          useShadowDOM: true,      // Bruk Shadow DOM for isolasjon
          launchConfig: {
            event: {
              type: "launch",
              payload: {
                browser_url: browser_url || window.location.href,
                side_innhold: side_innhold
              }
            }
          }
        });
        
        log('Widget successfully initialized');
        
        // Vis widget og start høydemonitorering
        setTimeout(() => {
          showWidget();
          setupHeightMonitoring();
        }, 300);
      } catch (error) {
        log(`ERROR: Failed to initialize widget: ${error.message}`);
        isWidgetInitialized = false; // Reset flag for å tillate nytt forsøk
      }
    } else {
      log('ERROR: ChatWidget is not available');
      isWidgetInitialized = false;
    }
  }
  
  // Last inn chat widget-kjernen
  function loadWidgetScript() {
    log('Loading widget script');
    
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = config.jsPath;
      
      script.onload = () => {
        log('Widget script loaded successfully');
        resolve(true);
      };
      
      script.onerror = () => {
        log('ERROR: Failed to load widget script');
        resolve(false);
      };
      
      document.body.appendChild(script);
    });
  }
  
  // Last inn skrapeskriptet
  function loadScrapeScript() {
    log('Loading scrape script');
    
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = config.scrapePath;
      
      script.onload = () => {
        log('Scrape script loaded successfully');
        resolve(true);
      };
      
      script.onerror = () => {
        log('ERROR: Failed to load scrape script');
        resolve(false);
      };
      
      document.body.appendChild(script);
    });
  }
  
  // Hovedfunksjon for å initialisere alt
  async function initialize() {
    // Sett opp logging
    setupLogging();
    log('Ask widget initialization started');
    
    // Sett opp container
    if (!setupContainer()) {
      log('Failed to set up container, aborting initialization');
      return;
    }
    
    // Last inn stiler
    await loadStyles();
    
    // Registrer lytter for scrape-hendelsen
    window.addEventListener('scrapeComplete', handleScrapeComplete);
    
    // Last inn widget-script
    const widgetLoaded = await loadWidgetScript();
    if (!widgetLoaded) {
      log('Widget script failed to load, aborting initialization');
      return;
    }
    
    // Last inn scrape-script
    const scrapeLoaded = await loadScrapeScript();
    if (!scrapeLoaded) {
      log('WARNING: Scrape script failed to load');
    }
    
    log('Initialization complete, waiting for content to be scraped');
    
    // Sikkerhetsnett: Hvis scrapeComplete aldri kommer, prøv å trigger manuelt etter en viss tid
    setTimeout(() => {
      if (!isWidgetInitialized) {
        log('WARNING: No scrapeComplete event received, trying to initialize manually');
        // Prøv å få innhold fra .product-accordion eller annet relevant element
        const targetElement = document.querySelector(config.targetSelector);
        if (targetElement) {
          const content = targetElement.innerText || document.body.innerText;
          if (content) {
            // Dispatche en custom scrapeComplete event
            window.dispatchEvent(new CustomEvent('scrapeComplete', {
              detail: {
                side_innhold: content,
                browser_url: window.location.href
              }
            }));
          }
        }
      }
    }, 5000); // 5 sekunders timeout
  }
  
  // Start initialiseringen når DOM er ferdig lastet
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM er allerede lastet
    initialize();
  }
})();