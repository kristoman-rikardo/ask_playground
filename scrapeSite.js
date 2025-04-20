/**
 * Konverterer en webside til Markdown format
 * Kan også håndtere accordion-knapper dersom de finnes
 * Fjerner lenker og alt etter spesifikk tekst
 * Begrenser lengden til 7500 tegn
 * Sender resultat som CustomEvent
 */
(async function() {
    // Sjekk om det finnes accordion-knapper
    const accordionButtons = Array.from(document.querySelectorAll('button.accordion-item__btn'));
    
    // Hvis det finnes knapper, åpne dem for å få tilgang til innholdet
    if (accordionButtons.length > 0) {
        // Legg til midlertidig CSS som skjuler knappene og innholdet (usynlig, men beholdt i DOM)
        const style = document.createElement('style');
        style.textContent = `
          button.accordion-item__btn, 
          .accordion-item__content {
            opacity: 0 !important;
          }
        `;
        document.head.appendChild(style);
        
        // Hjelpefunksjon: venter et gitt tidsintervall
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        
        // Klikk på knappene (max 3 knapper)
        const maxButtons = Math.min(accordionButtons.length, 3);
        for (let i = 0; i < maxButtons; i++) {
            const btn = accordionButtons[i];
            if (!btn.classList.contains('is-active')) {
                btn.click();
                await wait(100); // Litt ventetid for å sikre at innholdet lastes
            }
        }
        
        // Fjern midlertidig CSS
        document.head.removeChild(style);
    }
    
    function getTextContent(element, level = 0) {
        let result = '';
        const tagName = element.tagName ? element.tagName.toLowerCase() : '';
        
        // Hopp over skjulte elementer og script/style tags
        if (element.style && element.style.display === 'none' || 
            element.style && element.style.visibility === 'hidden' ||
            tagName === 'script' || tagName === 'style' || tagName === 'noscript') {
            return '';
        }
        
        // Behandle overskrifter
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
            const headerLevel = parseInt(tagName.charAt(1));
            const headerMarks = '#'.repeat(headerLevel);
            const text = element.textContent.trim();
            if (text) {
                result += `${headerMarks} ${text}\n\n`;
            }
            return result;
        }
        
        // Behandle lister
        if (tagName === 'ul' || tagName === 'ol') {
            let listItems = '';
            const listPrefix = tagName === 'ul' ? '- ' : '';
            let counter = 1;
            
            for (const child of element.children) {
                if (child.tagName.toLowerCase() === 'li') {
                    const itemContent = child.textContent.trim();
                    if (itemContent) {
                        if (tagName === 'ul') {
                            listItems += `${listPrefix}${itemContent}\n`;
                        } else {
                            listItems += `${counter}. ${itemContent}\n`;
                            counter++;
                        }
                    }
                }
            }
            
            if (listItems) {
                result += listItems + '\n';
            }
            return result;
        }
        
        // Behandle paragrafer
        if (tagName === 'p') {
            const text = element.textContent.trim();
            if (text) {
                result += `${text}\n\n`;
            }
            return result;
        }
        
        // Behandle lenker
        if (tagName === 'a' && element.href) {
            const text = element.textContent.trim();
            if (text && !element.querySelector('img')) {
                return `[${text}](${element.href})`;
            }
        }
        
        // Behandle bilder
        if (tagName === 'img' && element.alt && element.src) {
            return `![${element.alt}](${element.src})`;
        }
        
        // Behandle kodefelt
        if (tagName === 'pre' || tagName === 'code') {
            const text = element.textContent.trim();
            if (text) {
                if (tagName === 'pre') {
                    result += `\`\`\`\n${text}\n\`\`\`\n\n`;
                } else {
                    result += `\`${text}\``;
                }
                return result;
            }
        }
        
        // Behandle accordion-innhold spesifikt
        if ((element.classList && element.classList.contains('accordion-item__content')) || 
            (tagName === 'div' && element.getAttribute('aria-hidden') === 'false')) {
            const text = element.textContent.trim();
            if (text) {
                result += `${text}\n\n`;
            }
        }
        
        // Rekursivt behandle andre elementer
        if (element.childNodes && element.childNodes.length > 0) {
            for (const child of element.childNodes) {
                if (child.nodeType === Node.TEXT_NODE) {
                    const text = child.textContent.trim();
                    if (text) {
                        result += text + ' ';
                    }
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    result += getTextContent(child, level + 1);
                }
            }
        }
        
        return result;
    }

    // Samle alt innhold fra body
    let markdown = getTextContent(document.body).trim();
    
    // Anvend regex for å fjerne lenker
    markdown = markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    // Anvend regex for å fjerne alt etter "OVER 2,000,000 JUMPSUITS SOLD"
    const targetPattern = /OVER 2,000,000 JUMPSUITS SOLD/i;
    const matchIndex = markdown.search(targetPattern);
    
    if (matchIndex !== -1) {
        // Finn slutten av den matchende teksten
        const endOfMatch = matchIndex + "OVER 2,000,000 JUMPSUITS SOLD".length;
        // Kutt strengen ved slutten av den matchende teksten
        markdown = markdown.substring(0, endOfMatch);
    }
    
    // Begrens lengden til 7500 tegn
    const MAX_LENGTH = 7500;
    let truncated = false;
    
    if (markdown.length > MAX_LENGTH) {
        markdown = markdown.substring(0, MAX_LENGTH);
        truncated = true;
    }
    
    // Legg til avkortningsmelding hvis nødvendig
    if (truncated) {
        markdown += "\n\nBeskrivelse avkortet";
    }
    
    // Hent nåværende URL
    const browser_url = window.location.href;
    
    // Hent produktnavnet fra .product-header__title
    const produkt_navn_elem = document.querySelector('.product-header__title');
    const produkt_navn = produkt_navn_elem
        ? produkt_navn_elem.textContent.trim()
        : '';

    // Send resultat som en CustomEvent
    const scrapeEvent = new CustomEvent('scrapeComplete', {
        detail: {
            side_innhold: markdown,
            browser_url: browser_url,
            produkt_navn: produkt_navn
        }
    });
    window.dispatchEvent(scrapeEvent);
})();
