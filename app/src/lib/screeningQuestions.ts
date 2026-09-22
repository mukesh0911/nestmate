/**
 * NestMate Screening Questionnaire Architecture
 * Supports 10 rich question types with dedicated consumer-grade UI widgets:
 * 1. YES_NO: Segmented choice cards with icon accents
 * 2. SINGLE_CHOICE: Radio cards with hover & active states
 * 3. MULTI_CHOICE: Interactive chips with checkbox states
 * 4. TIME: Time selector with quick bedtime presets
 * 5. DATE: Date selector with move-in presets
 * 6. TEXT: Styled textarea with live character counter
 * 7. NUMBER: Numeric input with stepper buttons (+/-) and unit label
 * 8. BUDGET: Currency input with ₹ formatting & quick budget sliders
 * 9. FREQUENCY: Structured frequency tier cards
 * 10. PREFERENCE_SCALE: 1-10 visual gradient scale with anchor labels
 */

export type QuestionType =
  | 'YES_NO'
  | 'SINGLE_CHOICE'
  | 'MULTI_CHOICE'
  | 'TIME'
  | 'DATE'
  | 'TEXT'
  | 'NUMBER'
  | 'BUDGET'
  | 'FREQUENCY'
  | 'PREFERENCE_SCALE';

export interface ScreeningQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  category?: 'lifestyle' | 'chores' | 'budget' | 'schedule' | 'general';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  required?: boolean;
  placeholder?: string;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
}

export interface ScreeningAnswer {
  questionId: string;
  questionTitle: string;
  type: QuestionType;
  value: any;
  answeredAt?: string;
}

/**
 * Standard Curated Screening Questions Library
 * Owners can select from these or seekers encounter them on listings.
 */
export const CURATED_SCREENING_QUESTIONS: ScreeningQuestion[] = [
  {
    id: 'sq_veg_only',
    type: 'YES_NO',
    category: 'lifestyle',
    title: 'Are you comfortable with vegetarian-only cooking in the flat?',
    description: 'The flat maintains a vegetarian kitchen. Non-veg takeaways are allowed if packed.',
    required: true,
  },
  {
    id: 'sq_work_mode',
    type: 'SINGLE_CHOICE',
    category: 'schedule',
    title: 'What is your current work setup?',
    description: 'Helps flatmates coordinate daytime bandwidth and quiet workspace hours.',
    options: [
      '100% Work from Office',
      'Hybrid (2–3 days WFH)',
      'Fully Remote / 100% WFH',
      'Flexible / Night Shift',
    ],
    required: true,
  },
  {
    id: 'sq_chore_split',
    type: 'MULTI_CHOICE',
    category: 'chores',
    title: 'Which shared responsibilities are you happy to take turns on?',
    description: 'Select all household responsibilities you are willing to manage or split with flatmates.',
    options: [
      'Kitchen & common area tidying',
      'Dishwasher / sink management',
      'Trash & garbage disposal',
      'Ordering groceries & household supplies',
      'Tracking & splitting utility bills',
    ],
    required: true,
  },
  {
    id: 'sq_bedtime',
    type: 'TIME',
    category: 'schedule',
    title: 'What time do you usually wind down / sleep?',
    description: 'Aligning quiet hours keeps household peace and mutual respect.',
    placeholder: '11:00 PM',
    required: true,
  },
  {
    id: 'sq_move_in_date',
    type: 'DATE',
    category: 'schedule',
    title: 'What is your target move-in date?',
    description: 'When are you ready to sign the agreement and occupy the room?',
    required: true,
  },
  {
    id: 'sq_max_budget',
    type: 'BUDGET',
    category: 'budget',
    title: 'What is your maximum monthly all-inclusive budget?',
    description: 'Rent + maintenance + recurring shared utility contributions.',
    min: 3000,
    max: 60000,
    step: 500,
    unit: '₹/month',
    required: true,
  },
  {
    id: 'sq_guest_policy',
    type: 'FREQUENCY',
    category: 'lifestyle',
    title: 'How often do you typically host friends or family?',
    description: 'Select the frequency that best mirrors your normal hosting habits.',
    options: [
      'Rarely or never',
      'Occasional weekends only (daytime)',
      'Once or twice a month (overnight with notice)',
      'Frequently (friends over multiple times a week)',
    ],
    required: true,
  },
  {
    id: 'sq_cleanliness_scale',
    type: 'PREFERENCE_SCALE',
    category: 'chores',
    title: 'How important is a clean, organized common area to you?',
    description: 'Rate on a scale of 1 to 10 how strictly you like spaces kept tidy.',
    min: 1,
    max: 10,
    scaleMinLabel: 'Relaxed & easygoing',
    scaleMaxLabel: 'Meticulous & spotless',
    required: true,
  },
  {
    id: 'sq_stay_duration',
    type: 'NUMBER',
    category: 'general',
    title: 'How many months minimum do you plan to rent this room?',
    description: 'Owners typically prefer longer term tenants (e.g. 6 to 11+ months).',
    min: 1,
    max: 36,
    step: 1,
    unit: 'months',
    required: true,
  },
  {
    id: 'sq_about_lifestyle',
    type: 'TEXT',
    category: 'general',
    title: 'Tell the owner and flatmates about your daily routine and vibe',
    description: 'A brief 2–3 sentence introduction helps your application stand out.',
    placeholder: 'E.g., I work as a frontend dev at an Indiranagar startup. I like keeping things quiet on weeknights, enjoy cooking simple meals, and spend weekends cycling...',
    min: 20,
    max: 400,
    required: false,
  },
];

/**
 * Validates a user response for a given question definition.
 */
export function validateScreeningAnswer(question: ScreeningQuestion, value: any): { valid: boolean; error?: string } {
  if (question.required) {
    if (value === undefined || value === null || value === '') {
      return { valid: false, error: 'This question requires an answer to proceed.' };
    }
    if (question.type === 'MULTI_CHOICE' && Array.isArray(value) && value.length === 0) {
      return { valid: false, error: 'Please select at least one option.' };
    }
  }

  switch (question.type) {
    case 'NUMBER':
    case 'BUDGET':
    case 'PREFERENCE_SCALE': {
      if (value !== undefined && value !== null && value !== '') {
        const num = Number(value);
        if (isNaN(num)) return { valid: false, error: 'Please enter a valid number.' };
        if (question.min !== undefined && num < question.min) {
          return { valid: false, error: `Value must be at least ${question.min}.` };
        }
        if (question.max !== undefined && num > question.max) {
          return { valid: false, error: `Value cannot exceed ${question.max}.` };
        }
      }
      break;
    }
    case 'TEXT': {
      if (value && typeof value === 'string') {
        if (question.min && value.trim().length < question.min) {
          return { valid: false, error: `Please write at least ${question.min} characters.` };
        }
        if (question.max && value.length > question.max) {
          return { valid: false, error: `Text cannot exceed ${question.max} characters.` };
        }
      }
      break;
    }
  }

  return { valid: true };
}
