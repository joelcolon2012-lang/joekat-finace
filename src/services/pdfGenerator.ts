// Generador y descargador de reportes PDF para JOEKAT FINACE
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Budget, Category, SavingGoal } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatMonthYear, formatDateSpanish } from '../utils/date';
import { calculateMonthlyTotals } from '../utils/calculations';

export interface GenerateReportInput {
  month: number; // 1-12
  year: number;
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  savingGoals?: SavingGoal[];
  currency: string;
}

export const generateMonthlyReportHtml = (input: GenerateReportInput): string => {
  const { month, year, transactions, budgets, categories, savingGoals = [], currency } = input;
  const totals = calculateMonthlyTotals(transactions, month, year);

  const categoriesMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {} as Record<string, Category>);

  // Filtrar transacciones del mes
  const monthTransactions = transactions.filter((t) => {
    if (!t.date) return false;
    const parts = t.date.split('-');
    return parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month;
  });

  // Filas de transacciones HTML
  const transactionRowsHtml = monthTransactions
    .slice(0, 50) // Primeras 50 transacciones en PDF
    .map(
      (t) => `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 10px 8px; font-size: 12px; color: #49769F;">${formatDateSpanish(t.date)}</td>
        <td style="padding: 10px 8px; font-size: 12px; font-weight: 600; color: #001D39;">
          ${t.description || categoriesMap[t.category_id || '']?.name || 'Movimiento'}
          <span style="display: block; font-size: 10px; color: #6EA2B3; font-weight: 400;">Registrado por ${t.user_name}</span>
        </td>
        <td style="padding: 10px 8px; font-size: 12px; color: #4E8EA2;">${categoriesMap[t.category_id || '']?.name || 'Otros'}</td>
        <td style="padding: 10px 8px; font-size: 12px; text-align: right; font-weight: 700; color: ${
          t.type === 'income' ? '#10B981' : '#001D39'
        };">
          ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount, currency)}
        </td>
      </tr>
    `
    )
    .join('');

  // Filas de presupuestos HTML
  const budgetRowsHtml = budgets
    .map((b) => {
      const cat = categoriesMap[b.category_id];
      const spent = monthTransactions
        .filter((t) => t.type === 'expense' && t.category_id === b.category_id)
        .reduce((sum, t) => sum + t.amount, 0);
      const percent = b.allocated_amount > 0 ? Math.round((spent / b.allocated_amount) * 100) : 0;
      const isOver = spent > b.allocated_amount;

      return `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
            <span style="font-weight: 600; color: #001D39;">${cat?.name || 'Categoría'}</span>
            <span style="color: ${isOver ? '#EF4444' : '#0A4174'}; font-weight: 700;">
              ${formatCurrency(spent, currency)} / ${formatCurrency(b.allocated_amount, currency)} (${percent}%)
            </span>
          </div>
          <div style="background: #E2E8F0; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: ${isOver ? '#EF4444' : '#0A4174'}; width: ${Math.min(100, percent)}%; height: 100%;"></div>
          </div>
        </div>
      `;
    })
    .join('');

  // Filas de metas de ahorro HTML ordenadas por prioridad
  const sortedGoals = [...savingGoals].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  const savingGoalsRowsHtml = sortedGoals
    .map((g, idx) => {
      const priorityNum = g.priority ?? (idx + 1);
      const progressPercent = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;
      const priorityLabel = priorityNum === 1 ? 'Prioridad #1' : `Prioridad #${priorityNum}`;

      return `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 8px; font-size: 12px; font-weight: 700; color: #0A4174;">
            <span style="background: #EBF3FA; color: #0A4174; padding: 3px 8px; border-radius: 6px; font-size: 11px;">
              ${priorityLabel}
            </span>
          </td>
          <td style="padding: 10px 8px; font-size: 12px; font-weight: 600; color: #001D39;">
            ${g.name}
            ${g.is_completed ? '<span style="color: #10B981; font-weight: 700; margin-left: 6px;">(Completada)</span>' : ''}
          </td>
          <td style="padding: 10px 8px; font-size: 12px; text-align: right; font-weight: 700; color: #0A4174;">
            ${formatCurrency(g.current_amount, currency)} / ${formatCurrency(g.target_amount, currency)} (${progressPercent}%)
          </td>
        </tr>
      `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>JOEKAT FINACE - Reporte Financiero</title>
        <style>
          @page { size: A4; margin: 24mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #001D39;
            margin: 0;
            padding: 0;
            background-color: #FFFFFF;
          }
          .header {
            border-bottom: 2px solid #001D39;
            padding-bottom: 20px;
            margin-bottom: 28px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .brand-title {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #001D39;
            margin: 0;
          }
          .brand-subtitle {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #49769F;
            margin-top: 4px;
          }
          .period-badge {
            text-align: right;
          }
          .period-title {
            font-size: 18px;
            font-weight: 700;
            color: #0A4174;
            margin: 0;
          }
          .period-sub {
            font-size: 11px;
            color: #6EA2B3;
          }
          .cards-grid {
            display: flex;
            gap: 14px;
            margin-bottom: 28px;
          }
          .summary-card {
            flex: 1;
            padding: 16px;
            background: #F0F6FA;
            border-radius: 12px;
            border-left: 4px solid #0A4174;
          }
          .card-label {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 1px;
            color: #49769F;
            margin-bottom: 6px;
          }
          .card-value {
            font-size: 20px;
            font-weight: 800;
            color: #001D39;
          }
          .table-container {
            margin-top: 24px;
          }
          .table-title {
            font-size: 15px;
            font-weight: 700;
            color: #001D39;
            margin-bottom: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background-color: #001D39;
            color: #FFFFFF;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 8px;
            text-align: left;
          }
          .footer {
            margin-top: 40px;
            padding-top: 14px;
            border-top: 1px solid #E2E8F0;
            font-size: 10px;
            color: #6EA2B3;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">joekat finace</h1>
            <div class="brand-subtitle">Together for a brighter tomorrow</div>
          </div>
          <div class="period-badge">
            <h2 class="period-title">${formatMonthYear(new Date(year, month - 1, 1))}</h2>
            <div class="period-sub">Reporte Familiar Confidencial</div>
          </div>
        </div>

        <div class="cards-grid">
          <div class="summary-card" style="border-left-color: #10B981;">
            <div class="card-label">Ingresos Totales</div>
            <div class="card-value" style="color: #10B981;">${formatCurrency(totals.totalIncome, currency)}</div>
          </div>
          <div class="summary-card" style="border-left-color: #EF4444;">
            <div class="card-label">Gastos Totales</div>
            <div class="card-value" style="color: #001D39;">${formatCurrency(totals.totalExpenses, currency)}</div>
          </div>
          <div class="summary-card" style="border-left-color: #0A4174;">
            <div class="card-label">Balance Neto</div>
            <div class="card-value" style="color: #0A4174;">${formatCurrency(totals.netBalance, currency)}</div>
          </div>
          <div class="summary-card" style="border-left-color: #7BBDE8;">
            <div class="card-label">Tasa de Ahorro</div>
            <div class="card-value" style="color: #49769F;">${totals.savingsRate}%</div>
          </div>
        </div>

        ${
          savingGoals.length > 0
            ? `
          <div class="table-container" style="margin-bottom: 24px;">
            <div class="table-title">Metas de Ahorro y Prioridades Familiares</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 25%;">Prioridad</th>
                  <th style="width: 45%;">Meta</th>
                  <th style="width: 30%; text-align: right;">Ahorro Acumulado</th>
                </tr>
              </thead>
              <tbody>
                ${savingGoalsRowsHtml}
              </tbody>
            </table>
          </div>
        `
            : ''
        }

        ${
          budgets.length > 0
            ? `
          <div class="table-container" style="background: #F8FAFC; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
            <div class="table-title">Estado de Presupuestos del Mes</div>
            ${budgetRowsHtml}
          </div>
        `
            : ''
        }

        <div class="table-container">
          <div class="table-title">Registro Cronológico de Movimientos</div>
          <table>
            <thead>
              <tr>
                <th style="width: 22%;">Fecha</th>
                <th style="width: 42%;">Concepto y Autor</th>
                <th style="width: 20%;">Categoría</th>
                <th style="width: 16%; text-align: right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${transactionRowsHtml || '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #6EA2B3;">No se registraron movimientos en este periodo.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 48px; margin-bottom: 24px; display: flex; justify-content: space-around; padding-top: 16px;">
          <div style="text-align: center; width: 200px; border-top: 1.5px solid #001D39; padding-top: 8px;">
            <div style="font-size: 13px; font-weight: 700; color: #001D39;">Joel</div>
            <div style="font-size: 10px; color: #6EA2B3; text-transform: uppercase; letter-spacing: 0.5px;">Firma de Conformidad</div>
          </div>
          <div style="text-align: center; width: 200px; border-top: 1.5px solid #001D39; padding-top: 8px;">
            <div style="font-size: 13px; font-weight: 700; color: #001D39;">Kath</div>
            <div style="font-size: 10px; color: #6EA2B3; text-transform: uppercase; letter-spacing: 0.5px;">Firma de Conformidad</div>
          </div>
        </div>

        <div class="footer">
          Generado automáticamente por JOEKAT FINACE • Administración Compartida Joel & Kat • Confidencial
        </div>
      </body>
    </html>
  `;

  return htmlContent;
};

// 2. Acción de Impresión Separada (abre diálogo nativo de impresión / AirPrint)
export const printMonthlyReport = async (input: GenerateReportInput): Promise<void> => {
  const htmlContent = generateMonthlyReportHtml(input);
  await Print.printAsync({
    html: htmlContent,
  });
};

// 3. Acción de Descarga Separada (genera archivo .pdf real y descarga directa al dispositivo)
export const downloadMonthlyPdfReport = async (input: GenerateReportInput): Promise<string> => {
  const { month, year, transactions, budgets, categories, savingGoals = [], currency } = input;
  const totals = calculateMonthlyTotals(transactions, month, year);

  const categoriesMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {} as Record<string, Category>);

  // Filtrar transacciones del mes
  const monthTransactions = transactions.filter((t) => {
    if (!t.date) return false;
    const parts = t.date.split('-');
    return parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month;
  });

  const periodLabel = formatMonthYear(new Date(year, month - 1, 1));
  const fileName = `Reporte_Financiero_JOEKAT_${year}_${String(month).padStart(2, '0')}.pdf`;

  // Construir PDF ejecutivo usando jsPDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Franja Superior Corporativa (#001D39)
  doc.setFillColor(0, 29, 57);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('joekat finace', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(123, 189, 232); // #7BBDE8
  doc.text('TOGETHER FOR A BRIGHTER TOMORROW • REPORTE FAMILIAR CONFIDENCIAL', 14, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(periodLabel, 196, 13, { align: 'right' });

  // 4 Cajas de Cifras Clave
  const boxY = 30;
  const boxWidth = 43;
  const boxHeight = 19;
  const gap = 3;

  const metricCards = [
    { label: 'INGRESOS TOTALES', val: formatCurrency(totals.totalIncome, currency), rgb: [16, 185, 129] },
    { label: 'GASTOS TOTALES', val: formatCurrency(totals.totalExpenses, currency), rgb: [0, 29, 57] },
    { label: 'BALANCE DISPONIBLE', val: formatCurrency(totals.netBalance, currency), rgb: [10, 65, 116] },
    { label: 'TASA DE AHORRO', val: `${totals.savingsRate}%`, rgb: [73, 118, 159] },
  ];

  metricCards.forEach((c, idx) => {
    const x = 14 + idx * (boxWidth + gap);
    doc.setFillColor(240, 246, 250);
    doc.roundedRect(x, boxY, boxWidth, boxHeight, 2, 2, 'F');

    doc.setFillColor(c.rgb[0], c.rgb[1], c.rgb[2]);
    doc.rect(x, boxY, 2.5, boxHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(73, 118, 159);
    doc.text(c.label, x + 5, boxY + 6);

    doc.setFontSize(8.5);
    doc.setTextColor(c.rgb[0], c.rgb[1], c.rgb[2]);
    doc.text(c.val, x + 5, boxY + 14);
  });

  let currentY = boxY + boxHeight + 8;

  // Tabla Metas de Ahorro y Prioridades (si existen)
  if (savingGoals && savingGoals.length > 0) {
    const sortedGoals = [...savingGoals].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
    const goalsRows = sortedGoals.map((g, idx) => {
      const p = g.priority ?? idx + 1;
      const pct = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;
      return [
        p === 1 ? '#1 Prioridad Máxima' : `#${p} Prioridad`,
        g.name + (g.is_completed ? ' (Completada)' : ''),
        formatCurrency(g.current_amount, currency),
        formatCurrency(g.target_amount, currency),
        `${pct}%`,
      ];
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 29, 57);
    doc.text('Metas de Ahorro y Prioridades Familiares', 14, currentY);

    autoTable(doc, {
      startY: currentY + 2,
      head: [['Prioridad', 'Meta Familiar', 'Ahorrado', 'Objetivo Total', 'Progreso']],
      body: goalsRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 29, 57], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 62 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 28, halign: 'center' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Tabla Presupuestos del Mes (si existen)
  if (budgets && budgets.length > 0) {
    const budgetRows = budgets.map((b) => {
      const cat = categoriesMap[b.category_id];
      const spent = monthTransactions
        .filter((t) => t.type === 'expense' && t.category_id === b.category_id)
        .reduce((sum, t) => sum + t.amount, 0);
      const pct = b.allocated_amount > 0 ? Math.round((spent / b.allocated_amount) * 100) : 0;
      const isOver = spent > b.allocated_amount;
      return [
        cat?.name || 'Categoría',
        formatCurrency(spent, currency),
        formatCurrency(b.allocated_amount, currency),
        `${pct}% ${isOver ? '(Excedido)' : '(En orden)'}`,
      ];
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 29, 57);
    doc.text('Estado de Presupuestos del Mes', 14, currentY);

    autoTable(doc, {
      startY: currentY + 2,
      head: [['Categoría', 'Gastado', 'Asignado', 'Cumplimiento']],
      body: budgetRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 29, 57], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 42, halign: 'center' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Tabla Movimientos Cronológicos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 29, 57);
  doc.text('Registro Cronológico de Movimientos', 14, currentY);

  const txRows = monthTransactions.slice(0, 45).map((t) => [
    formatDateSpanish(t.date),
    t.description || categoriesMap[t.category_id || '']?.name || 'Movimiento',
    t.user_name || 'Hogar',
    categoriesMap[t.category_id || '']?.name || 'Otros',
    `${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount, currency)}`,
  ]);

  if (txRows.length === 0) {
    txRows.push(['-', 'No se registraron movimientos en este periodo.', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: currentY + 2,
    head: [['Fecha', 'Concepto', 'Autor', 'Categoría', 'Monto']],
    body: txRows,
    theme: 'grid',
    headStyles: { fillColor: [0, 29, 57], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 66 },
      2: { cellWidth: 22 },
      3: { cellWidth: 36 },
      4: { cellWidth: 34, halign: 'right' },
    },
  });

  // Firmas de Conformidad
  const sigY = (doc as any).lastAutoTable.finalY + 14;
  if (sigY < 265) {
    doc.setDrawColor(0, 29, 57);
    doc.setLineWidth(0.4);
    doc.line(30, sigY, 85, sigY);
    doc.line(125, sigY, 180, sigY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 29, 57);
    doc.text('Joel', 57.5, sigY + 4, { align: 'center' });
    doc.text('Kath', 152.5, sigY + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(110, 162, 179);
    doc.text('Firma de Conformidad', 57.5, sigY + 7.5, { align: 'center' });
    doc.text('Firma de Conformidad', 152.5, sigY + 7.5, { align: 'center' });
  }

  // Descarga directa del archivo en Web / Safari
  if (Platform.OS === 'web' || typeof document !== 'undefined') {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return fileName;
  }

  // Descarga / Compartir en entorno nativo (iOS / Android)
  const base64 = doc.output('datauristring').split(',')[1];
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Descargar Reporte Financiero JOEKAT FINACE',
      UTI: 'com.adobe.pdf',
    });
  }

  return fileUri;
};

// Compatibilidad retroactiva
export const generateMonthlyPdfReport = downloadMonthlyPdfReport;

export const sharePdfReport = async (pdfUri: string): Promise<void> => {
  if (Platform.OS === 'web' || (pdfUri && !pdfUri.startsWith('file://'))) {
    return;
  }
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartir Reporte Financiero JOEKAT FINACE',
      UTI: 'com.adobe.pdf',
    });
  }
};
