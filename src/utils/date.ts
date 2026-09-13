// Utilidades de fechas y saludos familiares para JOEKAT FINACE

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const formatMonthYear = (dateInput?: Date | string): string => {
  const date = dateInput ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) : new Date();
  const month = MONTH_NAMES_ES[date.getMonth()].toUpperCase();
  const year = date.getFullYear();
  return `${month} ${year}`;
};

export const formatDateSpanish = (dateString: string): string => {
  if (!dateString) return '';
  // dateString puede ser YYYY-MM-DD
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${day} ${MONTH_NAMES_ES[monthIndex].toLowerCase()} ${year}`;
  }
  const date = new Date(dateString);
  return `${date.getDate()} ${MONTH_NAMES_ES[date.getMonth()].toLowerCase()} ${date.getFullYear()}`;
};

export const getGreeting = (name: string): string => {
  const hour = new Date().getHours();
  const safeName = name || 'Joel';
  if (hour >= 5 && hour < 12) {
    return `Buenos días, ${safeName}`;
  } else if (hour >= 12 && hour < 19) {
    return `Buenas tardes, ${safeName}`;
  } else {
    return `Buenas noches, ${safeName}`;
  }
};

export const getTodayDateString = (): string => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const isToday = (dateString: string): boolean => {
  return dateString === getTodayDateString();
};

export const isYesterday = (dateString: string): boolean => {
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const y = yest.getFullYear();
  const m = String(yest.getMonth() + 1).padStart(2, '0');
  const d = String(yest.getDate()).padStart(2, '0');
  return dateString === `${y}-${m}-${d}`;
};

export const getDateHeaderLabel = (dateString: string): string => {
  if (isToday(dateString)) return 'Hoy';
  if (isYesterday(dateString)) return 'Ayer';
  return formatDateSpanish(dateString);
};
