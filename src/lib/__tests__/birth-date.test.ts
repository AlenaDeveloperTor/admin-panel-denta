import { describe, it, expect } from 'vitest';
import {
  parseBirthYear,
  calculateAge,
  pluralizeYears,
  formatBirthInfo,
} from '../birth-date';

describe('Утилиты расчета возраста и дат рождения (birth-date)', () => {
  describe('parseBirthYear', () => {
    it('корректно извлекает год из формата ISO (YYYY-MM-DD)', () => {
      expect(parseBirthYear('1995-05-20')).toBe(1995);
      expect(parseBirthYear('2005/12/31')).toBe(2005);
    });

    it('корректно извлекает год из формата РФ (DD.MM.YYYY)', () => {
      expect(parseBirthYear('15.08.1988')).toBe(1988);
      expect(parseBirthYear('01/01/2000')).toBe(2000);
    });

    it('принимает просто 4 цифры года', () => {
      expect(parseBirthYear('1990')).toBe(1990);
    });

    it('возвращает null при пустых или некорректных данных', () => {
      expect(parseBirthYear('')).toBeNull();
      expect(parseBirthYear(null)).toBeNull();
      expect(parseBirthYear(undefined)).toBeNull();
      expect(parseBirthYear('abc')).toBeNull();
      expect(parseBirthYear('1800-01-01')).toBeNull(); // Раньше 1900 года
    });
  });

  describe('calculateAge', () => {
    it('рассчитывает возраст для переданного года', () => {
      const currentYear = new Date().getFullYear();
      expect(calculateAge(2000)).toBe(currentYear - 2000);
      expect(calculateAge('2000-01-01')).toBe(currentYear - 2000);
    });

    it('возвращает null при невалидных входных данных', () => {
      expect(calculateAge(null)).toBeNull();
      expect(calculateAge(undefined)).toBeNull();
      expect(calculateAge('не дата')).toBeNull();
    });
  });

  describe('pluralizeYears', () => {
    it('правильно склоняет окончания в русском языке', () => {
      expect(pluralizeYears(1)).toBe('1 год');
      expect(pluralizeYears(21)).toBe('21 год');
      expect(pluralizeYears(2)).toBe('2 года');
      expect(pluralizeYears(4)).toBe('4 года');
      expect(pluralizeYears(5)).toBe('5 лет');
      expect(pluralizeYears(11)).toBe('11 лет');
      expect(pluralizeYears(14)).toBe('14 лет');
      expect(pluralizeYears(25)).toBe('25 лет');
    });
  });

  describe('formatBirthInfo', () => {
    it('возвращает плейсхолдер для пустой даты', () => {
      expect(formatBirthInfo(null)).toBe('Дата не указана');
      expect(formatBirthInfo('')).toBe('Дата не указана');
    });

    it('форматирует бейдж с годом и возрастом', () => {
      const currentYear = new Date().getFullYear();
      const expectedAge = currentYear - 1995;
      expect(formatBirthInfo('1995-05-10')).toBe(`1995 г.р. (${pluralizeYears(expectedAge)})`);
    });
  });
});
