import {
  Sun, Moon, Utensils, Leaf, Ban, Wine, Sparkles, Briefcase, Dog, Users,
  BookOpen, Activity, Dumbbell, Compass, Heart, ShieldCheck
} from 'lucide-react';
import type { ElementType } from 'react';
import type { Listing } from '@/hooks/useListings';
import type { UserProfile } from '@/hooks/useAuth';

export interface DynamicBadge {
  icon: ElementType;
  label: string;
  bg: string;
}

export const CITY_TO_STATE: Record<string, string> = {
  'chennai': 'Tamil Nadu',
  'bengaluru': 'Karnataka',
  'bangalore': 'Karnataka',
  'hyderabad': 'Telangana',
  'pune': 'Maharashtra',
  'mumbai': 'Maharashtra',
  'delhi': 'Delhi',
  'delhi ncr': 'Delhi NCR',
  'gurgaon': 'Haryana',
  'noida': 'Uttar Pradesh',
  'kolkata': 'West Bengal',
  'ahmedabad': 'Gujarat',
  'jaipur': 'Rajasthan',
  'chandigarh': 'Punjab / Chandigarh',
  'kochi': 'Kerala',
  'goa': 'Goa',
  'lucknow': 'Uttar Pradesh',
  'indore': 'Madhya Pradesh',
  'coimbatore': 'Tamil Nadu',
};

export function resolveState(city?: string): string {
  if (!city) return '';
  return CITY_TO_STATE[city.trim().toLowerCase()] || '';
}

export function formatLocationString(locality?: string, city?: string, state?: string): string {
  const resolvedState = state?.trim() || resolveState(city);
  const localParts = [locality?.trim(), city?.trim(), resolvedState].filter(Boolean);
  if (localParts.length === 0) {
    return 'Location not specified';
  }
  return [...localParts, 'India'].join(', ');
}

/**
 * Derives 100% authentic dynamic lifestyle preference badges based strictly on
 * quiz answers, household expectations, house rules, amenities, and profession.
 * No hardcoded or fabricated traits.
 */
