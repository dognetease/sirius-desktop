const LetterArray = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

export function numberToExcelColumn(num: number): string {
  if (num < 27) return LetterArray[num];
  const base = 26;
  const mod = num % base;
  const n = Math.floor(num / base);
  if (mod === 0) {
    return numberToExcelColumn(n - 1) + LetterArray[mod];
  }
  if (n === 0) {
    return LetterArray[mod];
  }
  return numberToExcelColumn(n) + LetterArray[mod];
}
