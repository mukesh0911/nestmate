// Static reference data — does NOT include mock users/listings/matches.
// This data is structural (dropdowns, quiz questions, filter options).

export const cities = [
  'Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai',
  'Kolkata', 'Ahmedabad', 'Jaipur', 'Chandigarh', 'Kochi', 'Goa',
  'Lucknow', 'Indore', 'Coimbatore'
];

export const localitiesByCity: Record<string, string[]> = {
  Bengaluru: [
    'Koramangala', 'HSR Layout', 'Indiranagar', 'Whitefield', 'Electronic City',
    'BTM Layout', 'Bellandur', 'Marathahalli', 'Jayanagar', 'JP Nagar',
    'Sarjapur Road', 'Hebbal', 'Yelahanka', 'Banashankari', 'Malleshwaram',
    'Rajajinagar', 'Frazer Town', 'Domlur', 'Kadubeesanahalli', 'Mahadevapura'
  ],
  Hyderabad: [
    'Hitech City', 'Gachibowli', 'Madhapur', 'Kondapur', 'Banjara Hills',
    'Jubilee Hills', 'Kukatpally', 'Begumpet', 'Miyapur', 'Manikonda',
    'Financial District', 'Nanakramguda', 'Ameerpet', 'Somajiguda',
    'Dilsukhnagar', 'Uppal', 'Secunderabad', 'Tolichowki', 'Mehdipatnam',
    'Nizampet', 'Hafeezpet', 'Chandanagar', 'Attapur'
  ],
  Mumbai: [
    'Andheri West', 'Andheri East', 'Bandra West', 'Bandra East', 'Powai',
    'Juhu', 'Malad West', 'Goregaon West', 'Worli', 'Dadar',
    'Thane West', 'Navi Mumbai', 'Vashi', 'Khar West', 'Santacruz',
    'Lower Parel', 'Chembur', 'Ghatkopar', 'Kandivali', 'Borivali'
  ],
  'Delhi NCR': [
    'Gurgaon Sector 56', 'Cyber City', 'DLF Phase 1-5', 'Golf Course Road',
    'Sohna Road', 'Noida Sector 62', 'Noida Sector 18', 'Greater Noida',
    'Saket', 'Hauz Khas', 'Vasant Kunj', 'Greater Kailash', 'Dwarka',
    'Indirapuram', 'Lajpat Nagar', 'Connaught Place'
  ],
  Pune: [
    'Koregaon Park', 'Kalyani Nagar', 'Hinjewadi', 'Magarpatta', 'Viman Nagar',
    'Kothrud', 'Baner', 'Wakad', 'Aundh', 'Bavdhan',
    'Pimple Saudagar', 'Kharadi', 'Hadapsar', 'Shivaji Nagar'
  ],
  Chennai: [
    'Anna Nagar', 'Adyar', 'T. Nagar', 'Velachery', 'OMR',
    'Nungambakkam', 'Mylapore', 'Kilpauk', 'Besant Nagar', 'Thiruvanmiyur',
    'Perungudi', 'Thoraipakkam', 'Sholinganallur', 'Guindy', 'Porur'
  ],
  Kolkata: [
    'Salt Lake', 'New Town', 'Park Street', 'Ballygunge', 'Dum Dum',
    'Howrah', 'Gariahat', 'Alipore', 'Rajarhat', 'Jadavpur', 'Behala'
  ],
  Ahmedabad: [
    'Satellite', 'Bodakdev', 'SG Highway', 'Navrangpura', 'Prahlad Nagar',
    'Vastrapur', 'Thaltej', 'Bopal', 'Maninagar', 'Gota'
  ],
  Jaipur: [
    'Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'C-Scheme', 'Raja Park',
    'Tonk Road', 'Jagatpura', 'Bani Park'
  ],
  Chandigarh: [
    'Sector 17', 'Sector 35', 'Sector 22', 'Sector 43', 'Sector 8',
    'Mohali Phase 7', 'Panchkula Sector 5', 'Zirakpur'
  ],
  Kochi: [
    'Kakkanad', 'Edappally', 'Marine Drive', 'Kaloor', 'Fort Kochi',
    'Palarivattom', 'Aluva', 'Vyttila', 'Infopark'
  ],
  Goa: [
    'Panaji', 'Porvorim', 'Candolim', 'Calangute', 'Margao',
    'Vasco da Gama', 'Anjuna', 'Baga', 'Assagao'
  ],
  Lucknow: [
    'Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Mahanagar',
    'Vibhuti Khand', 'Ashiyana'
  ],
  Indore: [
    'Vijay Nagar', 'Palasia', 'Bhawarkua', 'AB Road', 'Rau', 'Geeta Bhawan'
  ],
  Coimbatore: [
    'RS Puram', 'Gandhipuram', 'Peelamedu', 'Saibaba Colony', 'Saravanampatti',
    'Race Course'
  ],
};

