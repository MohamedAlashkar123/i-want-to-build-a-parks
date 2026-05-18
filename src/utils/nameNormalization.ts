function compactSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function stripPunctuation(value: string): string {
  return value
    .replace(/[-_/\\|()[\]{}.,،؛:;'"`~!?؟@#$%^&*+=<>]/g, ' ')
    .replace(/\s+/g, ' ');
}

function removeCommonWords(value: string, words: string[]): string {
  const pattern = new RegExp(`\\b(${words.join('|')})\\b`, 'giu');
  return compactSpaces(value.replace(pattern, ' '));
}

export function normalizeArabicName(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه');

  return removeCommonWords(compactSpaces(stripPunctuation(normalized)), ['حديقه', 'منتزه', 'park', 'garden']);
}

export function normalizeEnglishName(value: string): string {
  const normalized = stripPunctuation(value.toLowerCase());
  return removeCommonWords(compactSpaces(normalized), ['park', 'garden', 'public']);
}

export function normalizeParkName(value: string): string {
  const hasArabic = /[\u0600-\u06FF]/.test(value);
  return hasArabic ? normalizeArabicName(value) : normalizeEnglishName(value);
}

export function namesLikelyMatch(a: string, b: string): boolean {
  const first = normalizeParkName(a);
  const second = normalizeParkName(b);

  if (!first || !second) {
    return false;
  }

  if (first === second) {
    return true;
  }

  return first.length >= 4 && second.length >= 4 && (first.includes(second) || second.includes(first));
}

/*
Example checks:
normalizeArabicName('حديقة الجاهلي') === 'الجاهلي'
normalizeArabicName('منتزه الشيخة سلامة بنت بطي') === 'الشيخه سلامه بنت بطي'
normalizeEnglishName('Al-Jahili Public Park') === 'al jahili'
namesLikelyMatch('حديقة الطوية', 'الطوية') === true
namesLikelyMatch('Corniche Beach Park', 'Corniche Beach') === true
*/
