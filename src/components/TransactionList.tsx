import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, FileDown } from 'lucide-react';
import { Transaction, TransactionType, TransactionStatus } from '../types';
import { TransactionItem } from './TransactionItem';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onExportPDF: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  onToggleStatus,
  onExportPDF
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredTransactions = transactions
    .filter(t => t.titulo.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(t => filterType === 'all' || t.tipo === filterType)
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .sort((a, b) => {
      const dateA = new Date(a.data).getTime();
      const dateB = new Date(b.data).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Transações</h2>
          <button
            onClick={onExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all text-sm font-medium"
          >
            <FileDown className="w-4 h-4" />
            Gerar PDF
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none hover:border-slate-300 transition-all"
            >
              <option value="all">Todos os Tipos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none hover:border-slate-300 transition-all"
            >
              <option value="all">Status</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
              title="Alternar Ordenação"
            >
              <ArrowUpDown className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[600px]">
        {filteredTransactions.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {filteredTransactions.map(t => (
              <TransactionItem
                key={t.id}
                transaction={t}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
              />
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <Filter className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">Nenhuma transação encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
};
