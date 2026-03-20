const knownValues = {
  jurisdiction: ['England & Wales', 'New York', 'Hong Kong', 'Singapore', 'Delaware'],
  'practice area': ['M&A', 'Banking & Finance', 'Capital Markets', 'Litigation', 'Real Estate'],
  'document type': ['Share Purchase Agreement', 'Loan Agreement', 'NDA', 'Board Resolution', 'Side Letter'],
  'matter type': ['Acquisition', 'Disposal', 'Refinancing', 'IPO', 'Joint Venture'],
  client: ['Acme Corp', 'Globex Industries', 'Initech', 'Umbrella Corp', 'Stark Industries'],
  sector: ['Technology', 'Financial Services', 'Healthcare', 'Energy', 'Consumer Goods'],
  'governing law': ['English Law', 'New York Law', 'Hong Kong Law', 'Singapore Law', 'Delaware Law'],
  year: ['2024', '2023', '2022', '2021', '2020'],
  partner: ['J. Smith', 'A. Johnson', 'R. Williams', 'M. Brown', 'S. Davis'],
  office: ['London', 'New York', 'Hong Kong', 'Singapore', 'Tokyo'],
};

export function getFilterValues(filter) {
  if (filter.values && filter.values.length > 0) return filter.values;
  const key = filter.name.toLowerCase();
  if (knownValues[key]) return knownValues[key];
  return Array.from({ length: 5 }, (_, i) => `${filter.name} ${i + 1}`);
}

// Seeded shuffle to get random-looking but stable permutations per row
function shuffle(array, seed) {
  const a = [...array];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateDummyRows(filters, count = 5) {
  return Array.from({ length: count }, (_, rowIndex) => {
    const row = {};
    filters.forEach((f, fIndex) => {
      if (f.fieldType === 'boolean') {
        const seed = rowIndex * 100 + fIndex * 7 + 1;
        row[f.name] = seed % 2 === 0 ? 'Yes' : 'No';
      } else {
        const values = getFilterValues(f);
        const shuffled = shuffle(values, rowIndex * 100 + fIndex * 7 + 1);
        row[f.name] = shuffled[rowIndex % shuffled.length];
      }
    });
    return row;
  });
}
