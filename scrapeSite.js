(async function() {
  let finalMarkdown = ""; // skal inneholde det skrapede markdown-innholdet
  
  try {
    // ────────────────────────────────
    // Del 1: Simulerer åpning av accordion-knapper
    // ────────────────────────────────

    // Legg til midlertidig CSS som skjuler knappene og innholdet (usynlig, men i DOM)
    const style = document.createElement('style');
    style.textContent = `
      button.accordion-item__btn, 
      .accordion-item__content {
        opacity: 0 !important;
      }
    `;
    document.head.appendChild(style);

    // Hjelpefunksjon: vent en gitt tidsperiode (her 0ms)
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Finn de tre første accordion-knappene og åpne de
    const buttons = Array.from(document.querySelectorAll('button.accordion-item__btn'));
    for (let i = 0; i < 3; i++) {
      const btn = buttons[i];
      if (!btn) {
        console.warn(`Antall knapper er mindre enn forventet. Fant bare ${buttons.length} knapper.`);
        break;
      }
      if (!btn.classList.contains('is-active')) {
        btn.click();
        await wait(0);
      }
      if (i === 2) {
        btn.click();
        await wait(0);
      }
    }

    // Fjern midlertidig CSS
    document.head.removeChild(style);

    // ────────────────────────────────
    // Del 2: Konverter hele DOM til Markdown
    // ────────────────────────────────

    // Hjelpefunksjon for å hente innhold fra ::before og ::after
    function getPseudoContent(element, pseudo) {
      let content = window.getComputedStyle(element, pseudo).getPropertyValue('content');
      if (content && content !== 'none') {
        return content.replace(/^["'](.*)["']$/, '$1');
      }
      return "";
    }

    // Hjelpefunksjon for å hente kun direkte tekstnoder
    function getImmediateText(element) {
      let text = "";
      Array.from(element.childNodes).forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent.trim() + " ";
        }
      });
      return text.trim();
    }

    // Rekursiv funksjon for å traversere DOM-treet og bygge Markdown
    function extractMarkdownFromElement(el, indent = 0) {
      let md = "";
      const pseudoBefore = getPseudoContent(el, '::before');
      const pseudoAfter  = getPseudoContent(el, '::after');
      const tag = el.tagName ? el.tagName.toLowerCase() : "";

      switch(tag) {
        case "h1":
          md += "\n# " + pseudoBefore + el.textContent.trim() + pseudoAfter + "\n\n";
          break;
        case "h2":
          md += "\n## " + pseudoBefore + el.textContent.trim() + pseudoAfter + "\n\n";
          break;
        case "h3":
          md += "\n### " + pseudoBefore + el.textContent.trim() + pseudoAfter + "\n\n";
          break;
        case "h4":
          md += "\n#### " + pseudoBefore + el.textContent.trim() + pseudoAfter + "\n\n";
          break;
        case "h5":
          md += "\n##### " + pseudoBefore + el.textContent.trim() + pseudoAfter + "\n\n";
          break;
        case "h6":
          md += "\n###### " + pseudoBefore + el.textContent.trim() + pseudoAfter + "\n\n";
          break;
        case "p":
          md += "\n" + pseudoBefore + el.textContent.trim() + pseudoAfter + "\n\n";
          break;
        case "li": {
          let immediateText = getImmediateText(el);
          md += "  ".repeat(indent) + "- " + pseudoBefore + immediateText + pseudoAfter + "\n";
          Array.from(el.children).forEach(child => {
            const childTag = child.tagName ? child.tagName.toLowerCase() : "";
            if (childTag === "ul" || childTag === "ol") {
              md += extractMarkdownFromElement(child, indent + 1);
            }
          });
          break;
        }
        case "ul":
        case "ol":
          Array.from(el.children).forEach(child => {
            if (child.tagName && child.tagName.toLowerCase() === "li") {
              md += extractMarkdownFromElement(child, indent);
            }
          });
          md += "\n";
          break;
        default:
          if (el.childNodes.length > 0) {
            Array.from(el.childNodes).forEach(child => {
              if (child.nodeType === Node.ELEMENT_NODE) {
                md += extractMarkdownFromElement(child, indent);
              } else if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent.trim();
                if (text) {
                  md += text + " ";
                }
              }
            });
          } else if (el.textContent && el.textContent.trim()) {
            md += pseudoBefore + el.textContent.trim() + pseudoAfter + " ";
          }
          break;
      }
      return md;
    }

    // Generer full Markdown for hele siden
    finalMarkdown = extractMarkdownFromElement(document.body).trim();

    // ────────────────────────────────
    // Del 3: Fjerner uønsket tekst med regex
    // ────────────────────────────────

    // Fjern uønsket innhold (definerte regex-mønstre)
    finalMarkdown = finalMarkdown.replace(
      /<iframe\s*src="[\s\S]*?}\s*Previous\s*Next\s*1\s*2\s*3/gi,
      ''
    ).trim();

    finalMarkdown = finalMarkdown.replace(
      /###\s*Similar\s*styles[\s\S]*?##\s*Guide/gi,
      ''
    ).trim();

    finalMarkdown = finalMarkdown.replace(
      /## Secure Payment[\s\S]*/gi,
      ''
    ).trim();

    finalMarkdown = finalMarkdown.replace(
      /###\s*Subscribe\s*to\s*our\s*newsletter[\s\S]*?Filter\s*Clear\s*All\s*Apply\s*filters/gi,
      ''
    ).trim();

    // Dersom sluttresultatet er over 10 000 tegn, kaster vi en feil
    if (finalMarkdown.length > 10000) {
      throw new Error("Sluttresultatet er over 10 000 tegn.");
    }
  } catch (err) {
    console.error("Fallback-scraping ble aktivert grunnet en feil eller for langt resultat:", err);
    // Dersom det oppstår feil, bruk en tom streng for side_innhold
    finalMarkdown = "";
  }
  
  // ────────────────────────────────
  // Del 4: Bruk skrapet markdown-innhold til å sende til ekstern chat
  // ────────────────────────────────

  // Bruk det skrapede markdown-innholdet (uten fallback) direkte
  let side_innhold = finalMarkdown;
  // Sett browser_url til den faktiske URL-en
  let browser_url = window.location.href;

})();



