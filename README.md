# Chat Widget: Injeksjonsskript

Dette prosjektet inneholder en chat-widget som kan injiseres på hvilken som helst nettside, hostet på Netlify.

## Slik fungerer det

Prosjektet består av tre hoveddeler:

1. **Hovedapplikasjonen**: En React-app som vises når injeksjonsskriptet lastes inn på en nettside.
2. **Injeksjonsskriptet (`injectionScript.js`)**: Et standalone JavaScript-skript som kan legges til på en hvilken som helst nettside for å laste inn chat-widgeten.
3. **Widget-kjernen (`chatWidget.js`)**: Skriptet som laster inn selve React-appen i containeren som opprettes av injeksjonsskriptet.

## Brukerveiledning

### Hvordan legge til chat-widgeten på en nettside

Legg til følgende script-tag i slutten av `<body>`-delen på nettsiden din:

```html
<script src="https://din-netlify-app.netlify.app/assets/injectionScript.js" defer></script>
```

### Tilpasning

For å tilpasse chat-widgeten, kan du modifisere `injectionScript.js`-filen. Her kan du endre:

- Plassering av widgeten (bottom-right, bottom-left, top-right, top-left)
- Forsinkelse før widgeten lastes
- API-endepunkt for kommunikasjon
- Utseende og oppførsel

## Utvikling

1. Klone repoet:
   ```
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Installer avhengigheter:
   ```
   npm install
   ```

3. Start utviklingsserveren:
   ```
   npm run dev
   ```

4. Bygg for produksjon:
   ```
   npm run build
   ```

## Deployment til Netlify

### Automatisk deployment med GitHub

1. Push koden til et GitHub-repository
2. Logg inn på [Netlify](https://app.netlify.com/)
3. Klikk "New site from Git"
4. Velg GitHub og deretter repositoryet ditt
5. Sørg for at følgende er konfigurert:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Klikk "Deploy site"

### Manuell deployment

1. Installer Netlify CLI:
   ```
   npm install netlify-cli -g
   ```

2. Bygg prosjektet:
   ```
   npm run build
   ```

3. Deploy til Netlify:
   ```
   netlify deploy --prod
   ```

## Filstruktur

```
/
├── src/
│   ├── injectionScript.ts   # Injeksjonsskriptet
│   ├── chatWidget.ts        # Widget-kjernen
│   └── ... (React-app filer)
├── dist/                    # Byggemappe (generert)
├── netlify.toml             # Netlify-konfigurasjon
└── vite.config.ts           # Vite-konfigurasjon
```

## Teknisk informasjon

- Bygget med Vite og React
- TypeScript for type-sikkerhet
- Netlify for hosting og distribusjon
- CORS er konfigurert til å tillate at skriptet kan lastes på tvers av domener

## Feilsøking

Hvis du opplever problemer med injeksjonsskriptet:

1. Sjekk nettleserkonsollen for feilmeldinger
2. Verifiser at URL-ene i injeksjonsskriptet er korrekte
3. Sørg for at nettstedet som laster skriptet ikke blokkerer eksterne skript

## Lisens

MIT
