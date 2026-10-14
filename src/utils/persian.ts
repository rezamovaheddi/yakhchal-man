/**
 * Convert numbers or digit strings to Persian numerals
 */
export const toPersianDigits = (num: number | string): string => {
  if (num === null || num === undefined) return '';
  const str = num.toString();
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (digit) => persianDigits[parseInt(digit, 10)]);
};

/**
 * Format quantity and unit string e.g. "۴ عدد"
 */
export const formatQuantity = (quantity: number, unit: string): string => {
  return `${toPersianDigits(quantity)} ${unit}`;
};
