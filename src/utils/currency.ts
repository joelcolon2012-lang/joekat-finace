// Formateo y utilidades de moneda para JOEKAT FINACE (DOP por defecto: RD$)

export const formatCurrency = (
  amount: number | undefined | null,
  currencyCode = 'DOP',
  showSign = false
): string => {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const absFormatted = Math.abs(safeAmount).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const prefix = currencyCode === 'DOP' ? 'RD$' : currencyCode;

  if (showSign && safeAmount > 0) {
    return `+${prefix} ${absFormatted}`;
  } else if (showSign && safeAmount < 0) {
    return `-${prefix} ${absFormatted}`;
  }

  return `${prefix} ${absFormatted}`;
};

export const roundCurrency = (amount: number): number => {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

export const parseAmount = (input: string): number => {
  if (!input) return 0;
  let cleaned = input.trim();
  
  // Si contiene tanto coma como punto, determinar cuál es el separador de miles
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    const commaIndex = cleaned.lastIndexOf(',');
    const dotIndex = cleaned.lastIndexOf('.');
    if (dotIndex > commaIndex) {
      // Formato 1,500.50 (coma miles, punto decimal)
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // Formato 1.500,50 (punto miles, coma decimal)
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
  } else if (hasComma) {
    // Si la coma separa grupos exactos de 3 dígitos (ej: 2,345 o 1,000,000), es separador de miles
    if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      cleaned = cleaned.replace(',', '.');
    }
  }

  // Quitar cualquier carácter residual excepto números y punto
  cleaned = cleaned.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) || parsed < 0 ? 0 : roundCurrency(parsed);
};

