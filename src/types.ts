export type TransactionType = 'entrada' | 'saida';
export type TransactionStatus = 'pago' | 'pendente';

export interface Transaction {
  id: string;
  titulo: string;
  valor: number;
  tipo: TransactionType;
  data: string;
  status: TransactionStatus;
}

export interface DashboardStats {
  saldoTotal: number;
  totalEntradas: number;
  totalSaidas: number;
  contasPendentes: number;
  contasPagas: number;
}