export interface LocalityOption {
  locality: string;
  city: string;
}

export const allIndiaLocalities: LocalityOption[] = Object.entries(localitiesByCity).flatMap(
  ([cityName, locs]) => locs.map(locality => ({ locality, city: cityName }))
);

export const professions = [
  'Software Engineer', 'Product Manager', 'Designer', 'Data Analyst',
  'Marketing Professional', 'Content Writer', 'Consultant', 'Doctor',
  'Student', 'Business Professional', 'Teacher', 'Other',
];

/**
 * All valid `flatType` values that can be stored on a Listing.
 * BHK variants are classic flat-sharing options; the remaining types
 * are standalone accommodation categories surfaced by the landing page.
 */
export const flatTypes = [
  '1BHK',
  '2BHK',
  '3BHK',
  'Studio',
  'Private Room',
  'Shared Room',
  'PG',
  'Hostel',
  'Coliving',
];

/**
 * Accommodation category groups used by the pill bar in BrowseRooms
 * and the "Explore living options" section on the landing page.
 */
export const accommodationCategories: {
  id: string;
  label: string;
  flatTypes: string[];
}[] = [
  { id: 'all',   label: 'All Spaces',    flatTypes: [] },
  { id: 'rooms', label: 'Rooms & Flats', flatTypes: ['1BHK', '2BHK', '3BHK', 'Studio', 'Private Room', 'Shared Room'] },
  { id: 'pg',    label: 'PGs & Hostels', flatTypes: ['PG', 'Hostel'] },
  { id: 'coliving', label: 'Coliving',   flatTypes: ['Coliving'] },
];
export const furnishingTypes = ['Fully Furnished', 'Semi-Furnished', 'Unfurnished'];
export const amenitiesList = ['WiFi', 'AC', 'Parking', 'Washing Machine', 'Gym', 'Geyser', 'Fridge', 'TV'];
export const houseRulesList = [
  'No smoking inside', 'Veg kitchen only', 'Quiet after 11 PM',
  'No pets', 'No guests overnight', 'Maintain cleanliness', 'No parties',
];
export const genderOptions = ['Any', 'Female Only', 'Male Only'];
export const professionFilters = ['Any', 'IT / Software', 'Student', 'Business Professional', 'Doctor', 'Other'];

