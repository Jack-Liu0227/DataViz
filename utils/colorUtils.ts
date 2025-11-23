export const CHART_COLORS = [
  '#2563eb', // Blue-600
  '#dc2626', // Red-600
  '#16a34a', // Green-600
  '#d97706', // Amber-600
  '#9333ea', // Purple-600
  '#0891b2', // Cyan-600
  '#db2777', // Pink-600
  '#4f46e5', // Indigo-600
  '#ca8a04', // Yellow-600
  '#059669', // Emerald-600
];

export const getNextColor = (usedColors: string[]): string => {
  const available = CHART_COLORS.filter(c => !usedColors.includes(c));
  if (available.length > 0) return available[0];
  return `#${Math.floor(Math.random()*16777215).toString(16)}`; // Fallback random
};
