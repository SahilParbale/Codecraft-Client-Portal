/**
 * Utility functions for dynamically translating user-entered data
 */

export async function translateText(text, sourceLang, targetLang) {
  if (!text || text.trim() === '') return text;
  if (sourceLang === targetLang) return text;
  
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
  } catch (error) {
    console.error("Translation API error:", error);
  }
  return text; // Fallback to original text if error
}

export async function translateClientField(text, currentLang) {
  if (!text) return { en: text, mr: text };
  
  // Map our UI languages ('en', 'mr') to API language codes if necessary
  // MyMemory supports 'en' and 'mr' directly.
  const isCurrentlyMarathi = currentLang === 'mr';
  const sourceLang = isCurrentlyMarathi ? 'mr' : 'en';
  const targetLang = isCurrentlyMarathi ? 'en' : 'mr';
  
  const translated = await translateText(text, sourceLang, targetLang);
  
  return {
    en: isCurrentlyMarathi ? translated : text,
    mr: isCurrentlyMarathi ? text : translated
  };
}
