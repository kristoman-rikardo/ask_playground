// Skriv et skript som oppdaterer alle klassenavn med ask- prefiks
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

console.log('Script startet');

// Funksjon for å finne alle komponentfiler (.tsx, .jsx)
function findComponentFiles() {
  return new Promise((resolve, reject) => {
    console.log('Søker etter .tsx og .jsx filer i src/');
    glob('src/**/*.{tsx,jsx}', (err, files) => {
      if (err) {
        console.error('Feil ved glob-søk:', err);
        reject(err);
        return;
      }
      console.log(`Glob fant ${files.length} filer`);
      resolve(files);
    });
  });
}

// Liste over Tailwind-klasser som skal prefikses
// Dette er ikke en komplett liste, men dekker mange vanlige klasser
const tailwindClasses = [
  'flex', 'grid', 'block', 'inline', 'hidden',
  'p-\\d+', 'px-\\d+', 'py-\\d+', 'pt-\\d+', 'pr-\\d+', 'pb-\\d+', 'pl-\\d+',
  'm-\\d+', 'mx-\\d+', 'my-\\d+', 'mt-\\d+', 'mr-\\d+', 'mb-\\d+', 'ml-\\d+',
  'text-\\w+', 'font-\\w+', 'bg-\\w+', 'border', 'rounded', 'shadow',
  'w-\\w+', 'h-\\w+', 'min-w-\\w+', 'max-w-\\w+', 'min-h-\\w+', 'max-h-\\w+',
  'gap-\\w+', 'space-x-\\w+', 'space-y-\\w+',
  'items-\\w+', 'justify-\\w+', 'content-\\w+',
  'overflow-\\w+', 'overflow-x-\\w+', 'overflow-y-\\w+',
  'transition', 'duration-\\w+', 'ease-\\w+', 'delay-\\w+',
  'opacity-\\w+', 'z-\\w+', 'top-\\w+', 'right-\\w+', 'bottom-\\w+', 'left-\\w+',
  'translate-x-\\w+', 'translate-y-\\w+', 'rotate-\\w+', 'scale-\\w+',
  'transform', 'absolute', 'relative', 'fixed', 'sticky',
  'flex-\\w+', 'flex-col', 'flex-row', 'flex-wrap',
  'truncate', 'whitespace-\\w+', 'break-\\w+',
  'animate-\\w+', 'animation-\\w+',
  'cursor-\\w+', 'pointer-events-\\w+',
  'sr-only', 'not-sr-only',
  'container', 'object-\\w+', 'order-\\w+',
  'underline', 'line-through', 'no-underline'
];

console.log(`Bygget regex-mønster for ${tailwindClasses.length} Tailwind-klasser`);

// Bygg regex-mønster for å matche alle Tailwind-klasser
const classPattern = new RegExp(`\\b(${tailwindClasses.join('|')})\\b`, 'g');

// Funksjon for å oppdatere en enkelt fil
async function updateFile(file) {
  try {
    console.log(`Prosesserer fil: ${file}`);
    const data = fs.readFileSync(file, 'utf8');
    console.log(`Leste fil: ${file}, størrelse: ${data.length} tegn`);
    
    let classNameMatches = 0;
    
    // Erstatt klassenavn i className-attributter
    const updated = data.replace(
      /className=(["'])((?:(?!\1).)+)\1/g, 
      (match, quote, classNames) => {
        classNameMatches++;
        // Sjekk om streng allerede inneholder cn() funksjon
        if (classNames.includes('cn(')) {
          console.log(`  - Fant cn() i className, hopper over: ${classNames.substring(0, 30)}...`);
          return match;
        }
        
        const oldClassNames = classNames;
        // Oppdater vanlige klassenavn uten cn()
        const updatedClassNames = classNames.replace(
          classPattern, 
          'ask-$1'
        );
        
        if (oldClassNames !== updatedClassNames) {
          console.log(`  - Oppdaterte klasser: ${oldClassNames} -> ${updatedClassNames}`);
        }
        
        return `className=${quote}${updatedClassNames}${quote}`;
      }
    );
    
    console.log(`  - Fant ${classNameMatches} className attributter`);
    
    let cnMatches = 0;
    
    // Erstatt også for cn() funksjonskall
    const updatedCnCalls = updated.replace(
      /cn\(["']((?:(?!\1).)+)\1\)/g,
      (match, classNames) => {
        cnMatches++;
        // Ikke gjør endringer i cn() kall siden funksjonen selv håndterer prefiks
        return match;
      }
    );
    
    console.log(`  - Fant ${cnMatches} cn() funksjonskall`);
    
    // Skriv tilbake til filen hvis noe ble endret
    if (data !== updatedCnCalls) {
      fs.writeFileSync(file, updatedCnCalls, 'utf8');
      console.log(`✅ Oppdaterte ${file}`);
      return true;
    } else {
      console.log(`  - Ingen endringer i ${file}`);
    }
    
    return false;
  } catch (err) {
    console.error(`❌ Feil ved oppdatering av ${file}:`, err);
    return false;
  }
}

// Hovedfunksjon
async function main() {
  try {
    console.log('Starter hovedfunksjonen');
    const files = await findComponentFiles();
    console.log(`Fant ${files.length} komponentfiler som skal sjekkes`);
    
    let updatedCount = 0;
    for (const file of files) {
      const wasUpdated = await updateFile(file);
      if (wasUpdated) {
        updatedCount++;
      }
    }
    
    console.log(`Ferdig! Oppdaterte ${updatedCount} av ${files.length} filer.`);
  } catch (err) {
    console.error('Feil under oppdatering av filer:', err);
  }
}

console.log('Kaller main()-funksjonen');
main(); 