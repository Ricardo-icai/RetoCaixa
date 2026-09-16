// Suggestions help entry; users can also declare a nationality not in this list.
const nationalities = [
  ['Española', 'España español'], ['Mexicana', 'México mexicano'], ['Argentina', 'argentino'],
  ['Colombiana', 'Colombia colombiano'], ['Venezolana', 'Venezuela venezolano'], ['Peruana', 'Perú peruano'],
  ['Chilena', 'Chile chileno'], ['Ecuatoriana', 'Ecuador ecuatoriano'], ['Boliviana', 'Bolivia boliviano'],
  ['Uruguaya', 'Uruguay uruguayo'], ['Paraguaya', 'Paraguay paraguayo'], ['Brasileña', 'Brasil brasileño'],
  ['Cubana', 'Cuba cubano'], ['Dominicana', 'República Dominicana dominicano'], ['Costarricense', 'Costa Rica'],
  ['Panameña', 'Panamá panameño'], ['Guatemalteca', 'Guatemala guatemalteco'], ['Hondureña', 'Honduras hondureño'],
  ['Salvadoreña', 'El Salvador salvadoreño'], ['Nicaragüense', 'Nicaragua'], ['Puertorriqueña', 'Puerto Rico puertorriqueño'],
  ['Estadounidense', 'Estados Unidos USA'], ['Canadiense', 'Canadá'], ['Portuguesa', 'Portugal portugués'],
  ['Francesa', 'Francia francés'], ['Italiana', 'Italia italiano'], ['Alemana', 'Alemania alemán'],
  ['Británica', 'Reino Unido británico'], ['Irlandesa', 'Irlanda irlandés'], ['Belga', 'Bélgica'],
  ['Neerlandesa', 'Países Bajos Holanda neerlandés'], ['Suiza', 'suizo'], ['Austríaca', 'Austria austríaco'],
  ['Rumana', 'Rumanía rumano'], ['Polaca', 'Polonia polaco'], ['Ucraniana', 'Ucrania ucraniano'],
  ['Rusa', 'Rusia ruso'], ['Búlgara', 'Bulgaria búlgaro'], ['Griega', 'Grecia griego'],
  ['Checa', 'Chequia checo'], ['Eslovaca', 'Eslovaquia eslovaco'], ['Húngara', 'Hungría húngaro'],
  ['Croata', 'Croacia'], ['Serbia', 'serbio'], ['Sueca', 'Suecia sueco'], ['Noruega', 'Noruego'],
  ['Danesa', 'Dinamarca danés'], ['Finlandesa', 'Finlandia finlandés'], ['Islandesa', 'Islandia islandés'],
  ['Andorrana', 'Andorra andorrano'], ['Marroquí', 'Marruecos'], ['Argelina', 'Argelia argelino'],
  ['Tunecina', 'Túnez tunecino'], ['Egipcia', 'Egipto egipcio'], ['Senegalesa', 'Senegal senegalés'],
  ['Nigeriana', 'Nigeria nigeriano'], ['Ghanesa', 'Ghana ghanés'], ['Ecuatoguineana', 'Guinea Ecuatorial ecuatoguineano'],
  ['Sudafricana', 'Sudáfrica sudafricano'], ['China', 'chino'], ['Japonesa', 'Japón japonés'],
  ['Surcoreana', 'Corea del Sur surcoreano'], ['India', 'indio'], ['Pakistaní', 'Pakistán'],
  ['Bangladesí', 'Bangladés Bangladesh'], ['Filipina', 'Filipinas filipino'], ['Vietnamita', 'Vietnam'],
  ['Tailandesa', 'Tailandia tailandés'], ['Indonesia', 'indonesio'], ['Turca', 'Turquía turco'],
  ['Siria', 'sirio'], ['Libanesa', 'Líbano libanés'], ['Palestina', 'palestino'], ['Israelí', 'Israel'],
  ['Iraní', 'Irán'], ['Iraquí', 'Irak'], ['Afgana', 'Afganistán afgano'],
  ['Australiana', 'Australia australiano'], ['Neozelandesa', 'Nueva Zelanda neozelandés'],
];
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function nationalitySuggestions(value: string): string[] {
  const parts = value.split(',');
  const query = normalize(parts.pop() ?? '');
  const previous = parts.map(part => part.trim()).filter(Boolean);
  if (!query) return [];
  return nationalities
    .filter(([label, aliases]) => normalize(`${label} ${aliases}`).includes(query) && !previous.some(part => normalize(part) === normalize(label)))
    .slice(0, 6)
    .map(([label]) => [...previous, label].join(', '));
}
