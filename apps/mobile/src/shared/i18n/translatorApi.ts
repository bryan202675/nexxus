import AsyncStorage from '@react-native-async-storage/async-storage';

type TranslateTarget = 'en' | 'es';

const SOURCE_LANGUAGE: TranslateTarget = 'es';
const CACHE_PREFIX = '@nexxus_translation_cache_v3:';
const DEFAULT_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
const BATCH_SEPARATOR = '\n---NEXXUS_TRANSLATION_SPLIT---\n';

const getConfiguredEndpoint = () => {
  const envEndpoint = (globalThis as any)?.process?.env?.EXPO_PUBLIC_TRANSLATION_API_URL;
  return typeof envEndpoint === 'string' && envEndpoint.trim() ? envEndpoint.trim() : DEFAULT_ENDPOINT;
};

const hashText = (value: string) => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
};

const buildCacheKey = (source: string, target: TranslateTarget) =>
  `${CACHE_PREFIX}${SOURCE_LANGUAGE}:${target}:${hashText(source)}`;

const normalizeKnownTranslation = (source: string, translated: string, target: TranslateTarget) => {
  if (target !== 'en') return translated;

  const sourceClean = source.trim().toLowerCase();
  const translatedClean = translated.trim().toLowerCase();
  const isUppercaseSource = source.trim() === source.trim().toUpperCase();

  if (sourceClean === 'permisos de administrador') {
    return isUppercaseSource ? 'ADMINISTRATOR PERMISSIONS' : 'Administrator permissions';
  }

  if (sourceClean === 'administrador') {
    return isUppercaseSource ? 'ADMINISTRATOR' : 'Administrator';
  }

  if (sourceClean === 'total planilla (bruto)') {
    return isUppercaseSource ? 'TOTAL PAYROLL (GROSS)' : 'Total Payroll (Gross)';
  }

  if (sourceClean === 'costo neto') {
    return isUppercaseSource ? 'NET COST' : 'Net Cost';
  }

  if (sourceClean === 'reporte pdf') {
    return isUppercaseSource ? 'PDF REPORT' : 'PDF Report';
  }

  if (sourceClean === 'tiempo laborado') {
    return isUppercaseSource ? 'TIME WORKED' : 'Time Worked';
  }

  if (sourceClean === 'check-ins hechos') {
    return isUppercaseSource ? 'CHECK-INS MADE' : 'Check-ins Made';
  }

  if (sourceClean === 'datos vivos y módulos sincronizados') {
    return isUppercaseSource ? 'LIVE DATA AND SYNC NOTIFICATIONS' : 'Live data and sync notifications';
  }

  if (sourceClean === 'asistencia') {
    return isUppercaseSource ? 'ATTENDANCE' : 'Attendance';
  }

  if (sourceClean === 'recursos humanos') {
    return isUppercaseSource ? 'HUMAN RESOURCES' : 'Human Resources';
  }

  if (sourceClean === 'media') {
    return isUppercaseSource ? 'MEDIUM' : 'Medium';
  }

  if (['pendiente', 'pendientes'].includes(sourceClean)) {
    return isUppercaseSource ? 'PENDING' : 'Pending';
  }

  if (sourceClean.includes('pendiente') && translatedClean.includes('earring')) {
    return translated.replace(/earrings/gi, 'pending').replace(/earring/gi, 'pending');
  }

  if (['modo claro', 'modo-claro'].includes(sourceClean) || translatedClean === 'clear mode') {
    return 'Light Mode';
  }

  if (['modo oscuro', 'modo-oscuro'].includes(sourceClean) || translatedClean === 'dark mode') {
    return 'Dark Mode';
  }

  if (['prom:', 'prom: '].includes(sourceClean)) {
    return 'Avg:';
  }

  return translated;
};

const protectInterpolation = (text: string) => {
  const values: string[] = [];
  const protectedText = text.replace(/\{\{[^}]+\}\}/g, (match) => {
    const token = `NEXXUSVAR${values.length}`;
    values.push(match);
    return token;
  });

  return {
    protectedText,
    restore: (translated: string) =>
      values.reduce((result, value, index) => result.replace(new RegExp(`NEXXUSVAR\\s*${index}`, 'gi'), value), translated),
  };
};

const parseApiResponse = (payload: any) => {
  if (Array.isArray(payload?.[0])) return payload[0].map((part: any) => part?.[0] || '').join('');
  if (typeof payload?.translatedText === 'string') return payload.translatedText;
  if (typeof payload?.responseData?.translatedText === 'string') return payload.responseData.translatedText;
  if (Array.isArray(payload?.translations) && typeof payload.translations[0]?.text === 'string') return payload.translations[0].text;
  return '';
};

