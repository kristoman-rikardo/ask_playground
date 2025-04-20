/**
 * Utility for logging trace events with appropriate emoji prefixes
 */
export const logTraceEvent = (traceType: string, payload?: any): void => {
  // Fjernet all logging av traces for å redusere støy i konsollen
  // Loggingen nedenfor er helt deaktivert
  
  /*
  let logPrefix = '📋';
  
  switch (traceType) {
    case 'speak':
      logPrefix = '🗣️';
      break;
    case 'text':
      logPrefix = '📝';
      break;
    case 'choice':
      logPrefix = '🔘';
      break;
    case 'completion':
      logPrefix = '✍️';
      break;
    case 'end':
      logPrefix = '🏁';
      break;
    case 'flow':
      logPrefix = '🌊';
      break;
    case 'block':
      logPrefix = '🧱';
      break;
    case 'debug':
      logPrefix = '🔍';
      break;
    default:
      break;
  }
  
  if (payload) {
    const shortPayload = JSON.stringify(payload).substring(0, 100);
    console.log(`${logPrefix} Trace [${traceType}]: ${shortPayload}${shortPayload.length >= 100 ? '...' : ''}`);
  } else {
    console.log(`${logPrefix} Trace received: ${traceType}`);
  }
  */
};
