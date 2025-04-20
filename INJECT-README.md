# Chat Widget Injector

Dette er et script som lar deg legge til en chat-widget på en hvilken som helst nettside ved å injisere koden via nettleserens konsoll eller ved å inkludere den som en ekstern ressurs.

## Bygging av injiseringsskriptet

1. Installer avhengigheter:
   ```bash
   npm install
   ```

2. Bygg injiseringsskriptet:
   ```bash
   npm run build:inject
   ```
   
   Dette vil lage en minimert JavaScript-fil i `dist/chat-injector.min.js`.

3. For å bygge både hovedapplikasjonen og injiseringsskriptet:
   ```bash
   npm run build:all
   ```

## Bruk av injiseringsskriptet

### Metode 1: Direkte injisering i konsollen

1. Kopier innholdet i `dist/chat-injector.min.js`
2. Åpne nettleserens konsoll på målsiden (F12 eller høyreklikk > Inspiser > Konsoll)
3. Lim inn koden og trykk Enter

### Metode 2: Inkludering som ekstern ressurs

Legg til følgende kode i HTML-dokumentet:

```html
<script src="path/to/chat-injector.min.js"></script>
```

### Metode 3: Dynamisk injisering fra et eksternt domene

```html
<script>
  (function() {
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/path/to/chat-injector.min.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
```

## Tilpassing av innstillinger

Du kan tilpasse widgeten ved å konfigurere ChatInjector-instansen:

```javascript
// Må kjøres etter at injiseringsskriptet er lastet
window.ChatInjector.init({
  position: 'bottom-left', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  chatScriptUrl: 'https://your-domain.com/assets/App.js',
  chatStylesUrl: 'https://your-domain.com/assets/main.css',
  apiEndpoint: 'https://your-api-endpoint.com',
  initialDelay: 1000, // Forsinkelse i millisekunder før widgeten lastes
  debug: true // Aktiver debug-meldinger i konsollen
});
```

## Sikkerhet og personvern

Vær oppmerksom på at injisering av kode på tredjeparts nettsider kan være i strid med deres vilkår for bruk. Bruk dette verktøyet på eget ansvar og kun på nettsider der du har tillatelse til å legge til ekstra kode. 