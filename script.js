// script.js - Refactored and Optimized

(function() {
    'use strict';

    // --- 1. Configuration ---
    const config = {
        apiKey: 'VF.DM.67f3a3aabc8d1cb788d71d55.oO0bhO9dNnsn67Lv',
        projectID: '67f291952280faa3b19ddfcb',
        reportTagId: "68062ad1990094c1088b19d7", // Pre-defined conversion tag ID
        cssPath: './dist/widget/chatWidget.css', // Relative path to built CSS
        jsPath: './dist/widget/chatWidget.js',   // Relative path to built JS
        scrapePath: 'https://kristoman-rikardo.github.io/ask1proto-21/scrapeSite.js', // External scraper (or local path)
        containerID: 'ask-chat-widget-container',
        targetSelectorDesktop: '.actions',
        targetSelectorMobile: '.product-description__short-description',
        breakpoint: 768,
        minHeight: 150, // Adjusted minimum height
        voiceflowTimeout: 15000,
        manualScrapeFallbackTimeout: 5000,
        debug: true,
        conversionTagLabel: 'conversion', // For logging purposes
        addToCartSelectors: [
            '.actions__add-to-cart', '.add-to-cart', '.single_add_to_cart_button',
            'button[name="add"]', '[data-action="add-to-cart"]', 'button.cart-button',
            'input[value="Add to cart"]', 'button:contains("Add to Cart")',
            'button:contains("Legg i handlekurv")', '.woocommerce-loop-add-to-cart-link',
            '.buy-button'
        ]
    };

    // Simple logger
    function log(message) {
        if (config.debug) {
            console.log(`[AskWidget] ${message}`);
        }
    }

    // --- 2. State Variables ---
    let widgetContainer = null;
    let currentTargetType = null;
    let isInitialized = false;
    let isWidgetInstanceReady = false;
    let hasAddedScrapeListener = false;
    let scrapeFallbackTimer = null;
    let heightObserver = null;
    let heightDebounceTimer = null;
    const HEIGHT_DEBOUNCE_DELAY = 150;
    let conversionListenerActive = false;
    let originalFetch = null;


    // --- 3. DOM Utilities ---
    function getTargetSelector() {
        const isMobile = window.innerWidth < config.breakpoint;
        const targetType = isMobile ? 'mobile' : 'desktop';
        if (targetType !== currentTargetType) {
            log(`Screen size changed to ${targetType} (${window.innerWidth}px)`);
            currentTargetType = targetType;
        }
        return isMobile ? config.targetSelectorMobile : config.targetSelectorDesktop;
    }

    function findTargetElement(selector) {
        let targetElement = document.querySelector(selector);
        if (!targetElement) {
            log(`Could not find target element: ${selector}. Trying alternatives...`);
            const fallbacks = [
                config.targetSelectorDesktop, config.targetSelectorMobile,
                '.product-accordion', '.product-description', '.product-info',
                '.product-details', 'main', '.main-content', 'body'
            ].filter(s => s !== selector);

            for (const fbSelector of fallbacks) {
                targetElement = document.querySelector(fbSelector);
                if (targetElement) {
                    log(`Found alternative target: ${fbSelector}`);
                    break;
                }
            }
            if (!targetElement) {
                log('Using document.body as final fallback container.');
                targetElement = document.body;
            }
        }
        return targetElement;
    }

    function applyContainerStyles(containerElement) {
        const styles = {
            display: 'block', position: 'relative', width: '100%',
            overflow: 'visible', margin: '20px 0', padding: '0', border: 'none',
            minHeight: `${config.minHeight}px`, height: 'auto', maxHeight: 'none',
            boxSizing: 'border-box', opacity: '0', visibility: 'hidden',
            transition: 'opacity 0.3s ease',
        };
        Object.assign(containerElement.style, styles);
    }

    function createWidgetContainer(targetElement) {
        const existingContainer = document.getElementById(config.containerID);
        if (existingContainer) {
            log('Removing existing widget container during creation.');
            existingContainer.remove();
        }

        widgetContainer = document.createElement('div');
        widgetContainer.id = config.containerID;
        widgetContainer.setAttribute('data-ask-widget', 'true');
        applyContainerStyles(widgetContainer);

        widgetContainer.scrollIntoView = function() {}; // Prevent unwanted scrolls
        widgetContainer.focus = function() {};       // Prevent unwanted focus

        targetElement.insertAdjacentElement('afterend', widgetContainer);
        log(`Widget container created and inserted after target: ${targetElement.tagName}${targetElement.id ? '#' + targetElement.id : ''}${targetElement.className ? '.' + targetElement.className.split(' ').join('.') : ''}`);
        return widgetContainer;
    }

    function getWidgetContainer() {
        if (widgetContainer && document.body.contains(widgetContainer)) {
            return widgetContainer;
        }
        // Attempt to find or recreate if detached
        let container = document.getElementById(config.containerID);
        if (container) {
             widgetContainer = container; // Re-assign if found
             return widgetContainer;
        }

        log('Widget container not found or detached, attempting recreation.');
        const selector = getTargetSelector();
        const target = findTargetElement(selector);
        if (target) {
            return createWidgetContainer(target);
        }
        log('ERROR: Could not find target element to create container.');
        return null;
    }

    function showWidgetContainer() {
        const container = getWidgetContainer();
        if (!container) {
            log('ERROR: Cannot show widget, container not found.');
            return;
        }
        log('Showing widget container.');
        container.style.opacity = '1';
        container.style.visibility = 'visible';
        // Height is managed by heightManager
        checkAndUpdateHeight(); // Initial height check after show
    }


    // --- 4. Height Management ---
    function checkAndUpdateHeight() {
        const container = getWidgetContainer();
        if (!container || !document.body.contains(container)) return; // Exit if container is gone

        try {
            // Ensure container is actually visible before measuring scrollHeight
            const styles = window.getComputedStyle(container);
            if (styles.display === 'none' || styles.visibility === 'hidden') {
                 // log('Container not visible, skipping height check.');
                 return;
            }

            const newHeight = Math.max(container.scrollHeight, config.minHeight);
            const currentMinHeight = parseInt(container.style.minHeight, 10) || 0;

            if (Math.abs(newHeight - currentMinHeight) > 5) {
                log(`Updating container min-height to: ${newHeight}px (was ${currentMinHeight}px). scrollHeight: ${container.scrollHeight}`);
                container.style.minHeight = `${newHeight}px`;
                // Reset other height properties if necessary
                 if (container.style.height !== 'auto') container.style.height = 'auto';
                 if (container.style.maxHeight !== 'none') container.style.maxHeight = 'none';
            }
        } catch (error) {
             log(`Error during height check: ${error.message}`);
        }
    }

    function handleHeightMutations(mutationsList) {
        let needsCheck = false;
        for (const mutation of mutationsList) {
             // Check if the mutation target is within our container OR the container itself
             if (widgetContainer && (widgetContainer.contains(mutation.target) || mutation.target === widgetContainer)) {
                 if (mutation.type === 'childList' || mutation.type === 'attributes' || mutation.type === 'characterData') {
                     needsCheck = true;
                     break;
                 }
             }
        }

        if (needsCheck) {
            clearTimeout(heightDebounceTimer);
            heightDebounceTimer = setTimeout(checkAndUpdateHeight, HEIGHT_DEBOUNCE_DELAY);
        }
    }

    function startHeightMonitoring() {
        const container = getWidgetContainer();
         if (!container) {
             log("Cannot start height monitoring: container not found.");
             return;
         }
        if (heightObserver) {
             log("Height monitoring already started.");
             return;
        }

        if (!window.MutationObserver) {
            log("MutationObserver not supported. Dynamic height adjustments will be limited.");
            // Fallback (less efficient): setInterval(checkAndUpdateHeight, 1000);
            return;
        }

        log("Starting height monitoring with MutationObserver.");
        checkAndUpdateHeight(); // Initial check

        heightObserver = new MutationObserver(handleHeightMutations);
        heightObserver.observe(container, {
            childList: true, subtree: true, attributes: true, characterData: true,
            // Consider attributeFilter: ['style', 'class', 'id'] if performance is an issue
        });
    }

    function stopHeightMonitoring() {
        if (heightObserver) {
            log("Stopping height monitoring.");
            heightObserver.disconnect();
            heightObserver = null;
        }
        clearTimeout(heightDebounceTimer);
    }

    // --- 5. Resource Loading ---
    function loadResource(elementType, attributes) {
        return new Promise((resolve, reject) => {
            const element = document.createElement(elementType);
            Object.assign(element, attributes);
            element.onload = () => {
                log(`${elementType.toUpperCase()} loaded: ${attributes.src || attributes.href}`);
                resolve(element);
            };
            element.onerror = (error) => {
                log(`Failed to load ${elementType}: ${attributes.src || attributes.href}`);
                reject(error);
            };
            (document.head || document.body).appendChild(element);
        });
    }

    function loadStyles() {
        return loadResource('link', { rel: 'stylesheet', href: config.cssPath });
    }

    function loadWidgetScript() {
        return loadResource('script', { src: config.jsPath, async: true });
    }

    function loadScrapeScript() {
        return loadResource('script', { src: config.scrapePath, async: true });
    }

    // --- 6. Voiceflow Integration ---
    function patchFetch() {
        if (originalFetch || typeof window.fetch === 'undefined') return;
        originalFetch = window.fetch;
        log("Patching window.fetch for Voiceflow API calls.");
        window.fetch = function(url, options) {
            const isVf = typeof url === 'string' && (url.includes('voiceflow.com') || url.includes('vfre') || url.includes('vf.to'));
            if (isVf && config.voiceflowTimeout > 0) {
                log('Adding timeout to Voiceflow request.');
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    controller.abort();
                    log(`Voiceflow request timed out: ${url}`);
                }, config.voiceflowTimeout);
                const fetchOptions = { ...(options || {}), signal: controller.signal };
                return originalFetch(url, fetchOptions).finally(() => clearTimeout(timeoutId));
            }
            return originalFetch(url, options);
        };
    }

    function unpatchFetch() {
        if (originalFetch) {
            log("Restoring original window.fetch.");
            window.fetch = originalFetch;
            originalFetch = null;
        }
    }

     function getCurrentTranscriptId() {
         try {
             let transcriptId = sessionStorage.getItem('vf_transcript_id') ||
                                document.querySelector('[data-transcript-id]')?.getAttribute('data-transcript-id') ||
                                window._vfTranscriptId ||
                                localStorage.getItem('vf_transcript_id');
             if (!transcriptId) {
                 log('Transcript ID not found in common locations.');
             }
             return transcriptId;
         } catch (error) {
             log(`Error retrieving transcript ID: ${error.message}`);
             return null;
         }
     }

    async function tagTranscript(transcriptId) {
        if (!config.reportTagId || !transcriptId) {
            log('Cannot tag transcript: Missing transcriptID or reportTagID.'); return false;
        }
        if (!config.apiKey || !config.projectID) {
             log('Cannot tag transcript: Missing apiKey or projectID.'); return false;
         }

        log(`Attempting to tag transcript ${transcriptId} with tag ID ${config.reportTagId}`);
        const url = `https://api.voiceflow.com/v2/transcripts/${config.projectID}/${transcriptId}/report_tag/${config.reportTagId}`;
        try {
            const response = await fetch(url, { method: 'PUT', headers: { Authorization: config.apiKey } }); // Uses patched fetch
            if (response.ok) {
                log(`Successfully tagged transcript ${transcriptId} as "${config.conversionTagLabel}"`); return true;
            } else {
                log(`Failed to tag transcript ${transcriptId}: ${response.status} ${response.statusText}`);
                response.text().then(txt => log(`Error response body: ${txt}`)).catch(()=>{}); // Log error body if possible
                return false;
            }
        } catch (error) {
            log(`Error tagging transcript ${transcriptId}: ${error.name === 'AbortError' ? 'Request timed out/aborted' : error.message}`);
            return false;
        }
    }

    // --- 7. Conversion Tracking ---
    function handleAddToCartClick(event) {
        let isMatch = false;
        let matchedSelector = '';
        for (const selector of config.addToCartSelectors) {
            try {
                if (selector.includes(':contains(')) { // Basic contains check
                    const text = selector.match(/:contains\("(.+?)"\)/i)?.[1];
                    if (text && event.target.textContent?.toLowerCase().includes(text.toLowerCase())) {
                        isMatch = true; matchedSelector = selector; break;
                    }
                } else if (event.target.closest(selector)) {
                    isMatch = true; matchedSelector = selector; break;
                }
            } catch (err) { log(`Error checking selector "${selector}": ${err.message}`); }
        }
        if (!isMatch && (event.target.classList.contains('buy-button') || event.target.closest('.buy-button'))) {
            isMatch = true; matchedSelector = '.buy-button';
        }

        if (!isMatch) return;
        log(`Add to Cart button clicked (matched: ${matchedSelector})`);
        const transcriptId = getCurrentTranscriptId();
        if (transcriptId) { tagTranscript(transcriptId); }
        else { log('Could not tag conversion: Transcript ID not found.'); }
    }

    function setupConversionListener() {
        if (conversionListenerActive) { log("Conversion listener already active."); return; }
        if (!config.reportTagId) { log("Conversion tracking disabled: No reportTagId."); return; }
        log('Setting up Add to Cart click listener.');
        document.addEventListener('click', handleAddToCartClick, true); // Use capture
        conversionListenerActive = true;
    }

    function removeConversionListener() {
        if (!conversionListenerActive) return;
        log('Removing Add to Cart click listener.');
        document.removeEventListener('click', handleAddToCartClick, true);
        conversionListenerActive = false;
    }

    // --- 8. Initialization and Event Handling ---
    function handleWindowResize() {
        const container = document.getElementById(config.containerID);
        if (!container || !isInitialized) return; // Only move if initialized

        const currentSelector = getTargetSelector(); // Updates type
        const targetElement = findTargetElement(currentSelector);

        if (targetElement && container.previousElementSibling !== targetElement) {
            log(`Target element changed on resize. Moving widget container.`);
            targetElement.insertAdjacentElement('afterend', container);
        }
         // Height check is handled by mutation observer reacting to potential layout shifts
         // but trigger one check just in case observer misses something subtle.
         checkAndUpdateHeight();
    }

    function handleScrapeComplete(event) {
        if (isWidgetInstanceReady) {
            log('Widget already initialized, ignoring duplicate scrapeComplete.'); return;
        }
        clearTimeout(scrapeFallbackTimer);

        log('Received scrapeComplete event.');
        const detail = event.detail || {};
        const { side_innhold, browser_url, produkt_navn } = detail;

        console.log(`[AskWidget] Produktnavn for bruker-ID: "${produkt_navn || 'Ikke funnet'}"`);

        if (!side_innhold) log('No content extracted from page by scrape script.');

        const container = getWidgetContainer();
        if (!container) { log("ERROR: Cannot initialize widget, container is missing!"); return; }

        if (window.ChatWidget && typeof window.ChatWidget.init === 'function') {
            try {
                log('Initializing ChatWidget instance...');
                window.ChatWidget.init({
                    containerId: config.containerID,
                    apiKey: config.apiKey,
                    projectID: config.projectID,
                    apiEndpoint: 'https://general-runtime.voiceflow.com',
                    disableAutoScroll: true, // Let the container handle scroll/height
                    launchConfig: {
                        event: {
                            type: "launch",
                            payload: {
                                browser_url: browser_url || window.location.href,
                                side_innhold: side_innhold ? side_innhold.substring(0, 10000) : '', // Limit payload size
                                produkt_navn: produkt_navn || ''
                            }
                        }
                    }
                });
                log('ChatWidget init called successfully.');
                isWidgetInstanceReady = true; // Mark instance as initialized

                // Wait a moment for the widget to render before showing and monitoring
                setTimeout(() => {
                    showWidgetContainer();
                    startHeightMonitoring();
                    setupConversionListener(); // Start tracking after widget is ready
                }, 300); // Delay might need adjustment

            } catch (error) {
                log(`Error initializing ChatWidget instance: ${error.message}`);
                isWidgetInstanceReady = false;
                // Potentially try to show container anyway or display an error message
            }
        } else {
            log('ERROR: window.ChatWidget.init not found after script load.');
             // Try to find init on default export (common module pattern)
             if (window.ChatWidget && window.ChatWidget.default && typeof window.ChatWidget.default.init === 'function') {
                 log('Found init on window.ChatWidget.default, attempting to use that.');
                 // Re-dispatch event (or re-call this handler) to try again with default
                 // This recursive call might be risky, better to refactor init call
                  window.ChatWidget.init = window.ChatWidget.default.init;
                  handleScrapeComplete(event); // Try again now that init is assigned
             }
        }
    }

    function attemptManualScrape() {
         if (isWidgetInstanceReady || !isInitialized) return; // Don't run if already initialized or initialization failed
         // Also check if scrape listener was added and might still fire
         if(hasAddedScrapeListener && document.readyState !== 'complete') {
             log('Manual scrape deferred, page still loading or scrape listener active.');
             // Reschedule slightly later if needed, but avoid infinite loops
             // scrapeFallbackTimer = setTimeout(attemptManualScrape, 1000);
             return;
         }

         log('Scrape script likely failed or timed out. Attempting manual content extraction.');

         let content = '';
         let productName = document.title || ''; // Basic fallback for product name
         try {
              // Prioritize specific semantic elements or areas likely containing product info
              const mainContent = document.querySelector('main') || document.querySelector('.main-content') || document.querySelector('.product-details') || document.querySelector('.product-info') || document.body;
              if(mainContent) {
                   content = mainContent.innerText || mainContent.textContent || '';
              }
              // Try to get a more specific product name
              const titleElement = document.querySelector('h1') || document.querySelector('.product-title') || document.querySelector('.product_title');
              if(titleElement) productName = titleElement.textContent.trim();

         } catch(e) { log(`Error during manual scrape: ${e.message}`); }


         if (content && content.length > 50) { // Require some minimal content
             log('Dispatching manual scrapeComplete event.');
             window.dispatchEvent(new CustomEvent('scrapeComplete', {
                 detail: {
                     side_innhold: content.substring(0, 10000), // Limit size
                     browser_url: window.location.href,
                     produkt_navn: productName
                 }
             }));
         } else {
              log('Manual scrape did not yield sufficient content. Initializing widget without page context.');
               // Dispatch event with minimal info so widget still loads
               window.dispatchEvent(new CustomEvent('scrapeComplete', {
                 detail: {
                     side_innhold: '',
                     browser_url: window.location.href,
                     produkt_navn: productName
                 }
             }));
         }
    }

    function initialize() {
        if (isInitialized) {
            log("Initialization already run.");
            return;
        }
        log('Ask widget initialization started.');
        isInitialized = true; // Mark as started to prevent duplicates

        patchFetch(); // Patch fetch early

        // --- Setup Container ---
        const selector = getTargetSelector();
        const target = findTargetElement(selector);
        if (!target) {
            log("ERROR: Could not find any target element. Aborting.");
            isInitialized = false; // Allow retry if state changes
            return;
        }
        const container = createWidgetContainer(target);
        if (!container) {
             log("ERROR: Failed to create widget container. Aborting.");
             isInitialized = false;
             return;
        }

        // --- Load Resources --- 
        Promise.all([
            loadStyles(),
            loadWidgetScript() // Load main widget logic
        ])
        .then(() => {
             log("Core styles and widget script loaded.");
             // Now load the scraper, which should dispatch 'scrapeComplete'
             return loadScrapeScript(); // Return promise here
        })
        .then(() => {
             log("Scrape script loaded (or started loading). Setting up timeout fallback.");
             // Set timeout after attempting load, in case load succeeds but script doesn't dispatch
              clearTimeout(scrapeFallbackTimer);
              scrapeFallbackTimer = setTimeout(attemptManualScrape, config.manualScrapeFallbackTimeout);
        })
        .catch(error => {
            log(`ERROR loading resources: ${error}. Attempting manual scrape fallback.`);
             // If core scripts failed OR scrape script failed to load
             isInitialized = false; // Allow retry? Or proceed with manual?
             // Decide if you want to proceed with manual scrape even if core scripts failed
             clearTimeout(scrapeFallbackTimer);
             scrapeFallbackTimer = setTimeout(attemptManualScrape, 500); // Faster fallback if load failed
        });

        // --- Setup Event Listeners ---
        if (!hasAddedScrapeListener) {
            window.addEventListener('scrapeComplete', handleScrapeComplete);
            hasAddedScrapeListener = true;
            log('Added scrapeComplete event listener.');
        }
        window.addEventListener('resize', handleWindowResize);
        window.addEventListener('beforeunload', widgetCleanup); // Cleanup resources on page leave
    }

    function widgetCleanup() {
        log("Cleaning up AskWidget resources.");
        stopHeightMonitoring();
        removeConversionListener();
        unpatchFetch(); // Restore original fetch
        window.removeEventListener('resize', handleWindowResize);
        if(hasAddedScrapeListener) window.removeEventListener('scrapeComplete', handleScrapeComplete);
        window.removeEventListener('beforeunload', widgetCleanup);
        clearTimeout(scrapeFallbackTimer);
        clearTimeout(heightDebounceTimer);

        // Reset state flags
        isInitialized = false;
        isWidgetInstanceReady = false;
        hasAddedScrapeListener = false;
        conversionListenerActive = false;
        originalFetch = null;
        heightObserver = null;

        // Optionally remove the container? Generally better to leave it unless re-injecting.
        // const container = document.getElementById(config.containerID);
        // if (container) container.remove();
         widgetContainer = null; // Clear reference
    }


    // --- Start Initialization ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // Optional: Add a re-init check on window.load for very late-loading scenarios
    // window.addEventListener('load', () => { if (!isInitialized) { initialize(); }});

})(); // End IIFE