export const quizQuestions = [
  {
    id: 'sleep_time',
    question: 'What time do you usually go to sleep?',
    why: 'Sleep schedules are the #1 cause of roommate conflict. Matching here prevents late-night disputes.',
    options: [
      { id: 'before_10', label: 'Before 10 PM', icon: 'sun' },
      { id: '10_to_12', label: '10 PM to 12 AM', icon: 'sunset' },
      { id: 'after_12', label: 'After 12 AM', icon: 'moon' },
      { id: 'varies', label: 'Varies', icon: 'shuffle' },
    ],
  },
  {
    id: 'wake_time',
    question: 'What time do you usually wake up?',
    why: 'Morning people and night owls can coexist, but it helps to know upfront.',
    options: [
      { id: 'before_6', label: 'Before 6 AM', icon: 'sunrise' },
      { id: '6_to_8', label: '6 AM to 8 AM', icon: 'coffee' },
      { id: '8_to_10', label: '8 AM to 10 AM', icon: 'sun' },
      { id: 'after_10', label: 'After 10 AM', icon: 'moon' },
    ],
  },
  {
    id: 'food_pref',
    question: 'What is your food preference?',
    why: 'Kitchen harmony starts with understanding dietary needs and restrictions.',
    options: [
      { id: 'veg', label: 'Vegetarian', icon: 'leaf' },
      { id: 'non_veg', label: 'Non-vegetarian', icon: 'drumstick' },
      { id: 'vegan', label: 'Vegan', icon: 'seedling' },
      { id: 'no_pref', label: 'No preference', icon: 'utensils' },
    ],
  },
  {
    id: 'smoking',
    question: 'Do you smoke?',
    why: 'Smoking preferences are a dealbreaker for many. Honest answers get better matches.',
    options: [
      { id: 'never', label: 'Never', icon: 'ban' },
      { id: 'outside', label: 'Outside only', icon: 'wind' },
      { id: 'socially', label: 'Socially', icon: 'users' },
      { id: 'regularly', label: 'Regularly', icon: 'cigarette' },
    ],
  },
  {
    id: 'drinking',
    question: 'How often do you drink alcohol?',
    why: 'Drinking habits affect social dynamics at home.',
    options: [
      { id: 'never', label: 'Never', icon: 'ban' },
      { id: 'occasionally', label: 'Occasionally', icon: 'wine' },
      { id: 'socially', label: 'Socially only', icon: 'users' },
      { id: 'regularly', label: 'Regularly', icon: 'glass' },
    ],
  },
  {
    id: 'guests',
    question: 'How often do you have guests over?',
    why: 'Guest frequency affects shared spaces and noise levels.',
    options: [
      { id: 'rarely', label: 'Rarely', icon: 'home' },
      { id: 'sometimes', label: 'Sometimes', icon: 'user-plus' },
      { id: 'often', label: 'Often', icon: 'users' },
      { id: 'very_often', label: 'Very often', icon: 'party' },
    ],
  },
  {
    id: 'cleanliness',
    question: 'How important is cleanliness to you?',
    why: 'Cleanliness mismatch is the #2 cause of roommate disputes.',
    options: [
      { id: 'very', label: 'Very important', icon: 'sparkles' },
      { id: 'somewhat', label: 'Somewhat important', icon: 'broom' },
      { id: 'relaxed', label: 'Relaxed', icon: 'smile' },
      { id: 'messy', label: "I'm a bit messy", icon: 'zap' },
    ],
  },
  {
    id: 'work_mode',
    question: 'What is your work mode?',
    why: 'WFH vs WFO affects daily home usage patterns significantly.',
    options: [
      { id: 'wfo', label: 'Work from Office', icon: 'building' },
      { id: 'wfh', label: 'Work from Home', icon: 'laptop' },
      { id: 'hybrid', label: 'Hybrid', icon: 'shuffle' },
      { id: 'flexible', label: 'Flexible', icon: 'calendar' },
    ],
  },
  {
    id: 'pets',
    question: 'How do you feel about pets?',
    why: 'Pet allergies and preferences matter for a comfortable home.',
    options: [
      { id: 'love', label: 'Love them!', icon: 'heart' },
      { id: 'ok', label: "OK with others' pets", icon: 'thumbs-up' },
      { id: 'no', label: 'Prefer no pets', icon: 'x' },
      { id: 'allergic', label: 'Allergic', icon: 'alert' },
    ],
  },
  {
    id: 'roommate_gender',
    question: 'Preferred roommate gender?',
    why: 'This helps us filter matches while keeping options open.',
    options: [
      { id: 'any', label: 'Any', icon: 'users' },
      { id: 'female', label: 'Female only', icon: 'female' },
      { id: 'male', label: 'Male only', icon: 'male' },
      { id: 'no_pref', label: 'No strong preference', icon: 'user' },
    ],
  },
];