export function getDynamicPreferences(options: {
  quizAnswers?: Record<string, string>;
  householdExpectations?: any;
  houseRules?: string[];
  amenities?: string[];
  profession?: string;
}): DynamicBadge[] {
  const {
    quizAnswers = {},
    householdExpectations,
    houseRules = [],
    amenities = [],
    profession = '',
  } = options;

  const badges: DynamicBadge[] = [];
  const addedLabels = new Set<string>();

  const addBadge = (icon: ElementType, label: string, bg: string) => {
    if (!addedLabels.has(label)) {
      addedLabels.add(label);
      badges.push({ icon, label, bg });
    }
  };

  // 1. Wake time
  const wakeTime = quizAnswers.wake_time;
  if (wakeTime === 'before_6' || wakeTime === '6_to_8') {
    addBadge(Sun, 'Early Bird', 'bg-amber-50 text-amber-600 border-amber-200/70');
  } else if (wakeTime === 'after_10') {
    addBadge(Moon, 'Night Owl', 'bg-indigo-50 text-indigo-600 border-indigo-200/70');
  }

  // 2. Sleep time
  const sleepTime = quizAnswers.sleep_time;
  if (sleepTime === 'after_12' && !addedLabels.has('Night Owl')) {
    addBadge(Moon, 'Late Sleeper', 'bg-indigo-50 text-indigo-600 border-indigo-200/70');
  } else if (sleepTime === 'before_10' && !addedLabels.has('Early Bird')) {
    addBadge(Sun, 'Early Sleeper', 'bg-amber-50 text-amber-600 border-amber-200/70');
  }

  // 3. Diet / Food Preference
  const foodPref = quizAnswers.food_pref || householdExpectations?.dietPref;
  const lowerRules = houseRules.map(r => r.toLowerCase());
  const rulesMentionVeg = lowerRules.some(r => r.includes('veg'));

  if (foodPref === 'vegan') {
    addBadge(Leaf, 'Vegan', 'bg-emerald-50 text-emerald-600 border-emerald-200/70');
  } else if (foodPref === 'veg' || rulesMentionVeg) {
    addBadge(Utensils, 'Vegetarian', 'bg-green-50 text-green-600 border-green-200/70');
  }

  // 4. Smoking Policy / Preference
  const smoking = quizAnswers.smoking || householdExpectations?.smokingPolicy;
  const rulesMentionNoSmoking = lowerRules.some(r => r.includes('no smoking') || r.includes('no smoke'));
  if (smoking === 'never' || smoking === 'no_smoking' || rulesMentionNoSmoking) {
    addBadge(Ban, 'Non-Smoker', 'bg-rose-50 text-rose-600 border-rose-200/70');
  } else if (smoking === 'socially' || smoking === 'occasionally') {
    addBadge(Compass, 'Social Smoker', 'bg-stone-50 text-stone-600 border-stone-200/70');
  }

  // 5. Drinking
  const drinking = quizAnswers.drinking;
  if (drinking === 'never') {
    addBadge(Wine, 'Teetotaler', 'bg-purple-50 text-purple-600 border-purple-200/70');
  } else if (drinking === 'socially' || drinking === 'occasionally') {
    addBadge(Wine, 'Social Drinker', 'bg-amber-50 text-amber-600 border-amber-200/70');
  }

  // 6. Cleanliness
  const cleanliness = quizAnswers.cleanliness;
  const rulesMentionClean = lowerRules.some(r => r.includes('clean'));
  if (cleanliness === 'very' || rulesMentionClean) {
    addBadge(Sparkles, 'Neat & Clean', 'bg-teal-50 text-teal-600 border-teal-200/70');
  }

  // 7. Work Mode
  const workMode = quizAnswers.work_mode;
  if (workMode === 'wfh') {
    addBadge(Briefcase, 'WFH / Remote', 'bg-blue-50 text-blue-600 border-blue-200/70');
  } else if (workMode === 'wfo') {
    addBadge(Briefcase, 'Office Commuter', 'bg-sky-50 text-sky-600 border-sky-200/70');
  } else if (workMode === 'hybrid') {
    addBadge(Briefcase, 'Hybrid Work', 'bg-blue-50 text-blue-600 border-blue-200/70');
  }

  // 8. Pets
  const pets = quizAnswers.pets || householdExpectations?.petPolicy;
  const rulesMentionNoPets = lowerRules.some(r => r.includes('no pet') || r.includes('no pets'));
  if (pets === 'love' || pets === 'ok' || pets === 'pets_allowed') {
    addBadge(Dog, 'Pet Friendly', 'bg-rose-50 text-rose-600 border-rose-200/70');
  } else if (pets === 'no' || pets === 'no_pets' || rulesMentionNoPets) {
    addBadge(Ban, 'Prefer No Pets', 'bg-gray-50 text-gray-600 border-gray-200/70');
  }

  // 9. Guests & Parties
  const guests = quizAnswers.guests;
  const rulesMentionQuiet = lowerRules.some(r => r.includes('quiet') || r.includes('no parties'));
  if (guests === 'rarely' || rulesMentionQuiet) {
    addBadge(Users, 'Peace & Quiet', 'bg-violet-50 text-violet-600 border-violet-200/70');
  } else if (guests === 'often' || guests === 'very_often') {
    addBadge(Users, 'Social Host', 'bg-amber-50 text-amber-600 border-amber-200/70');
  }

  // 10. Profession cues
  const lowerProf = profession.toLowerCase();
  if (lowerProf.includes('student')) {
    addBadge(BookOpen, 'Studious', 'bg-indigo-50 text-indigo-600 border-indigo-200/70');
  } else if (lowerProf.includes('doctor') || lowerProf.includes('nurse')) {
    addBadge(Activity, 'Healthcare Pro', 'bg-emerald-50 text-emerald-600 border-emerald-200/70');
  } else if (lowerProf.includes('developer') || lowerProf.includes('engineer') || lowerProf.includes('software')) {
    addBadge(Briefcase, 'Tech Professional', 'bg-blue-50 text-blue-600 border-blue-200/70');
  }

  // 11. Amenities cues
  const lowerAmenities = amenities.map(a => a.toLowerCase());
  if (lowerAmenities.some(a => a.includes('gym'))) {
    addBadge(Dumbbell, 'Fitness Freak', 'bg-sky-50 text-sky-600 border-sky-200/70');
  }
  if (lowerAmenities.some(a => a.includes('pool') || a.includes('sport'))) {
    addBadge(Activity, 'Sporty', 'bg-emerald-50 text-emerald-600 border-emerald-200/70');
  }

  return badges;
}

