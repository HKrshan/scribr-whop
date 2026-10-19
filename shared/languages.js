export const LANGUAGE_OPTIONS = Object.freeze([
  ['en','English','English'], ['zh','Mandarin Chinese','中文'], ['hi','Hindi','हिन्दी'],
  ['es','Spanish','Español'], ['ar','Arabic','العربية'], ['fr','French','Français'],
  ['bn','Bengali','বাংলা'], ['pt','Portuguese','Português'], ['id','Indonesian','Bahasa Indonesia'],
  ['ur','Urdu','اردو'], ['ru','Russian','Русский'], ['de','German','Deutsch'],
  ['ja','Japanese','日本語'], ['mr','Marathi','मराठी'], ['vi','Vietnamese','Tiếng Việt'],
  ['te','Telugu','తెలుగు'], ['sw','Swahili','Kiswahili'], ['ha','Hausa','Hausa'], ['tr','Turkish','Türkçe']
].map(([code,name,nativeName]) => Object.freeze({code,name,nativeName,direction:['ar','ur'].includes(code)?'rtl':'ltr'})));
export const isLanguage = code => LANGUAGE_OPTIONS.some(item => item.code === code);
export const languageInfo = code => LANGUAGE_OPTIONS.find(item => item.code === code);
export const isSubtitleLanguage = code => code === 'original' || isLanguage(code);
