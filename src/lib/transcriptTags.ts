import { RUNTIME_API_KEY, PROJECT_ID } from './voiceflow';

const TAG_LABEL = "conversion";

/**
 * Sjekker om "conversion" tag finnes, og oppretter den hvis den ikke eksisterer
 * @returns Promise med tag-ID
 */
export async function ensureProjectTag(): Promise<string> {
  if (!RUNTIME_API_KEY || !PROJECT_ID) {
    console.error('Mangler Voiceflow API-nøkkel eller prosjekt-ID for tag-håndtering');
    throw new Error('Mangler API-nøkkel eller prosjekt-ID');
  }
  
  const base = `https://api.voiceflow.com/v2/projects/${PROJECT_ID}/tags`;
  
  // 1. Hent gjeldende tag-liste
  try {
    const listRes = await fetch(base, {
      headers: { Authorization: RUNTIME_API_KEY }
    });
    
    if (!listRes.ok) {
      throw new Error(`Feil ved henting av tags: ${listRes.status}`);
    }
    
    const tags = await listRes.json();
    let tag = tags.find((t: any) => t.label === TAG_LABEL);

    // 2. Opprett tag hvis den ikke finnes
    if (!tag) {
      console.log(`Oppretter "${TAG_LABEL}" tag for prosjektet...`);
      
      const createRes = await fetch(base, {
        method: 'PUT',
        headers: {
          Authorization: RUNTIME_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ label: TAG_LABEL })
      });
      
      if (!createRes.ok) {
        throw new Error(`Feil ved opprettelse av tag: ${createRes.status}`);
      }
      
      tag = await createRes.json();
      console.log(`Tag "${TAG_LABEL}" opprettet med ID: ${tag._id}`);
    } else {
      console.log(`Tag "${TAG_LABEL}" eksisterer allerede med ID: ${tag._id}`);
    }
    
    return tag._id;
  } catch (error) {
    console.error('Feil ved håndtering av prosjekt-tag:', error);
    throw error;
  }
}

/**
 * Tagger et transcript med "conversion"-tag
 * @param transcriptId - ID til transkripsjonen som skal tagges
 * @param reportTagId - ID til "conversion"-taggen
 * @returns Promise med status for tagging
 */
export async function tagTranscript(transcriptId: string, reportTagId: string): Promise<boolean> {
  if (!RUNTIME_API_KEY || !PROJECT_ID) {
    console.error('Mangler Voiceflow API-nøkkel eller prosjekt-ID for transcript-tagging');
    return false;
  }
  
  const url = `https://api.voiceflow.com/v2/transcripts/${PROJECT_ID}/${transcriptId}/report_tag/${reportTagId}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: RUNTIME_API_KEY }
    });
    
    if (response.ok) {
      console.log(`Transcript ${transcriptId} er tagget med "${TAG_LABEL}"`);
      return true;
    } else {
      console.error(`Feil ved tagging av transcript: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('Feil ved tagging av transcript:', error);
    return false;
  }
}

/**
 * Tagger et transcript med "conversion"-tag med automatisk retry
 * @param transcriptId - ID til transkripsjonen som skal tagges
 * @param maxRetries - Maksimalt antall forsøk (standard: 2)
 * @returns Promise med status for tagging
 */
export async function tagTranscriptWithRetry(transcriptId: string, maxRetries: number = 2): Promise<boolean> {
  // Først må vi hente tag-ID
  let reportTagId: string;
  try {
    reportTagId = await ensureProjectTag();
  } catch (error) {
    console.error('Kunne ikke hente/opprette tag:', error);
    return false;
  }
  
  // Prøv å tagge transkripsjonen med retry
  let retries = 0;
  while (retries <= maxRetries) {
    const success = await tagTranscript(transcriptId, reportTagId);
    if (success) return true;
    
    retries++;
    if (retries <= maxRetries) {
      console.log(`Prøver å tagge transcript på nytt (forsøk ${retries}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
  
  return false;
} 