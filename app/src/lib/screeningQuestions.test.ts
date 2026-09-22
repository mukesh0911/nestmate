import { describe, it, expect } from 'vitest';
import {
  CURATED_SCREENING_QUESTIONS,
  validateScreeningAnswer,
  type ScreeningQuestion,
} from './screeningQuestions';

describe('Screening Questions Engine & Validation Suite', () => {
  it('contains curated questions covering all 10 distinct question types', () => {
    const types = new Set(CURATED_SCREENING_QUESTIONS.map(q => q.type));
    expect(types.has('YES_NO')).toBe(true);
    expect(types.has('SINGLE_CHOICE')).toBe(true);
    expect(types.has('MULTI_CHOICE')).toBe(true);
    expect(types.has('TIME')).toBe(true);
    expect(types.has('DATE')).toBe(true);
    expect(types.has('TEXT')).toBe(true);
    expect(types.has('NUMBER')).toBe(true);
    expect(types.has('BUDGET')).toBe(true);
    expect(types.has('FREQUENCY')).toBe(true);
    expect(types.has('PREFERENCE_SCALE')).toBe(true);
    expect(types.size).toBe(10);
  });

  describe('YES_NO questions', () => {
    const q: ScreeningQuestion = {
      id: 'test_yes_no',
      type: 'YES_NO',
      title: 'Vegetarian only?',
      required: true,
    };

    it('accepts true or false', () => {
      expect(validateScreeningAnswer(q, true).valid).toBe(true);
      expect(validateScreeningAnswer(q, false).valid).toBe(true);
    });

    it('rejects undefined or null when required', () => {
      expect(validateScreeningAnswer(q, undefined).valid).toBe(false);
      expect(validateScreeningAnswer(q, null).valid).toBe(false);
    });
  });

  describe('MULTI_CHOICE questions', () => {
    const q: ScreeningQuestion = {
      id: 'test_multi',
      type: 'MULTI_CHOICE',
      title: 'Select chores',
      options: ['Dishes', 'Trash', 'Cleaning'],
      required: true,
    };

    it('accepts array with at least one item', () => {
      expect(validateScreeningAnswer(q, ['Dishes']).valid).toBe(true);
      expect(validateScreeningAnswer(q, ['Dishes', 'Trash']).valid).toBe(true);
    });

    it('rejects empty array when required', () => {
      const res = validateScreeningAnswer(q, []);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/at least one option/i);
    });
  });

  describe('NUMBER & BUDGET questions', () => {
    const budgetQ: ScreeningQuestion = {
      id: 'test_budget',
      type: 'BUDGET',
      title: 'Max budget',
      min: 5000,
      max: 50000,
      required: true,
    };

    it('accepts numbers within min and max', () => {
      expect(validateScreeningAnswer(budgetQ, 15000).valid).toBe(true);
      expect(validateScreeningAnswer(budgetQ, 5000).valid).toBe(true);
      expect(validateScreeningAnswer(budgetQ, 50000).valid).toBe(true);
    });

    it('rejects numbers below min or above max', () => {
      expect(validateScreeningAnswer(budgetQ, 2000).valid).toBe(false);
      expect(validateScreeningAnswer(budgetQ, 75000).valid).toBe(false);
    });

    it('rejects NaN inputs', () => {
      expect(validateScreeningAnswer(budgetQ, 'abc').valid).toBe(false);
    });
  });

  describe('PREFERENCE_SCALE questions', () => {
    const scaleQ: ScreeningQuestion = {
      id: 'test_scale',
      type: 'PREFERENCE_SCALE',
      title: 'Quiet hours importance',
      min: 1,
      max: 10,
      required: true,
    };

    it('accepts ratings 1 through 10', () => {
      for (let i = 1; i <= 10; i++) {
        expect(validateScreeningAnswer(scaleQ, i).valid).toBe(true);
      }
    });

    it('rejects out-of-range scale ratings', () => {
      expect(validateScreeningAnswer(scaleQ, 0).valid).toBe(false);
      expect(validateScreeningAnswer(scaleQ, 11).valid).toBe(false);
    });
  });

  describe('TEXT questions', () => {
    const textQ: ScreeningQuestion = {
      id: 'test_text',
      type: 'TEXT',
      title: 'About you',
      min: 10,
      max: 100,
      required: true,
    };

    it('accepts valid length text', () => {
      expect(validateScreeningAnswer(textQ, 'I am a software engineer looking for quiet flat.').valid).toBe(true);
    });

    it('rejects text shorter than min characters', () => {
      expect(validateScreeningAnswer(textQ, 'Hi').valid).toBe(false);
    });

    it('rejects text exceeding max characters', () => {
      const longText = 'A'.repeat(150);
      expect(validateScreeningAnswer(textQ, longText).valid).toBe(false);
    });
  });
});
