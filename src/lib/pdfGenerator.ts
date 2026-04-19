import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Transaction, DashboardStats } from '../types';
import { formatCurrency } from './utils';

export function generatePDF(transactions: Transaction[], stats: DashboardStats) {
  const doc = new jsPDF();
  const now = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });

  // Title
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129); // Emerald 500
  doc.text('FinanFlow', 14, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text('Relatório de Finanças Pessoais', 14, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(`Gerado em: ${now}`, 14, 37);

  // KPIs Section
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.line(14, 42, 196, 42);

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Resumo Financeiro:', 14, 50);

  const statsY = 60;
  doc.setFontSize(10);
  doc.text(`Saldo Total:`, 14, statsY);
  doc.text(formatCurrency(stats.saldoTotal), 60, statsY);
  
  doc.text(`Total de Entradas:`, 14, statsY + 7);
  doc.text(formatCurrency(stats.totalEntradas), 60, statsY + 7);
  
  doc.text(`Total de Saídas:`, 14, statsY + 14);
  doc.text(formatCurrency(stats.totalSaidas), 60, statsY + 14);
  
  doc.text(`Contas Pendentes:`, 120, statsY);
  doc.text(String(stats.contasPendentes), 160, statsY);
  
  doc.text(`Contas Pagas:`, 120, statsY + 7);
  doc.text(String(stats.contasPagas), 160, statsY + 7);

  // Table
  autoTable(doc, {
    startY: 85,
    head: [['Título', 'Tipo', 'Valor', 'Data', 'Status']],
    body: transactions.map(t => [
      t.titulo,
      t.tipo === 'entrada' ? 'Entrada' : 'Saída',
      formatCurrency(t.valor),
      format(new Date(t.data), 'dd/MM/yyyy'),
      t.status === 'pago' ? 'Pago' : 'Pendente'
    ]),
    headStyles: { fillColor: [16, 185, 129] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 85 },
  });

  doc.save(`relatorio-finanflow-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
