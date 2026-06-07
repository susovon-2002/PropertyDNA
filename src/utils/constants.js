export const CURRENT_YEAR = 2026;

export const materials = ['Brick', 'Wood', 'Concrete', 'Stone'];

export const countries = [
  { name: 'United States', currency: 'USD', symbol: '$', rate: 300 },
  { name: 'United Kingdom', currency: 'GBP', symbol: '£', rate: 220 },
  { name: 'Germany', currency: 'EUR', symbol: '€', rate: 280 },
  { name: 'Canada', currency: 'CAD', symbol: 'C$', rate: 320 },
  { name: 'Australia', currency: 'AUD', symbol: 'A$', rate: 350 },
  { name: 'Japan', currency: 'JPY', symbol: '¥', rate: 35000 },
  { name: 'India', currency: 'INR', symbol: '₹', rate: 6000 },
  { name: 'Brazil', currency: 'BRL', symbol: 'R$', rate: 1500 },
  { name: 'South Africa', currency: 'ZAR', symbol: 'R', rate: 2200 },
];

export const locations = countries.map((c) => c.name);
