import { describe, expect, it } from 'vitest';

export const validateIndianPhone = (num: string): boolean => /^[6-9]\d{9}$/.test(num);
export const formatE164IndianPhone = (num: string): string => `+91${num.replace(/\D/g, '')}`;
export const validateOTPCode = (code: string): boolean => /^\d{6}$/.test(code);
export const isWhitelistedTestPhone = (phone: string): boolean => {
  const clean = phone.replace(/[\s-]/g, '');
  return ['+916505553434', '+916505553435', '+916505553436', '+919999900001', '+919999900002'].includes(clean);
};

describe('Phone Authentication & OTP Verification Suite', () => {
  describe('Indian Mobile Number Validation', () => {
    it('accepts valid 10-digit Indian numbers starting with 6, 7, 8, or 9', () => {
      expect(validateIndianPhone('9840123456')).toBe(true);
      expect(validateIndianPhone('8765432109')).toBe(true);
      expect(validateIndianPhone('7654321098')).toBe(true);
      expect(validateIndianPhone('6543210987')).toBe(true);
    });

    it('rejects numbers starting with invalid digits (0-5)', () => {
      expect(validateIndianPhone('5555555555')).toBe(false);
      expect(validateIndianPhone('1234567890')).toBe(false);
      expect(validateIndianPhone('0984012345')).toBe(false);
      expect(validateIndianPhone('4840123456')).toBe(false);
    });

    it('rejects numbers with invalid lengths or non-numeric characters', () => {
      expect(validateIndianPhone('98401')).toBe(false);
      expect(validateIndianPhone('98401234567')).toBe(false);
      expect(validateIndianPhone('984012345a')).toBe(false);
      expect(validateIndianPhone('')).toBe(false);
      expect(validateIndianPhone(' 9840123456 ')).toBe(false);
    });
  });

  describe('E.164 Phone Formatting', () => {
    it('formats 10-digit local number into standard E.164 format', () => {
      expect(formatE164IndianPhone('9840123456')).toBe('+919840123456');
      expect(formatE164IndianPhone('98401-23456')).toBe('+919840123456');
    });
  });

  describe('OTP Code Format Validation', () => {
    it('validates 6-digit numeric OTP codes', () => {
      expect(validateOTPCode('123456')).toBe(true);
      expect(validateOTPCode('000000')).toBe(true);
      expect(validateOTPCode('987654')).toBe(true);
    });

    it('rejects incomplete, alphanumeric, or oversized OTP codes', () => {
      expect(validateOTPCode('12345')).toBe(false);
      expect(validateOTPCode('1234567')).toBe(false);
      expect(validateOTPCode('12345a')).toBe(false);
      expect(validateOTPCode('')).toBe(false);
      expect(validateOTPCode('abcdef')).toBe(false);
    });
  });

  describe('Whitelisted Test Phone Detection', () => {
    it('recognizes test developer phone numbers for zero-quota testing', () => {
      expect(isWhitelistedTestPhone('+91 650 555 3434')).toBe(true);
      expect(isWhitelistedTestPhone('+91 99999 00001')).toBe(true);
      expect(isWhitelistedTestPhone('+91 99999 00002')).toBe(true);
      expect(isWhitelistedTestPhone('+919840123456')).toBe(false);
    });
  });
});
