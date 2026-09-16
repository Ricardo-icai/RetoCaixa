// Demo access policy, not a universal legal age for investing.
export const minimumDemoAge = 18;

// Use the same civil date on client and server, independent of browser/server timezone.
export function demoToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

export function birthDateError(value: unknown, today = demoToday()): string | null {
  if (!validDate(value) || !validDate(today)) return 'Selecciona una fecha de nacimiento válida.';
  if (value > today) return 'La fecha de nacimiento no puede estar en el futuro.';
  const [year, month, day] = value.split('-').map(Number);
  const [currentYear, currentMonth, currentDay] = today.split('-').map(Number);
  // For a 29 February birth, use 1 March in non-leap years for this demo policy.
  const birthdayPending = currentMonth < month || (currentMonth === month && currentDay < day);
  const age = currentYear - year - (birthdayPending ? 1 : 0);
  return age < minimumDemoAge ? 'Esta demo admite personas de 18 años cumplidos o más. Las cuentas tuteladas para menores todavía no están disponibles.' : null;
}
