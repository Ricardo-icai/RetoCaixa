import { useState } from 'react';
import { nationalitySuggestions } from '../community/nationalities';

export function NationalityInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const suggestions = nationalitySuggestions(value);
  const expanded = open && suggestions.length > 0;
  function select(suggestion: string) { onChange(suggestion); setOpen(false); setActive(-1); }

  return <div className="relative text-xs text-slate-300">
    <label htmlFor="nationality">Nacionalidad</label>
    <input id="nationality" name="nationality" required minLength={2} maxLength={80} value={value}
      role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls="nationality-options"
      aria-activedescendant={expanded && active >= 0 ? `nationality-option-${active}` : undefined}
      autoComplete="off" onFocus={() => setOpen(true)} onBlur={() => { setOpen(false); setActive(-1); }}
      onChange={event => { onChange(event.target.value); setOpen(true); setActive(-1); }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); setOpen(false); setActive(-1); }
        if (event.key === 'ArrowDown' && suggestions.length) { event.preventDefault(); setOpen(true); setActive(index => (index + 1) % suggestions.length); }
        if (event.key === 'ArrowUp' && suggestions.length) { event.preventDefault(); setOpen(true); setActive(index => (index <= 0 ? suggestions.length : index) - 1); }
        if (event.key === 'Enter' && expanded && active >= 0) { event.preventDefault(); select(suggestions[active]); }
      }}
      placeholder="Empieza a escribir: espa…" aria-describedby="nationality-help"
      className="mt-2 w-full rounded-xl border border-white/15 bg-[#08111b] p-3 text-sm" />
    <ul id="nationality-options" role="listbox" aria-label="Nacionalidades sugeridas" hidden={!expanded} className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-white/15 bg-[#101d2a] p-1 shadow-xl">
      {suggestions.map((suggestion, index) => <li key={suggestion} id={`nationality-option-${index}`} role="option" aria-selected={active === index}
        onPointerDown={event => event.preventDefault()} onClick={() => select(suggestion)}
        className={`cursor-pointer rounded-lg px-3 py-3 text-sm hover:bg-emerald-300/10 ${active === index ? 'bg-emerald-300/15 text-emerald-200' : ''}`}>{suggestion}</li>)}
    </ul>
    <p id="nationality-help" className="mt-2 leading-5 text-slate-400">Elige una sugerencia o escribe la tuya. Si tienes varias, sepáralas con comas. Puede ser distinta de tu residencia y no se muestra en tu perfil público.</p>
  </div>;
}
