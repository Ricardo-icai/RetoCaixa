// Accept a Spanish civil date, including eight digits pasted from a numeric keyboard.
export function birthDateToISO(value: string): string {
  const match = value.trim().match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/)
    ?? value.trim().match(/^(\d{2})(\d{2})(\d{4})$/);
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : '';
}
