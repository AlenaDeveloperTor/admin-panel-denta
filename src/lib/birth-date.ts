/**
 * Утилиты для работы с датами рождения, годами и возрастом пациентов.
 */

export function parseBirthYear(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const trimmed = birthDate.trim();
  if (!trimmed) return null;

  // Формат YYYY-MM-DD или YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.]\d{1,2}[-/.]\d{1,2}/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    if (isValidYear(y)) return y;
  }

  // Формат DD.MM.YYYY
  const ruMatch = trimmed.match(/^\d{1,2}[./-]\d{1,2}[./-](\d{4})/);
  if (ruMatch) {
    const y = parseInt(ruMatch[1], 10);
    if (isValidYear(y)) return y;
  }

  // Просто 4 цифры года
  const yearOnlyMatch = trimmed.match(/^(\d{4})$/);
  if (yearOnlyMatch) {
    const y = parseInt(yearOnlyMatch[1], 10);
    if (isValidYear(y)) return y;
  }

  // Попытка стандартного парсинга даты
  const timestamp = Date.parse(trimmed);
  if (!isNaN(timestamp)) {
    const y = new Date(timestamp).getFullYear();
    if (isValidYear(y)) return y;
  }

  return null;
}

function isValidYear(year: number): boolean {
  const current = new Date().getFullYear();
  return year >= 1900 && year <= current;
}

/** Расчёт возраста в годах по дате рождения или году */
export function calculateAge(birthDateOrYear: string | number | null | undefined): number | null {
  if (birthDateOrYear == null) return null;
  const currentYear = new Date().getFullYear();

  if (typeof birthDateOrYear === 'number') {
    if (!isValidYear(birthDateOrYear)) return null;
    return Math.max(0, currentYear - birthDateOrYear);
  }

  const year = parseBirthYear(birthDateOrYear);
  if (!year) return null;
  return Math.max(0, currentYear - year);
}

/** Склонение слова "год" / "года" / "лет" */
export function pluralizeYears(n: number): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 19) return `${n} лет`;
  if (mod10 === 1) return `${n} год`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} года`;
  return `${n} лет`;
}

/** Форматирование даты рождения и возраста для бейджа */
export function formatBirthInfo(birthDate?: string | null): string {
  if (!birthDate) return 'Дата не указана';
  const year = parseBirthYear(birthDate);
  if (!year) return birthDate;
  const age = calculateAge(year);
  return `${year} г.р.${age != null ? ` (${pluralizeYears(age)})` : ''}`;
}

export interface YearPreset {
  id: string;
  label: string;
  icon: string;
  ageFrom: number;
  ageTo: number;
  description: string;
}

/** Готовые пресеты для стоматологических рассылок */
export function getDentalAgePresets(): YearPreset[] {
  return [
    {
      id: 'ortho',
      label: 'Ортодонтия (12–30 лет)',
      icon: '🦷',
      ageFrom: 12,
      ageTo: 30,
      description: 'Брекеты, элайнеры, исправление прикуса',
    },
    {
      id: 'kids',
      label: 'Дети и подростки (0–17 лет)',
      icon: '👶',
      ageFrom: 0,
      ageTo: 17,
      description: 'Детская стоматология, профилактика кариеса',
    },
    {
      id: 'young',
      label: 'Молодёжь (18–35 лет)',
      icon: '🧑',
      ageFrom: 18,
      ageTo: 35,
      description: 'Отбеливание, профгигиена, эстетика',
    },
    {
      id: 'adults',
      label: 'Взрослые (36–55 лет)',
      icon: '💼',
      ageFrom: 36,
      ageTo: 55,
      description: 'Терапия, имплантация, коронки',
    },
    {
      id: 'seniors',
      label: 'Старший возраст (55+ лет)',
      icon: '🧓',
      ageFrom: 55,
      ageTo: 100,
      description: 'Протезирование, комплексное восстановление',
    },
  ];
}