/**
 * Derives authentic highlights for a room listing strictly from real room data.
 */
export function getRoomHighlights(room: Listing, isVerified: boolean): string[] {
  const highlights: string[] = [];
  const amenities = (room.amenities || []).map(a => a.toLowerCase());
  const desc = (room.description || '').toLowerCase();
  const rules = (room.houseRules || []).map(r => r.toLowerCase());

  if (isVerified) {
    highlights.push('Verified Property');
  }
  if (room.furnishing && room.furnishing.trim().length > 0) {
    highlights.push(room.furnishing);
  }
  if (
    amenities.some(a => a.includes('washroom') || a.includes('bathroom')) ||
    desc.includes('attached washroom') ||
    desc.includes('attached bathroom') ||
    desc.includes('private bath')
  ) {
    highlights.push('Attached washroom');
  }
  if (amenities.some(a => a.includes('balcony')) || desc.includes('balcony') || desc.includes('terrace')) {
    highlights.push('Attached balcony');
  }
  if (amenities.some(a => a.includes('wifi') || a.includes('internet')) || desc.includes('wifi')) {
    highlights.push('High-speed WiFi');
  }
  if (amenities.some(a => a.includes('ac') || a.includes('air condition')) || desc.includes('ac ') || desc.includes('air conditioning')) {
    highlights.push('Air Conditioned');
  }
  if (amenities.some(a => a.includes('parking')) || desc.includes('parking')) {
    highlights.push('Dedicated Parking');
  }
  if (
    amenities.some(a => a.includes('security') || a.includes('gated') || a.includes('cctv')) ||
    desc.includes('security') ||
    desc.includes('gated')
  ) {
    highlights.push('Gated society & Security');
  }
  if (amenities.some(a => a.includes('lift') || a.includes('elevator'))) {
    highlights.push('Elevator access');
  }
  if (amenities.some(a => a.includes('power backup') || a.includes('generator'))) {
    highlights.push('Power backup');
  }
  if (rules.some(r => r.includes('no smoke') || r.includes('no smoking'))) {
    highlights.push('Non-smoking home');
  }
  if (rules.some(r => r.includes('veg'))) {
    highlights.push('Vegetarian kitchen');
  }
  if (room.deposit && room.deposit > 0) {
    highlights.push(`Deposit ₹${room.deposit.toLocaleString('en-IN')}`);
  }

  return highlights;
}

/**
 * Derives authentic highlights for a seeker/flatmate profile strictly from their profile data.
 */
export function getUserHighlights(p: UserProfile, isVerified: boolean, resolvedPreferences: Record<string, string>): string[] {
  const highlights: string[] = [];

  if (isVerified) {
    highlights.push('Verified User');
  }
  if (p.workEmailVerified) {
    highlights.push('Work Verified');
  }
  if (resolvedPreferences.smoking === 'never') {
    highlights.push('Non-Smoker');
  }
  if (resolvedPreferences.food_pref === 'veg') {
    highlights.push('Vegetarian Diet');
  } else if (resolvedPreferences.food_pref === 'vegan') {
    highlights.push('Vegan Diet');
  }
  if (resolvedPreferences.cleanliness === 'very') {
    highlights.push('Cleanliness Focused');
  }
  if (resolvedPreferences.guests === 'rarely') {
    highlights.push('Quiet & Peaceful');
  }
  if (resolvedPreferences.work_mode === 'wfh') {
    highlights.push('Remote Worker');
  }
  if (resolvedPreferences.pets === 'love' || resolvedPreferences.pets === 'ok') {
    highlights.push('Pet Friendly');
  }
  if (p.budget && p.budget > 0) {
    highlights.push(`Budget ₹${p.budget.toLocaleString('en-IN')}`);
  }
  if (p.profession && p.profession.trim().length > 0) {
    highlights.push(p.profession);
  }

  return highlights;
}
