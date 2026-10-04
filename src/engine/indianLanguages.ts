export interface IndianLanguageOption {
  code: string;
  nameEn: string;
  nameNative: string;
  script: string;
}

export const INDIAN_LANGUAGES: IndianLanguageOption[] = [
  { code: 'en', nameEn: 'English', nameNative: 'English', script: 'Latin' },
  { code: 'hi', nameEn: 'Hindi', nameNative: 'हिन्दी', script: 'Devanagari' },
  { code: 'bn', nameEn: 'Bengali', nameNative: 'বাংলা', script: 'Bengali' },
  { code: 'mr', nameEn: 'Marathi', nameNative: 'मराठी', script: 'Devanagari' },
  { code: 'te', nameEn: 'Telugu', nameNative: 'తెలుగు', script: 'Telugu' },
  { code: 'ta', nameEn: 'Tamil', nameNative: 'தமிழ்', script: 'Tamil' },
  { code: 'gu', nameEn: 'Gujarati', nameNative: 'ગુજરાતી', script: 'Gujarati' },
  { code: 'ur', nameEn: 'Urdu', nameNative: 'اردو', script: 'Perso-Arabic' },
  { code: 'kn', nameEn: 'Kannada', nameNative: 'ಕನ್ನಡ', script: 'Kannada' },
  { code: 'or', nameEn: 'Odia', nameNative: 'ଓଡ଼ିଆ', script: 'Odia' },
  { code: 'ml', nameEn: 'Malayalam', nameNative: 'മലയാളം', script: 'Malayalam' },
  { code: 'pa', nameEn: 'Punjabi', nameNative: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  { code: 'as', nameEn: 'Assamese', nameNative: 'অসমীয়া', script: 'Assamese' },
  { code: 'mai', nameEn: 'Maithili', nameNative: 'मैथिली', script: 'Devanagari' },
  { code: 'sat', nameEn: 'Santali', nameNative: 'ᱥᱟᱱᱛᱟᱲᱤ', script: 'Ol Chiki' },
  { code: 'ks', nameEn: ' Kashmiri', nameNative: 'कॉशुर / کٲشُر', script: 'Devanagari/Perso-Arabic' },
  { code: 'ne', nameEn: 'Nepali', nameNative: 'नेपाली', script: 'Devanagari' },
  { code: 'sd', nameEn: 'Sindhi', nameNative: 'सिन्धी / سنڌي', script: 'Devanagari/Perso-Arabic' },
  { code: 'doi', nameEn: 'Dogri', nameNative: 'डोगरी', script: 'Devanagari' },
  { code: 'kok', nameEn: 'Konkani', nameNative: 'कोंकणी', script: 'Devanagari' },
  { code: 'mni', nameEn: 'Manipuri', nameNative: 'মৈতৈলোন্', script: 'Meitei/Bengali' },
  { code: 'brx', nameEn: 'Bodo', nameNative: "बर'", script: 'Devanagari' },
  { code: 'sa', nameEn: 'Sanskrit', nameNative: 'संस्कृतम्', script: 'Devanagari' },
];

export interface UiTranslationStrings {
  navAsk: string;
  navTender: string;
  navSaved: string;
  navHelp: string;
  askPrompt: string;
  findButton: string;
  findingSpinner: string;
  completenessLabel: string;
  looksRight: string;
  checkThis: string;
  notSure: string;
  whyThis: string;
  currentVersion: string;
  replacedPrefix: string;
  withWord: string;
  certificationLabel: string;
  noRuleFound: string;
  alsoNeededTitle: string;
  saveBtn: string;
  downloadPdfBtn: string;
  copyListBtn: string;
  translateBundleBtn: string;
  translatingSpinner: string;
}

const DEFAULT_EN_STRINGS: UiTranslationStrings = {
  navAsk: 'Ask',
  navTender: 'Check my tender',
  navSaved: 'My saved specs',
  navHelp: 'Help',
  askPrompt: 'What product or item are you buying?',
  findButton: 'Find Standards',
  findingSpinner: 'Finding the right standards...',
  completenessLabel: 'Bundle Completeness',
  looksRight: 'Looks right',
  checkThis: 'Check this',
  notSure: 'Not sure',
  whyThis: 'Why this?',
  currentVersion: 'Current version',
  replacedPrefix: 'Replaced',
  withWord: 'with',
  certificationLabel: 'Certification',
  noRuleFound: "We couldn't find a rule in our table",
  alsoNeededTitle: 'Also needed (Companion Standards)',
  saveBtn: 'Save',
  downloadPdfBtn: 'Download PDF',
  copyListBtn: 'Copy list',
  translateBundleBtn: 'Translate Results',
  translatingSpinner: 'Translating into selected Indian language...',
};

export const UI_DICTIONARY: Record<string, Partial<UiTranslationStrings>> = {
  en: DEFAULT_EN_STRINGS,
  hi: {
    navAsk: 'मानक खोजें (Ask)',
    navTender: 'निविदा जांचें (Check tender)',
    navSaved: 'सहेजे गए मानक (Saved specs)',
    navHelp: 'सहायता (Help)',
    askPrompt: 'आप कौन सा उत्पाद या वस्तु खरीद रहे हैं?',
    findButton: 'मानक खोजें',
    findingSpinner: 'सही भारतीय मानक खोजे जा रहे हैं...',
    completenessLabel: 'बंडल पूर्णता (Completeness)',
    looksRight: 'सही लगता है (Looks right)',
    checkThis: 'इसकी जांच करें (Check this)',
    notSure: 'निश्चित नहीं (Not sure)',
    whyThis: 'यह मानक क्यों?',
    currentVersion: 'वर्तमान संस्करण',
    replacedPrefix: 'पुराना मानक',
    withWord: 'के स्थान पर',
    certificationLabel: 'प्रमाणन (Certification)',
    noRuleFound: 'हमारी तालिका में कोई नियम नहीं मिला',
    alsoNeededTitle: 'साथ में आवश्यक (सहयोगी मानक)',
    saveBtn: 'सहेजें (Save)',
    downloadPdfBtn: 'रिपोर्ट डाउनलोड करें (PDF)',
    copyListBtn: 'सूची कॉपी करें',
    translateBundleBtn: 'परिणाम अनुवाद करें',
    translatingSpinner: 'चयनित भारतीय भाषा में अनुवाद हो रहा है...',
  },
  bn: {
    navAsk: 'মানক খুঁজুন (Ask)',
    navTender: 'টেন্ডার যাচাই করুন',
    navSaved: 'সংরক্ষিত স্পেকস',
    navHelp: 'সহায়তা (Help)',
    askPrompt: 'আপনি কোন পণ্য বা সামগ্রী কিনছেন?',
    findButton: 'মানক খুঁজুন',
    findingSpinner: 'সঠিক ভারতীয় মানক খোঁজা হচ্ছে...',
    completenessLabel: 'বান্ডিল সম্পূর্ণতা',
    looksRight: 'সঠিক মনে হচ্ছে',
    checkThis: 'এটি যাচাই করুন',
    notSure: 'নিশ্চিত নয়',
    whyThis: 'কেন এই মানক?',
    currentVersion: 'বর্তমান সংস্করণ',
    certificationLabel: 'সার্টিফিকেশন',
    noRuleFound: 'আমাদের তালিকায় কোনো নিয়ম পাওয়া যায়নি',
    alsoNeededTitle: 'এছাড়াও প্রয়োজন (সহযোগী মানক)',
    saveBtn: 'সংরক্ষণ করুন',
    downloadPdfBtn: 'ডাউনলোড (PDF)',
    copyListBtn: 'তালিকা কপি করুন',
  },
  mr: {
    navAsk: 'मानके शोधा (Ask)',
    navTender: 'माझी निविदा तपासा',
    navSaved: 'जतन केलेली मानके',
    navHelp: 'मदत (Help)',
    askPrompt: 'तुम्ही कोणती वस्तू किंवा उत्पादन खरेदी करत आहात?',
    findButton: 'मानके शोधा',
    findingSpinner: 'योग्य भारतीय मानके शोधत आहे...',
    completenessLabel: 'बंडल पूर्णता',
    looksRight: 'योग्य वाटते',
    checkThis: 'हे तपासा',
    notSure: 'खात्री नाही',
    whyThis: 'हे मानक का?',
    currentVersion: 'सध्याची आवृत्ती',
    certificationLabel: 'प्रमाणन',
    noRuleFound: 'आमच्या तक्त्यामध्ये कोणताही नियम सापडला नाही',
    alsoNeededTitle: 'सोबत आवश्यक (सहयोगी मानके)',
    saveBtn: 'जतन करा',
    downloadPdfBtn: 'डाउनलोड करा (PDF)',
    copyListBtn: 'यादी कॉपी करा',
  },
  te: {
    navAsk: 'ప్రమాణాలు వెతకండి (Ask)',
    navTender: 'టెండర్ తనిఖీ చేయండి',
    navSaved: 'సేవ్ చేసినవి',
    navHelp: 'సహాయం (Help)',
    askPrompt: 'మీరు ఏ ఉత్పత్తి లేదా వస్తువును కొనుగోలు చేస్తున్నారు?',
    findButton: 'ప్రమాణాలు వెతకండి',
    findingSpinner: 'సరైన భారతీయ ప్రమాణాలను వెతుకుతోంది...',
    completenessLabel: 'బండిల్ పూర్తి స్థాయి',
    looksRight: 'సరిగ్గా కనిపిస్తోంది',
    checkThis: 'ఇది తనిఖీ చేయండి',
    notSure: 'ఖచ్చితంగా తెలియదు',
    whyThis: 'ఇది ఎందుకు?',
    currentVersion: 'ప్రస్తుత వెర్షన్',
    certificationLabel: 'ధృవీకరణ',
    noRuleFound: 'మా పట్టికలో నియమం కనుగొనబడలేదు',
    alsoNeededTitle: 'అదనంగా అవసరమైనవి',
    saveBtn: 'సేవ్ చేయండి',
    downloadPdfBtn: 'డౌన్‌లోడ్ (PDF)',
    copyListBtn: 'జాబితా కాపీ చేయండి',
  },
  ta: {
    navAsk: 'தரநிலைகளைத் தேடு (Ask)',
    navTender: 'டெண்டரை சரிபார்க்கவும்',
    navSaved: 'சேமித்தவை',
    navHelp: 'உதவி (Help)',
    askPrompt: 'நீங்கள் எந்த பொருள் அல்லது தயாரிப்பை வாங்குகிறீர்கள்?',
    findButton: 'தரநிலைகளைக் கண்டறி',
    findingSpinner: 'சரியான இந்திய தரநிலைகளைத் தேடுகிறது...',
    completenessLabel: 'தொகுப்பு முழுமை',
    looksRight: 'சரியாகத் தெரிகிறது',
    checkThis: 'இதைச் சரிபார்க்கவும்',
    notSure: 'உறுதியாகத் தெரியவில்லை',
    whyThis: 'இது ஏன்?',
    currentVersion: 'தற்போதைய பதிப்பு',
    certificationLabel: 'சான்றிதழ்',
    noRuleFound: 'எங்கள் அட்டவணையில் விதி எதுவும் கிடைக்கவில்லை',
    alsoNeededTitle: 'கூடுதலாகத் தேவைப்படும் தரநிலைகள்',
    saveBtn: 'சேமி',
    downloadPdfBtn: 'பதிவிறக்கு (PDF)',
    copyListBtn: 'பட்டியலை நகலெடு',
  },
  gu: {
    navAsk: 'માનકો શોધો (Ask)',
    navTender: 'ટેન્ડર તપાસો',
    navSaved: 'સાચવેલા સ્પેક્સ',
    navHelp: 'મદદ (Help)',
    askPrompt: 'તમે કઈ વસ્તુ કે ઉત્પાદન ખરીદી રહ્યા છો?',
    findButton: 'માનકો શોધો',
    findingSpinner: 'યોગ્ય ભારતીય માનકો શોધી રહ્યું છે...',
    completenessLabel: 'બંડલ પૂર્ણતા',
    looksRight: 'સાચું લાગે છે',
    checkThis: 'આ તપાસો',
    notSure: 'ખાતરી નથી',
    whyThis: 'આ શા માટે?',
    currentVersion: 'વર્તમાન આવૃત્તિ',
    certificationLabel: 'પ્રમાણપત્ર',
    noRuleFound: 'અમારા કોષ્ટકમાં કોઈ નિયમ મળ્યો નથી',
    alsoNeededTitle: 'આ ઉપરાંત જરૂરી (સહયોગી માનકો)',
    saveBtn: 'સાચવો',
    downloadPdfBtn: 'ડાઉનલોડ (PDF)',
    copyListBtn: 'યાદી કોપી કરો',
  },
  kn: {
    navAsk: 'ಮಾನದಂಡ ಹುಡುಕಿ (Ask)',
    navTender: 'ಟೆಂಡರ್ ಪರಿಶೀಲಿಸಿ',
    navSaved: 'ಉಳಿಸಿದ ಮಾನದಂಡಗಳು',
    navHelp: 'ಸಹಾಯ (Help)',
    askPrompt: 'ನೀವು ಯಾವ ಉತ್ಪನ್ನ ಅಥವಾ ವಸ್ತುವನ್ನು ಖರೀದಿಸುತ್ತಿದ್ದೀರಿ?',
    findButton: 'ಮಾನದಂಡಗಳನ್ನು ಹುಡುಕಿ',
    findingSpinner: 'ಸರಿಯಾದ ಭಾರತೀಯ ಮಾನದಂಡಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...',
    completenessLabel: 'ಬಂಡಲ್ ಪೂರ್ಣತೆ',
    looksRight: 'ಸರಿಯಾಗಿದೆ',
    checkThis: 'ಇದನ್ನು ಪರಿಶೀಲಿಸಿ',
    notSure: 'ಖಚಿತವಿಲ್ಲ',
    whyThis: 'ಇದು ಏಕೆ?',
    currentVersion: 'ಪ್ರಸ್ತುತ ಆವೃತ್ತಿ',
    certificationLabel: 'ಪ್ರಮಾಣೀಕರಣ',
    noRuleFound: 'ನಮ್ಮ ಕೋಷ್ಟಕದಲ್ಲಿ ಯಾವುದೇ ನಿಯಮ ಕಂಡುಬಂದಿಲ್ಲ',
    alsoNeededTitle: 'ಇದಲ್ಲದೆ ಅಗತ್ಯವಿರುವ ಮಾನದಂಡಗಳು',
    saveBtn: 'ಉಳಿಸಿ',
    downloadPdfBtn: 'ಡೌನ್‌ಲೋಡ್ (PDF)',
    copyListBtn: 'ಪಟ್ಟಿ ನಕಲಿಸಿ',
  },
  ml: {
    navAsk: 'നിലവാരം തിരയുക (Ask)',
    navTender: 'ടെൻഡർ പരിശോധിക്കുക',
    navSaved: 'സേവ് ചെയ്തവ',
    navHelp: 'സഹായം (Help)',
    askPrompt: 'നിങ്ങൾ ഏത് ഉൽപ്പന്നമാണ് വാങ്ങുന്നത്?',
    findButton: 'നിലവാരങ്ങൾ കണ്ടെത്തുക',
    findingSpinner: 'ശരിയായ ഇന്ത്യൻ നിലവാരങ്ങൾ തിരയുന്നു...',
    completenessLabel: 'ബണ്ടിൽ പൂർണ്ണത',
    looksRight: 'ശരിയാണെന്ന് തോന്നുന്നു',
    checkThis: 'ഇത് പരിശോധിക്കുക',
    notSure: 'ഉറപ്പില്ല',
    whyThis: 'എന്തുകൊണ്ട് ഇത്?',
    currentVersion: 'നിലവിലെ പതിപ്പ്',
    certificationLabel: 'സർട്ടിഫിക്കേഷൻ',
    noRuleFound: 'ഞങ്ങളുടെ പട്ടികയിൽ നിയമമൊന്നും കണ്ടെത്തിയില്ല',
    alsoNeededTitle: 'കൂടാതെ ആവശ്യമുള്ളവ',
    saveBtn: 'സേവ് ചെയ്യുക',
    downloadPdfBtn: 'ഡൗൺലോഡ് (PDF)',
    copyListBtn: 'ലിസ്റ്റ് പകർത്തുക',
  },
  pa: {
    navAsk: 'ਮਿਆਰ ਲੱਭੋ (Ask)',
    navTender: 'ਟੈਂਡਰ ਚੈੱਕ ਕਰੋ',
    navSaved: 'ਸੇਵ ਕੀਤੇ ਮਿਆਰ',
    navHelp: 'ਮਦਦ (Help)',
    askPrompt: 'ਤੁਸੀਂ ਕਿਹੜਾ ਉਤਪਾਦ ਜਾਂ ਵਸਤੂ ਖਰੀਦ ਰਹੇ ਹੋ?',
    findButton: 'ਮਿਆਰ ਲੱਭੋ',
    findingSpinner: 'ਸਹੀ ਭਾਰਤੀ ਮਿਆਰ ਲੱਭੇ ਜਾ ਰਹੇ ਹਨ...',
    completenessLabel: 'ਬੰਡਲ ਸੰਪੂਰਨਤਾ',
    looksRight: 'ਸਹੀ ਲੱਗਦਾ ਹੈ',
    checkThis: 'ਇਸ ਦੀ ਜਾਂਚ ਕਰੋ',
    notSure: 'ਪੱਕਾ ਨਹੀਂ',
    whyThis: 'ਇਹ ਕਿਉਂ?',
    currentVersion: 'ਮੌਜੂਦਾ ਸੰਸਕਰਣ',
    certificationLabel: 'ਪ੍ਰਮਾਣੀਕਰਨ',
    noRuleFound: 'ਸਾਡੀ ਸਾਰਣੀ ਵਿੱਚ ਕੋਈ ਨਿਯਮ ਨਹੀਂ ਮਿਲਿਆ',
    alsoNeededTitle: 'ਨਾਲ ਲੋੜੀਂਦੇ ਮਿਆਰ',
    saveBtn: 'ਸੇਵ ਕਰੋ',
    downloadPdfBtn: 'ਡਾਊਨਲੋਡ (PDF)',
    copyListBtn: 'ਸੂਚੀ ਕਾਪੀ ਕਰੋ',
  },
  or: {
    navAsk: 'মানକ ଖୋଜନ୍ତୁ (Ask)',
    navTender: 'ଟେଣ୍ଡର ଯାଞ୍ଚ କରନ୍ତୁ',
    navSaved: 'ସଂରକ୍ଷିତ ମାନକ',
    navHelp: 'ସହାୟତା (Help)',
    askPrompt: 'ଆପଣ କେଉଁ ଉତ୍ପାଦ କିମ୍ବା ସାମଗ୍ରୀ କିଣୁଛନ୍ତି?',
    findButton: 'ମାନକ ଖୋଜନ୍ତୁ',
    findingSpinner: 'ସଠିକ୍ ଭାରତୀୟ ମାନକ ଖୋଜାଯାଉଛି...',
    completenessLabel: 'ବଣ୍ଡଲ୍ ସମ୍ପୂର୍ଣ୍ଣତା',
    looksRight: 'ଠିକ୍ ଲାଗୁଛି',
    checkThis: 'ଏହାକୁ ଯାଞ୍ଚ କରନ୍ତୁ',
    notSure: 'ନିଶ୍ଚିତ ନୁହେଁ',
    whyThis: 'ଏହା କାହିଁକି?',
    currentVersion: 'ବର୍ତ୍ତମାନ ସଂସ୍କରଣ',
    certificationLabel: 'ପ୍ରମାଣପତ୍ର',
    noRuleFound: 'ଆମ ତାଲିକାରେ କୌଣସି ନିୟମ ମିଳିଲା ନାହିଁ',
    alsoNeededTitle: 'ଏହା ସହିତ ଆବଶ୍ୟକ ମାନକ',
    saveBtn: 'ସଂରକ୍ଷଣ କରନ୍ତୁ',
    downloadPdfBtn: 'ଡାଉନଲୋଡ୍ (PDF)',
    copyListBtn: 'ତାଲିକା କପି କରନ୍ତୁ',
  },
  ur: {
    navAsk: 'معیار تلاش کریں (Ask)',
    navTender: 'ٹینڈر چیک کریں',
    navSaved: 'محفوظ کردہ معیارات',
    navHelp: 'مدد (Help)',
    askPrompt: 'آپ کون سی مصنوعات یا اشیاء خرید رہے ہیں؟',
    findButton: 'معیار تلاش کریں',
    findingSpinner: 'درست ہندوستانی معیارات تلاش کیے جا رہے ہیں...',
    completenessLabel: 'بنڈل کی تکمیل',
    looksRight: 'درست لگتا ہے',
    checkThis: 'اسے چیک کریں',
    notSure: 'یقین نہیں',
    whyThis: 'یہ کیوں؟',
    currentVersion: 'موجودہ ورژن',
    certificationLabel: 'سرٹیفیکیشن',
    noRuleFound: 'ہماری جدول میں کوئی اصول نہیں ملا',
    alsoNeededTitle: 'دیگر ضروری معیارات',
    saveBtn: 'محفوظ کریں',
    downloadPdfBtn: 'ڈاؤن لوڈ (PDF)',
    copyListBtn: 'فہرست کاپی کریں',
  },
};

export function getUiStrings(langCode: string): UiTranslationStrings {
  const partial = UI_DICTIONARY[langCode] || {};
  return {
    ...DEFAULT_EN_STRINGS,
    ...partial,
  };
}

const translationCache = new Map<string, string[]>();

export async function translateTextsToIndianLanguage(
  texts: string[],
  targetLangCode: string,
  targetLangName: string
): Promise<{ translations: string[]; provider: string; error?: string }> {
  if (targetLangCode === 'en' || texts.length === 0) {
    return { translations: texts, provider: 'Identity (English)' };
  }

  const cacheKey = `${targetLangCode}::${texts.join('||')}`;
  const cached = translationCache.get(cacheKey);
  if (cached) {
    return { translations: cached, provider: 'Cached Gemini Translation' };
  }

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts,
        targetLangCode,
        targetLangName,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Translation request failed');
    }

    if (Array.isArray(data.translations) && data.translations.length === texts.length) {
      translationCache.set(cacheKey, data.translations);
      return {
        translations: data.translations,
        provider: data.provider || 'Gemini Server API',
      };
    }
    throw new Error('Unexpected translation response format');
  } catch (err) {
    return {
      translations: texts,
      provider: 'Fallback',
      error: err instanceof Error ? err.message : 'Translation failed',
    };
  }
}
