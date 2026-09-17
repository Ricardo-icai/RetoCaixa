import { useEffect, useState } from 'react';
import { birthDateToISO } from '../community/birthDate';
import { demoToday } from '../legal/age';

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const fieldClass = 'mt-2 block w-full rounded-xl border border-white/15 bg-[#08111b] p-3 text-sm text-slate-100 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/30';

export function BirthDateInput({ value, onChange, minimal = false }: { value: string; onChange: (value: string) => void; minimal?: boolean }) {
  const inputClass = minimal ? 'mt-2 block w-full min-w-0 border-b border-slate-700 bg-slate-950 py-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none' : fieldClass;
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  useEffect(() => setCurrentYear(Number(demoToday().slice(0, 4))), []);
  const iso = birthDateToISO(value);
  const parts = iso ? iso.split('-').reverse() : value.split('/');
  function selectPart(index: number, next: string) {
    const updated = [parts[0] ?? '', parts[1] ?? '', parts[2] ?? ''];
    updated[index] = next;
    onChange(updated.join('/'));
  }
  const years = currentYear ? Array.from({ length: 121 }, (_, index) => String(currentYear - index)) : [];
  if (/^\d{4}$/.test(parts[2] ?? '') && !years.includes(parts[2])) years.push(parts[2]);

  return <fieldset className="space-y-2">
    <legend className="text-sm font-medium text-slate-200">Fecha de nacimiento</legend>
      <div className="grid grid-cols-[1fr_1.5fr_1.2fr] gap-2 text-xs text-slate-300">
        <label>Día<select required name="birthDay" autoComplete="bday-day" aria-describedby="birth-date-help" aria-label="Día de nacimiento" value={parts[0] ?? ''} onChange={event => selectPart(0, event.target.value)} className={inputClass}>
          <option value="">Día</option>{Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(day => <option key={day} value={day}>{day}</option>)}
        </select></label>
        <label>Mes<select required name="birthMonth" autoComplete="bday-month" aria-describedby="birth-date-help" aria-label="Mes de nacimiento" value={parts[1] ?? ''} onChange={event => selectPart(1, event.target.value)} className={inputClass}>
          <option value="">Mes</option>{months.map((month, index) => <option key={month} value={String(index + 1).padStart(2, '0')}>{month}</option>)}
        </select></label>
        <label>Año<select required name="birthYear" autoComplete="bday-year" aria-describedby="birth-date-help" aria-label="Año de nacimiento" value={parts[2] ?? ''} onChange={event => selectPart(2, event.target.value)} className={inputClass}>
          <option value="">Año</option>{years.map(year => <option key={year} value={year}>{year}</option>)}
        </select></label>
      </div>
    <p id="birth-date-help" className="text-xs leading-5 text-slate-400">Usamos tu fecha para comprobar la edad mínima de esta demo. No se muestra en tu perfil ni se conserva la fecha completa.</p>
  </fieldset>;
}
