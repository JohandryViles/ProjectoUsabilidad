export const TEXT_SIZES = [100, 112, 125, 150];
export const TTS_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const DEFAULTS = {
  theme: 'light',
  size: 100,
  spacing: false,
  reducedMotion: false,
  focus: false,
  // Ampliación del menú de accesibilidad (F3).
  saturation: 'normal',
  legibleFont: false,
  readingGuide: false,
  readingMode: false,
  tts: false,
  ttsRate: 1,
  captionsLarge: false,
  pictograms: false,
  strongFocus: false,
  underlineLinks: false,
  bigCursor: false,
};

export function readSaved(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

const BOOLEAN_KEYS = Object.keys(DEFAULTS).filter((key) => typeof DEFAULTS[key] === 'boolean');

export function initialPrefs() {
  const saved = readSaved('incluaula.preferences.v1', {});
  const prefs = {
    theme: ['light', 'dark', 'contrast'].includes(saved.theme) ? saved.theme : 'light',
    size: TEXT_SIZES.includes(saved.size) ? saved.size : 100,
    saturation: ['normal', 'low', 'gray'].includes(saved.saturation) ? saved.saturation : 'normal',
    ttsRate: TTS_RATES.includes(saved.ttsRate) ? saved.ttsRate : 1,
  };
  for (const key of BOOLEAN_KEYS) prefs[key] = saved[key] === true;
  return { ...DEFAULTS, ...prefs };
}
