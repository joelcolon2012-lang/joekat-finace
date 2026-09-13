// Exportador de movimientos a formato CSV para JOEKAT FINACE
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Transaction, Category, Account } from '../types';

interface CsvExportInput {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  householdName?: string;
}

export const exportTransactionsToCsv = async (input: CsvExportInput): Promise<string> => {
  const { transactions, categories, accounts } = input;

  const categoriesMap = categories.reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {} as Record<string, string>);

  const accountsMap = accounts.reduce((acc, a) => {
    acc[a.id] = a.name;
    return acc;
  }, {} as Record<string, string>);

  // Encabezados CSV (con BOM UTF-8 para compatibilidad con Excel)
  const headers = ['ID', 'Fecha', 'Tipo', 'Monto', 'Categoría', 'Registrado Por', 'Cuenta', 'Descripción', 'Método Pago'];

  const rows = transactions.map((t) => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.type === 'income' ? 'Ingreso' : t.type === 'expense' ? 'Gasto' : 'Transferencia'}"`,
    t.amount.toFixed(2),
    `"${categoriesMap[t.category_id || ''] || 'Otros'}"`,
    `"${t.user_name}"`,
    `"${accountsMap[t.account_id || ''] || 'General'}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${t.payment_method || 'General'}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const fileName = `JOEKAT_FINACE_Movimientos_${new Date().toISOString().slice(0, 10)}.csv`;

  // En entorno web / navegador móvil Safari
  if (Platform.OS === 'web' || typeof document !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return fileName;
  }

  // En entorno nativo (iOS / Android)
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar movimientos a Excel/CSV',
      UTI: 'public.comma-separated-values-text',
    });
  }

  return fileUri;
};

