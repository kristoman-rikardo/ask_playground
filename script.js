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
    resizeInterval: 1000, // Økt til 1000ms for bedre ytelse
    voiceflowTimeout: 15000, // Timeout for Voiceflow API i millisekunder
    performanceMode: true,   // Reduserer antall oppdateringer for bedre ytelse
    debug: false             // Setter til false for produksjonsmiljø
  };
  
  // Globale variabler for å holde styr på widgetstatus
  let isWidgetInitialized = false;
  let widgetFullyInitialized = false; // For å holde styr på om widgeten er fullt initialisert
  let canUseShadowDOM = true;
  let lastMeasuredHeight = 0;
  let resizeIntervalId = null;
  let overrideStyleElement = null;
  let activeMutationObservers = []; // For å holde styr på aktive observers for cleanup
  let activeTimers = []; // For å holde styr på aktive timers for cleanup
  
  // Enkel logging kun til konsoll
  function log(message) {
    if (config.debug) {
      console.log(`[AskWidget] ${message}`);
    }
  }
  
  // Test om Shadow DOM faktisk fungerer i denne konteksten
  function testShadowDOMSupport() {
    try {
      // Prøv å opprette et midlertidig element og legge til Shadow DOM
      const testDiv = document.createElement('div');
      const shadow = testDiv.attachShadow({ mode: 'open' });
      
      // Verifiser at Shadow DOM ble opprettet og er tilgjengelig
      if (shadow && testDiv.shadowRoot) {
        // Test om vi faktisk kan manipulere Shadow DOM
        const testParagraph = document.createElement('p');
        testParagraph.textContent = 'Shadow DOM Test';
        shadow.appendChild(testParagraph);
        
        // Verifiser at elementet ble lagt til
        const success = testDiv.shadowRoot.querySelector('p') !== null;
        
        // Fjern test-elementer
        testDiv.remove();
        
        return success;
      }
      return false;
    } catch (error) {
      log(`Shadow DOM not supported: ${error.message}`);
      return false;
    }
  }
  
  // Legg til globale CSS-overstyringer
  function addGlobalStyles() {
    // Fjern eventuelt eksisterende stilark først
    if (overrideStyleElement) {
      overrideStyleElement.remove();
    }
    
    // Opprett nytt stilark med høyest prioritet
    overrideStyleElement = document.createElement('style');
    overrideStyleElement.id = 'ask-widget-global-overrides';
    
    // Bruk spesifisitetshakkene for å sikre høyere prioritet
    // :not(#\9) er et hack som øker spesifisitet uten å endre visning
    overrideStyleElement.innerHTML = `
      /* Globale stiler for å sikre at widget-containeren kan ekspandere fritt */
      #${config.containerID}:not(#\\9):not(#\\9):not(#\\9) {
        height: auto !important;
        min-height: ${config.minHeight}px !important;
        max-height: none !important;
        overflow: visible !important;
        position: relative !important;
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        box-sizing: border-box !important;
        flex: 1 1 auto !important;
        resize: none !important;
        width: 100% !important;
        z-index: 100 !important;
      }
      
      /* Sikre at Shadow DOM wrapper også kan ekspandere */
      #${config.containerID}:not(#\\9) > div,
      #${config.containerID}:not(#\\9) .chat-widget-shadow-container,
      #${config.containerID}:not(#\\9) .chat-interface,
      #${config.containerID}:not(#\\9) .chat-messages-container,
      #${config.containerID}:not(#\\9) .chat-messages-scroll-container,
      #${config.containerID}:not(#\\9) .messages-list,
      #${config.containerID}:not(#\\9) .message-item {
        height: auto !important;
        max-height: none !important;
        min-height: inherit !important;
        overflow: visible !important;
        visibility: visible !important;
        display: block !important;
      }
      
      /* Spesifikk stil for å sikre at shadow-container er synlig */
      #chat-widget-shadow-container {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
    `;
    
    // Legg til stilarket i head med høyest prioritet
    document.head.appendChild(overrideStyleElement);
    log('Added global CSS overrides');
  }
  
  // Finn target-elementet og sett inn widget-containeren
  function setupContainer() {
    log('Setting up widget container');
    
    // Legg til globale stiler først
    addGlobalStyles();
    
    // Finn elementet der widgeten skal settes inn
    const targetElement = document.querySelector(config.targetSelector);
    if (!targetElement) {
      // Hvis den spesifikke selektoren ikke finnes, prøv alternative selektorer
      log('Could not find target element: ' + config.targetSelector);
      log('Trying alternative selectors...');
      
      const alternativeSelectors = [
        '.product-accordion',
        '.product-description',
        '.product-info',
        '.product-details',
        'main',
        '.main-content',
        'body'
      ];
      
      for (const selector of alternativeSelectors) {
        const alt = document.querySelector(selector);
        if (alt) {
          log('Found alternative target: ' + selector);
          targetElement = alt;
          break;
        }
      }
      
      if (!targetElement) {
        // Fallback til body hvis ingen selektorer fungerer
        targetElement = document.body;
        log('Using document.body as fallback container');
      }
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
    
    // Legg til både inline style og data-attributter for CSS-selektering
    container.setAttribute('data-ask-widget', 'true');
    container.setAttribute('data-expandable', 'true');
    
    // Bruk inline style med !important for å overstyre eksterne stiler
    container.setAttribute('style', `
      width: 100% !important;
      max-width: 100% !important;
      margin: 20px 0 !important;
      position: relative !important;
      display: none;
      opacity: 0;
      transition: opacity 0.3s ease, height 0.3s ease !important;
      overflow: visible !important;
      min-height: ${config.minHeight}px !important;
      height: auto !important;
      max-height: none !important;
      box-sizing: border-box !important;
      resize: none !important;
      flex: 1 1 auto !important;
      z-index: 100 !important;
      border: 1px solid transparent !important;
    `);
    
    // Deaktiver autoscroll og autofokus
    container.scrollIntoView = function() {};
    container.focus = function() {};
    
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
        log('Failed to load widget stylesheet');
        resolve(); // Fortsett likevel
      };
      
      document.head.appendChild(link);
    });
  }
  
  // Funksjon for å måle faktisk høyde av widget
  function measureWidgetHeight() {
    const container = document.getElementById(config.containerID);
    if (!container) return 0;
    
    let measuredHeight = 0;
    
    // Prøv å finne høyde gjennom shadow DOM hvis det er støttet
    if (canUseShadowDOM && container.shadowRoot) {
      try {
        // Sjekk hovedcontaineren først
        const shadowContainer = container.shadowRoot.getElementById('chat-widget-shadow-container');
        if (shadowContainer) {
          measuredHeight = Math.max(measuredHeight, shadowContainer.scrollHeight);
          
          // Sjekk også den faktiske høyden til shadowRoot
          measuredHeight = Math.max(measuredHeight, container.shadowRoot.host.scrollHeight);
        }
        
        // Sjekk også andre viktige elementer i Shadow DOM
        const selectors = [
          '#chat-widget-shadow-container',
          '.chat-interface',
          '.chat-messages-container',
          '.chat-messages-scroll-container',
          '.messages-list'
        ];
        
        selectors.forEach(selector => {
          const elements = container.shadowRoot.querySelectorAll(selector);
          elements.forEach(el => {
            if (el) {
              // Sjekk alle mulige høyde-attributter
              measuredHeight = Math.max(
                measuredHeight, 
                el.scrollHeight || 0, 
                el.offsetHeight || 0, 
                el.clientHeight || 0
              );
            }
          });
        });
      } catch (e) {
        log(`Error measuring Shadow DOM height: ${e.message}`);
      }
    }
    
    // Fallback: Beregn høyde fra DOM-strukturen direkte
    if (measuredHeight <= 0) {
      try {
        // Sjekk container selv først
        measuredHeight = Math.max(
          measuredHeight, 
          container.scrollHeight || 0,
          container.offsetHeight || 0,
          container.clientHeight || 0
        );
        
        // Beregn høyde rekursivt fra alle barn
        const calculateMaxChildHeight = (element) => {
          if (!element) return 0;
          let height = element.offsetHeight || element.scrollHeight || element.clientHeight || 0;
          
          // Sjekk barn rekursivt
          Array.from(element.children || []).forEach(child => {
            const childHeight = calculateMaxChildHeight(child);
            height = Math.max(height, childHeight);
          });
          
          return height;
        };
        
        const childrenHeight = calculateMaxChildHeight(container);
        measuredHeight = Math.max(measuredHeight, childrenHeight);
      } catch (e) {
        log(`Error measuring DOM height: ${e.message}`);
      }
    }
    
    // Beregn endelig høyde, men aldri mindre enn minimumshøyden
    const finalHeight = Math.max(measuredHeight, config.minHeight);
    
    // Logg betydelige høydeendringer
    if (Math.abs(finalHeight - lastMeasuredHeight) > 10) {
      lastMeasuredHeight = finalHeight;
      log(`Measured new height: ${finalHeight}px`);
    }
    
    return finalHeight;
  }
  
  // Funksjon for å sette container høyde
  function setContainerHeight(height) {
    const container = document.getElementById(config.containerID);
    if (!container) return;
    
    // Sett direkte på style-attributtet for høyeste prioritet
    const currentStyle = container.getAttribute('style') || '';
    const updatedStyle = currentStyle
      .replace(/min-height:[^;]+;/g, '')
      .replace(/height:[^;]+;/g, '')
      .replace(/max-height:[^;]+;/g, '') +
      `min-height: ${height}px !important; height: auto !important; max-height: none !important;`;
    
    container.setAttribute('style', updatedStyle);
    
    // Sett verdier direkte via style-objektet også for å være sikker
    container.style.minHeight = `${height}px !important`;
    container.style.height = 'auto !important';
    container.style.maxHeight = 'none !important';
    
    // Oppdater data-attributt for debugging
    container.setAttribute('data-height', height.toString());
    
    // Fjern høydebegrensninger på DOM-elementer også når Shadow DOM ikke brukes
    if (!canUseShadowDOM) {
      removeHeightRestrictions(container);
    }
    
    // Prøv å modifisere Shadow DOM direkte hvis tilgjengelig
    if (canUseShadowDOM && container.shadowRoot) {
      try {
        // Fjern høydebegrensninger på shadow container
        const shadowContainer = container.shadowRoot.getElementById('chat-widget-shadow-container');
        if (shadowContainer) {
          shadowContainer.style.minHeight = `${height}px`;
          shadowContainer.style.height = 'auto';
          shadowContainer.style.maxHeight = 'none';
          shadowContainer.style.overflow = 'visible';
        }
        
        // Fjern høydebegrensninger på alle relevante elementer i Shadow DOM
        removeHeightRestrictions(container.shadowRoot);
      } catch (e) {
        log(`Error modifying Shadow DOM styles: ${e.message}`);
      }
    }
  }
  
  // Fjern alle høydebegrensninger fra en DOM-struktur
  function removeHeightRestrictions(rootElement) {
    if (!rootElement) return;
    
    const elementsToFix = rootElement.querySelectorAll(
      '.chat-interface, .chat-messages-container, .messages-list, .message-item, .chat-messages-scroll-container'
    );
    
    elementsToFix.forEach(el => {
      if (el) {
        el.style.height = 'auto !important';
        el.style.maxHeight = 'none !important';
        el.style.overflow = 'visible !important';
        
        // For spesifikke komponenter, fjern max-height via attributt også
        el.setAttribute('style', (el.getAttribute('style') || '') + 
          'height: auto !important; max-height: none !important; overflow: visible !important;');
      }
    });
  }
  
  // Vis widgeten - optimalisert for ytelse
  function showWidget() {
    log('Showing widget');
    const container = document.getElementById(config.containerID);
    if (!container) {
      log('ERROR: Container not found when trying to show widget');
      return;
    }
    
    // Bruk en enklere tilnærming med mindre DOM-manipulasjon
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    container.style.height = 'auto';
    
    // Kjør en initial høydemåling
    const initialHeight = measureWidgetHeight() || config.minHeight;
    setContainerHeight(initialHeight);
    
    // Legg til attributt for debugging
    container.setAttribute('data-visible', 'true');
    
    // Sjekk høyden én gang etter en kort forsinkelse
    createTimeout(() => {
      const newHeight = measureWidgetHeight();
      if (newHeight > initialHeight) {
        setContainerHeight(newHeight);
      }
    }, 300);
  }
  
  // Kontinuerlig høydejustering - optimalisert for ytelse
  function setupHeightMonitoring() {
    const container = document.getElementById(config.containerID);
    if (!container) return;
    
    log('Setting up height monitoring (optimized)');
    
    // Oppdater globale stiler først
    addGlobalStyles();
    
    // Første høydejustering
    checkAndUpdateHeight();
    
    // Stopp eventuell eksisterende intervall
    if (resizeIntervalId) {
      clearInterval(resizeIntervalId);
    }
    
    // Reduser hyppighet av polling i perfomance-modus
    const intervalTime = config.performanceMode ? config.resizeInterval * 2 : config.resizeInterval;
    
    // Hyppig polling for å fange opp endringer, men begrenset for ytelse
    resizeIntervalId = setInterval(() => {
      checkAndUpdateHeight();
      
      // Sjekk om stilen fortsatt er tilstede, men med redusert frekvens
      if (!document.getElementById('ask-widget-global-overrides') && Math.random() < 0.2) {
        addGlobalStyles();
      }
    }, intervalTime);
    
    // Kjør høydesjekk, men med færre intervaller for bedre ytelse
    const intervals = config.performanceMode 
      ? [500, 2000, 5000] 
      : [100, 300, 600, 1000, 2000, 3000, 5000];
    
    intervals.forEach(delay => {
      createTimeout(checkAndUpdateHeight, delay);
    });
    
    // Observer DOM-endringer med MutationObserver, men med smartere filtrering
    if (window.MutationObserver) {
      try {
        // Opprett en observer for chat-relaterte endringer
        const observer = new MutationObserver((mutations) => {
          // Bruk en debounce-teknikk for å redusere antall oppdateringer
          if (observer._debounceTimer) {
            clearTimeout(observer._debounceTimer);
          }
          
          // Planlegg en oppdatering men med en liten forsinkelse
          observer._debounceTimer = setTimeout(() => {
            checkAndUpdateHeight();
          }, 100);
        });
        
        // Observer container med fokus på barneelementer og attributter
        observer.observe(container, { 
          childList: true,    // Observerer nye barn
          subtree: true,      // Observerer dypt i DOM-treet
          attributes: true,   // Observerer attributt-endringer
          attributeFilter: ['style', 'class'], // Men bare de viktigste attributtene
          characterData: false // Ikke bry oss om tekstendringer
        });
        
        // Legg til observeren i vår liste for opprydding senere
        activeMutationObservers.push(observer);
        
        // Observer Shadow DOM kun hvis det er støttet OG vi er ikke i performance-modus
        if (canUseShadowDOM && container.shadowRoot && !config.performanceMode) {
          try {
            const shadowObserver = new MutationObserver(() => {
              // Bruk samme debounce-teknikk
              if (shadowObserver._debounceTimer) {
                clearTimeout(shadowObserver._debounceTimer);
              }
              
              shadowObserver._debounceTimer = setTimeout(() => {
                checkAndUpdateHeight();
              }, 100);
            });
            
            // Observer shadow DOM med fokus på de viktigste endringene
            shadowObserver.observe(container.shadowRoot, { 
              childList: true, 
              subtree: true,
              attributes: true,
              attributeFilter: ['style', 'class'],
              characterData: false
            });
            
            // Legg til i listen for opprydding
            activeMutationObservers.push(shadowObserver);
            log('Monitoring Shadow DOM for changes (optimized)');
          } catch (e) {
            log(`Could not observe Shadow DOM: ${e.message}`);
          }
        }
      } catch (e) {
        log(`Error setting up MutationObserver: ${e.message}`);
      }
    }
    
    // Lytt på noen hendelser men reduser hvor mange vi lytter på for ytelse
    window.addEventListener('resize', checkAndUpdateHeight);
    
    if (!config.performanceMode) {
      document.addEventListener('click', function() {
        // Sjekk om klikket skjedde i eller nær vår container
        createTimeout(checkAndUpdateHeight, 100);
      });
    }
  }
  
  // Mer effektiv sjekk og oppdatering av høyde
  function checkAndUpdateHeight() {
    // Implement throttling for better performance
    if (checkAndUpdateHeight._lastRun && 
        Date.now() - checkAndUpdateHeight._lastRun < 100) {
      return; // Skip if we've run this very recently
    }
    
    checkAndUpdateHeight._lastRun = Date.now();
    
    const height = measureWidgetHeight();
    if (height > 0) {
      // Skip if the height change is minimal
      if (Math.abs(height - lastMeasuredHeight) < 5) {
        return;
      }
      
      lastMeasuredHeight = height;
      setContainerHeight(height);
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
      log('No content extracted from page');
      return;
    }
    
    // Marker at widgeten er initialisert for å unngå duplikat-initialisering
    isWidgetInitialized = true;
    
    // Sett opp containeren for å sikre at den er synlig før initialisering
    const container = document.getElementById(config.containerID);
    if (!container) {
      log('Container not found during initialization');
      return;
    }
    
    // Forbered containeren
    container.style.minHeight = `${config.minHeight}px`;
    container.style.height = 'auto';
    container.style.maxHeight = 'none';
    
    log('Initializing widget with scraped content');

    // Initialiser widget
    if (window.ChatWidget) {
      // Kjør i en try-catch for å fange opp eventuelle feil
      try {
        // Oppsett for timeout for Voiceflow-forespørseler
        const originalFetch = window.fetch;
        
        // Hvis vi ikke allerede har overskrevet fetch
        if (!window.fetch._patched) {
          window.fetch = function(url, options) {
            // Sjekk om dette er en Voiceflow API-forespørsel
            const isVoiceflowRequest = typeof url === 'string' && (
              url.includes('voiceflow.com') || 
              url.includes('vfre') || 
              url.includes('vf.to')
            );
            
            if (isVoiceflowRequest) {
              log('Detected Voiceflow API request, adding timeout');
              
              // Opprett en AbortController for å kunne kansellere forespørselen
              const controller = new AbortController();
              
              // Opprett en timeout for å kansellere forespørselen etter X sekunder
              const timeoutId = setTimeout(() => {
                controller.abort();
                log('Voiceflow request timed out after ' + config.voiceflowTimeout + 'ms');
              }, config.voiceflowTimeout);
              
              // Legg til signal til forespørselsopsjoner
              const fetchOptions = options || {};
              fetchOptions.signal = controller.signal;
              
              return originalFetch(url, fetchOptions)
                .then(response => {
                  clearTimeout(timeoutId);
                  return response;
                })
                .catch(error => {
                  clearTimeout(timeoutId);
                  log('Voiceflow request error: ' + error.message);
                  throw error;
                });
            }
            
            // For alle andre forespørsler, bruk original fetch
            return originalFetch(url, options);
          };
          
          // Marker at vi har overskrevet fetch
          window.fetch._patched = true;
        }
        
        // Bruk Shadow DOM bare hvis det er støttet
        const initOptions = {
          containerId: config.containerID,
          apiKey: config.apiKey,
          projectID: config.projectID,
          disableAutoScroll: true, // Alltid deaktivere auto-scroll
          useShadowDOM: canUseShadowDOM, // Bruk bare Shadow DOM hvis støttet
          injectCss: !canUseShadowDOM, // Direkte CSS-injeksjon hvis Shadow DOM ikke er tilgjengelig
          runtime: {
            timeout: config.voiceflowTimeout, // Timeout for Voiceflow
            maxRetries: 2,          // Antall ganger å prøve på nytt
            retryDelay: 1000        // Ventetid mellom nye forsøk
          },
          launchConfig: {
            event: {
              type: "launch",
              payload: {
                browser_url: browser_url || window.location.href,
                side_innhold: side_innhold.substring(0, 5000) // Begrens størrelsen for bedre ytelse
              }
            }
          }
        };
        
        log('Initializing ChatWidget with options');
        window.ChatWidget.init(initOptions);
        
        log(`Widget successfully initialized (${canUseShadowDOM ? 'with' : 'without'} Shadow DOM)`);
        
        // Overvåk Voiceflow-initalisering status
        let voiceflowStatusCheckCount = 0;
        const maxStatusChecks = 10;
        
        const checkVoiceflowStatus = () => {
          voiceflowStatusCheckCount++;
          
          // Sjekk om ChatWidget har initialisert riktig
          const widgetInitializedProperly = (
            window.ChatWidget && 
            window.ChatWidget.isInitialized && 
            document.getElementById(config.containerID)
          );
          
          if (widgetInitializedProperly) {
            log('ChatWidget fully initialized');
            widgetFullyInitialized = true;
            
            // Vis widget og start høydemonitorering med litt forsinkelse
            createTimeout(() => {
              addGlobalStyles(); // Oppdater stilene først
              showWidget(); // Vis widgeten
              setupHeightMonitoring(); // Start høydemonitorering
              
              // Ekstra forsikring: Fiks høyde og synlighet etter litt tid
              createTimeout(checkAndUpdateHeight, 1000);
              createTimeout(checkAndUpdateHeight, 2000);
            }, 300);
          } else if (voiceflowStatusCheckCount < maxStatusChecks) {
            // Fortsett å sjekke med eksponentiell backoff
            const delay = 500 * Math.pow(1.5, voiceflowStatusCheckCount - 1);
            createTimeout(checkVoiceflowStatus, delay);
          } else {
            // Maks antall forsøk nådd, prøv å vise widgeten uansett
            log('WARNING: ChatWidget initialization status could not be confirmed');
            widgetFullyInitialized = false;
            
            // Prøv å vise widgeten og recovere likevel
            createTimeout(() => {
              addGlobalStyles();
              showWidget();
              setupHeightMonitoring();
            }, 500);
          }
        };
        
        // Start første sjekk av Voiceflow-status
        createTimeout(checkVoiceflowStatus, 500);
        
      } catch (error) {
        log(`Failed to initialize widget: ${error.message}`);
        
        // Hvis feilen kan være relatert til Shadow DOM, prøv på nytt uten Shadow DOM
        if (canUseShadowDOM) {
          log('Retrying widget initialization without Shadow DOM');
          canUseShadowDOM = false;
          isWidgetInitialized = false; // Reset flag
          handleScrapeComplete(event); // Prøv igjen
        } else {
          isWidgetInitialized = false; // Reset flag for å tillate nytt forsøk
        }
      }
    } else {
      log('ChatWidget is not available');
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
        log('Failed to load widget script');
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
        log('Failed to load scrape script');
        resolve(false);
      };
      
      document.body.appendChild(script);
    });
  }

  // Hjelpefunksjon for å opprette forsinkelser som vi kan spore
  function createTimeout(callback, delay) {
    const timerId = setTimeout(() => {
      callback();
      // Fjern timeren fra listen når den er kjørt
      const index = activeTimers.indexOf(timerId);
      if (index > -1) {
        activeTimers.splice(index, 1);
      }
    }, delay);
    activeTimers.push(timerId);
    return timerId;
  }
  
  // Opprydd i ressurser
  function cleanupResources() {
    // Stopp alle aktive timers
    activeTimers.forEach(timerId => {
      clearTimeout(timerId);
    });
    activeTimers = [];
    
    // Stopp alle intervaller
    if (resizeIntervalId) {
      clearInterval(resizeIntervalId);
      resizeIntervalId = null;
    }
    
    // Koble fra alle MutationObservers
    activeMutationObservers.forEach(observer => {
      observer.disconnect();
    });
    activeMutationObservers = [];
    
    // Fjern eventuelle globale stilark
    if (overrideStyleElement && overrideStyleElement.parentNode) {
      overrideStyleElement.parentNode.removeChild(overrideStyleElement);
    }
    
    log('Cleaned up all resources');
  }
  
  // Registrer for cleanup ved side-navigering
  function setupCleanup() {
    window.addEventListener('beforeunload', cleanupResources);
    window.addEventListener('unload', cleanupResources);
  }
  
  // Hovedfunksjon for å initialisere alt - optimalisert for ytelse
  async function initialize() {
    log('Ask widget initialization started');
    
    // Sett opp opprydding først
    setupCleanup();
    
    // Test Shadow DOM-støtte
    canUseShadowDOM = testShadowDOMSupport();
    log(`Shadow DOM support: ${canUseShadowDOM ? 'Detected' : 'Not available'}`);
    
    // Legg til globale stiler tidlig men bare én gang
    addGlobalStyles();
    
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
    
    // Last inn scrape-script, men ikke vent på det
    loadScrapeScript().then(scrapeLoaded => {
      if (!scrapeLoaded) {
        log('Scrape script failed to load, will try manual fallback');
      }
    });
    
    log('Initialization complete, waiting for content to be scraped');
    
    // Sikkerhetsnett: Hvis scrapeComplete aldri kommer, prøv å trigger manuelt etter en viss tid
    createTimeout(() => {
      if (!isWidgetInitialized) {
        log('No scrapeComplete event received, trying to initialize manually');
        
        // Prøv å få innhold fra målselektoren eller annen relevant kilde
        let content = '';
        
        // Prøv spesifikk målselektor først
        const targetElement = document.querySelector(config.targetSelector);
        if (targetElement) {
          content = targetElement.innerText || targetElement.textContent || '';
        }
        
        // Hvis det ikke ga nok innhold, prøv å bruke hele sidens tekstinnhold
        if (!content || content.length < 100) {
          // Prøv å finne den beste tekstkilden på siden
          const possibleSources = [
            document.querySelector('main'),
            document.querySelector('.product-description'),
            document.querySelector('.product-details'),
            document.querySelector('article'),
            document.body
          ];
          
          for (const source of possibleSources) {
            if (source) {
              const sourceContent = source.innerText || source.textContent || '';
              if (sourceContent.length > content.length) {
                content = sourceContent;
              }
            }
          }
        }
        
        if (content && content.length > 0) {
          // Dispatche en custom scrapeComplete event med det vi fant
          window.dispatchEvent(new CustomEvent('scrapeComplete', {
            detail: {
              side_innhold: content.substring(0, 10000), // Begrens til 10k tegn for ytelse
              browser_url: window.location.href
            }
          }));
        }
      }
    }, 5000); // 5 sekunders timeout
  }
  
  // Følg med på laststatus og reagere riktig
  function monitorLoadState() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
    } else {
      // For dokumenter som allerede er lastet
      initialize();
    }
    
    // Også prøv å initialisere ved load-event, hvis DOMContentLoaded allerede har skjedd
    window.addEventListener('load', () => {
      if (!isWidgetInitialized) {
        initialize();
      }
    });
  }
  
  // Start monitorering av dokumentlastingen
  monitorLoadState();
})();