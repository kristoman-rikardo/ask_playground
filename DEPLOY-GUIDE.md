# Distribusjon av Chat Widget til tredjeparts nettsider

Denne guiden forklarer hvordan du kan distribuere chat-widgeten din til tredjeparts nettsider ved å bruke et enkelt script-tag.

## Nåværende distribusjon

Chat-widgeten er distribuert til:
- Forhåndsvisning: https://ask1proto-21-aoi5dtz2b-kristoman-rikardos-projects.vercel.app

## Forberedelser før distribusjon

1. **Bygg applikasjonen for produksjon**:
   ```bash
   npm run build
   ```

2. **Last opp bygget til en hostet tjeneste**:
   - Last opp innholdet av `dist`-mappen til en nettvertstjeneste som Vercel, Netlify, eller en annen CDN.
   - Sørg for at følgende filer er tilgjengelige:
     - `assets/chatWidget.js`
     - `assets/chatWidget.css`
     - `chat-embed.js`

3. **Oppdater URL-ene i `chat-embed.js`**:
   - Etter du har fått en distribusjonsnettadresse, oppdater URL-ene i `chat-embed.js` med din faktiske produksjons-URL.

## Implementering på tredjeparts nettsider

### Grunnleggende implementering

For å legge til chat-widgeten på en tredjepartsside, plasser følgende script-tag før `</body>`-taggen i HTML-dokumentet:

```html
<script src="https://ask1proto-21-aoi5dtz2b-kristoman-rikardos-projects.vercel.app/chat-embed.js"></script>
```

### Tilpasset implementering

Du kan tilpasse chat-widgeten ved å definere et konfigurasjonsobjekt før du laster inn scriptet:

```html
<script>
    window.ChatWidgetConfig = {
        position: 'bottom-left', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
        apiEndpoint: 'https://ditt-api-endepunkt.com',
        initialDelay: 1000 // ms før chatten lastes
    };
</script>
<script src="https://ask1proto-21-aoi5dtz2b-kristoman-rikardos-projects.vercel.app/chat-embed.js"></script>
```

### Tilgjengelige konfigurasjonsalternativer

| Alternativ | Type | Standard | Beskrivelse |
|------------|------|---------|------------|
| `containerId` | String | 'chat-widget-container' | ID for DOM-elementet som skal inneholde chat-widgeten |
| `chatScriptUrl` | String | URL til chatWidget.js | URL til hovedscriptfilen for chat-widgeten |
| `chatStylesUrl` | String | URL til chatWidget.css | URL til CSS-filen for chat-widgeten |
| `position` | String | 'bottom-right' | Widget-posisjon på skjermen. Gyldige verdier: 'bottom-right', 'bottom-left', 'top-right', 'top-left' |
| `initialDelay` | Number | 500 | Forsinkelse i millisekunder før widgeten lastes |
| `apiEndpoint` | String | 'https://general-runtime.voiceflow.com' | API-endepunkt for widgeten |

## Feilsøking

Hvis widgeten ikke vises korrekt, kan du sjekke følgende:

1. Kontroller nettleserens konsoll for eventuelle JavaScript-feil
2. Sjekk om filene `chatWidget.js` og `chatWidget.css` lastes korrekt (i nettverks-fanen)
3. Verifiser at URL-ene i konfigurasjonsobjektet er korrekte
4. Sjekk om CSS-stilene for containeren blir overkjørt av nettsidens egne stiler

## Sikkerhetshensyn

- Vurder å sette opp Content Security Policy (CSP) for å tillate lastingen av tredjeparts ressurser
- Sørg for at alle ressurser (JS og CSS) serveres over HTTPS
- Unngå å lagre sensitiv informasjon i chat-widget konfigurasjonen

## Eksempel

Se `public/embed-example.html` for et fullt eksempel på hvordan man implementerer chat-widgeten på en nettside. 