const requestGoogleTranslation = async (source: string, target: TranslateTarget) => {
  const response = await fetch(
    `${DEFAULT_ENDPOINT}?client=gtx&sl=${SOURCE_LANGUAGE}&tl=${target}&dt=t&q=${encodeURIComponent(source)}`
  );
  const payload = await response.json();
  return parseApiResponse(payload);
};

const requestTranslation = async (source: string, target: TranslateTarget) => {
  const endpoint = getConfiguredEndpoint();
  const { protectedText, restore } = protectInterpolation(source);

  if (endpoint === DEFAULT_ENDPOINT || endpoint.includes('translate.googleapis.com')) {
    const translated = await requestGoogleTranslation(protectedText, target);
    return translated ? restore(translated) : source;
  }

  if (endpoint.includes('mymemory.translated.net')) {
    const response = await fetch(`${endpoint}?q=${encodeURIComponent(protectedText)}&langpair=${SOURCE_LANGUAGE}|${target}`);
    const payload = await response.json();
    const translated = parseApiResponse(payload);
    return translated ? restore(translated) : source;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: protectedText, source: SOURCE_LANGUAGE, target, format: 'text' }),
  });
  const payload = await response.json();
  const translated = parseApiResponse(payload);
  return translated ? restore(translated) : source;
};

const chunkSources = (sources: string[]) => {
  const chunks: string[][] = [];
  let current: string[] = [];
  let currentLength = 0;

  sources.forEach((source) => {
    const nextLength = source.length + BATCH_SEPARATOR.length;
    if (current.length > 0 && (current.length >= 40 || currentLength + nextLength > 4200)) {
      chunks.push(current);
      current = [];
      currentLength = 0;
    }

    current.push(source);
    currentLength += nextLength;
  });

  if (current.length > 0) chunks.push(current);
  return chunks;
};

export const translateWithApi = async (source: string, target: string) => {
  const normalizedTarget = target.startsWith('en') ? 'en' : 'es';
  const cleanSource = source.trim();

  if (!cleanSource || normalizedTarget === SOURCE_LANGUAGE) return source;

  const cacheKey = buildCacheKey(source, normalizedTarget);
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) return normalizeKnownTranslation(source, cached, normalizedTarget);

  try {
    const translated = normalizeKnownTranslation(source, await requestTranslation(source, normalizedTarget), normalizedTarget);
    await AsyncStorage.setItem(cacheKey, translated);
    return translated;
  } catch (error) {
    console.warn('[i18n] Translation API unavailable, using source text.', error);
    return source;
  }
};

export const translateManyWithApi = async (sources: string[], target: string) => {
  const normalizedTarget = target.startsWith('en') ? 'en' : 'es';
  const results = new Map<string, string>();
  const uniqueSources = Array.from(new Set(sources)).filter((source) => source.trim());

  if (normalizedTarget === SOURCE_LANGUAGE || uniqueSources.length === 0) {
    uniqueSources.forEach((source) => results.set(source, source));
    return results;
  }

  const cacheKeys = uniqueSources.map((source) => buildCacheKey(source, normalizedTarget));
  const cachedPairs = await AsyncStorage.multiGet(cacheKeys);
  const pending: string[] = [];

  uniqueSources.forEach((source, index) => {
    const cached = cachedPairs[index]?.[1];
    if (cached) {
      results.set(source, normalizeKnownTranslation(source, cached, normalizedTarget));
    } else {
      pending.push(source);
    }
  });

  for (const chunk of chunkSources(pending)) {
    try {
      const protectedItems = chunk.map((source) => protectInterpolation(source));
      const joinedSource = protectedItems.map((item) => item.protectedText).join(BATCH_SEPARATOR);
      const translatedJoined = await requestGoogleTranslation(joinedSource, normalizedTarget);
      const translatedItems = translatedJoined.split(BATCH_SEPARATOR);
      const cacheUpdates: [string, string][] = [];

      chunk.forEach((source, index) => {
        const translated = normalizeKnownTranslation(source, protectedItems[index].restore((translatedItems[index] || '').trim()) || source, normalizedTarget);
        results.set(source, translated);
        cacheUpdates.push([buildCacheKey(source, normalizedTarget), translated]);
      });

      if (cacheUpdates.length > 0) await AsyncStorage.multiSet(cacheUpdates);
    } catch (error) {
      console.warn('[i18n] Translation API batch unavailable, using source text.', error);
      chunk.forEach((source) => results.set(source, source));
    }
  }

  return results;
};
