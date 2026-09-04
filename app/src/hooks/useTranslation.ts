import { useAuth } from './useAuth';

const translations: Record<string, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    myListing: 'My Listings',
    messages: 'Messages',
    profile: 'Profile',
    settings: 'Settings',
    notifications: 'Notifications',

    findRoommate: 'Find Your Perfect Roommate',
    tagline: 'Connect with roommates and owners across India.',
    verified: 'Verified',
    exploreMatches: 'Explore Matches',
    lifestyles: 'Lifestyles',
    budget: 'Budget',
    searchPlaceholder: 'Search by locality or city...',
    compatibility: 'Compatibility',
    language: 'Language',
    darkMode: 'Dark Mode',
    save: 'Save',
    logout: 'Logout',
    connected: 'Connected',
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    myListing: 'मेरी लिस्टिंग',
    messages: 'संदेश',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    notifications: 'सूचनाएं',

    findRoommate: 'अपना आदर्श रूममेट ढूंढें',
    tagline: 'भारत में अनुकूल रूममेट्स और मालिकों से जुड़ें।',
    verified: 'सत्यापित',
    exploreMatches: 'मैच खोजें',
    lifestyles: 'जीवन शैली',
    budget: 'बजट',
    searchPlaceholder: 'इलाके या शहर से खोजें...',
    compatibility: 'संगतता',
    language: 'भाषा',
    darkMode: 'डार्क मोड',
    save: 'सहेजें',
    logout: 'लॉगआउट',
    connected: 'जुड़े हुए',
  },
  ta: {
    dashboard: 'டாஷ்போர்டு',
    myListing: 'எனது பட்டியல்கள்',
    messages: 'செய்திகள்',
    profile: 'சுயவிவரம்',
    settings: 'அமைப்புகள்',
    notifications: 'அறிவிப்புகள்',

    findRoommate: 'உங்கள் சிறந்த அறை தோழரைக் கண்டறியவும்',
    tagline: 'இந்தியாவில் பொருத்தமான அறை தோழர்கள் மற்றும் உரிமையாளர்களுடன் இணையுங்கள்.',
    verified: 'சரிபார்க்கப்பட்டது',
    exploreMatches: 'பொருத்தங்களை ஆராயுங்கள்',
    lifestyles: 'வாழ்க்கை முறைகள்',
    budget: 'பட்ஜெட்',
    searchPlaceholder: 'பகுதி அல்லது நகரம் மூலம் தேடவும்...',
    compatibility: 'இணக்கம்',
    language: 'மொழி',
    darkMode: 'இருண்ட பயன்முறை',
    save: 'சேமி',
    logout: 'வெளியேறு',
    connected: 'இணைக்கப்பட்டது',
  },
  te: {
    dashboard: 'డాష్‌బోర్డ్',
    myListing: 'నా లిస్టింగ్‌లు',
    messages: 'సందేశాలు',
    profile: 'ప్రొఫైల్',
    settings: 'సెట్టింగ్లు',
    notifications: 'నోటిఫికేషన్‌లు',

    findRoommate: 'మీ పరిపూర్ణ రూమ్‌మేట్‌ను కనుగొనండి',
    tagline: 'భారతదేశంలో సరిపోయే రూమ్‌మేట్స్ మరియు యజమానులతో కనెక్ట్ అవ్వండి.',
    verified: 'ధృవీకరించబడింది',
    exploreMatches: 'పొంతనలను అన్వేషించండి',
    lifestyles: 'జీవనశైలి',
    budget: 'బడ్జెట్',
    searchPlaceholder: 'ప్రాంతం లేదా నగరం ద్వారా శోధించండి...',
    compatibility: 'అనుకూలత',
    language: 'భాష',
    darkMode: 'డార్క్ మోడ్',
    save: 'సేవ్ చేయి',
    logout: 'లాగ్అవుట్',
    connected: 'కనెక్ట్ చేయబడింది',
  }
};

export function useTranslation() {
  const { profile } = useAuth();
  const lang = profile?.settings?.language || 'en';

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return { t, currentLanguage: lang };
}
