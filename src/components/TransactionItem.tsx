import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, Trash2, CheckCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const isPaid = transaction.status === 'pago';
  const isIncome = transaction.tipo === 'entrada';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group flex items-center justify-between p-4 bg-white hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isIncome ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
        )}>
          {isIncome ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        </div>
        
        <div>
          <h3 className="font-semibold text-slate-800">{transaction.titulo}</h3>
          <p className="text-xs text-slate-500">
            {format(new Date(transaction.data), "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="text-right">
          <p className={cn(
            "font-bold",
            isIncome ? "text-emerald-600" : "text-rose-600"
          )}>
            {isIncome ? '+' : '-'} {formatCurrency(transaction.valor)}
          </p>
          <button 
            onClick={() => onToggleStatus(transaction.id)}
            className={cn(
              "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-all",
              isPaid 
                ? "bg-blue-100 text-blue-700" 
                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            )}
          >
            {isPaid ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {transaction.status}
          </button>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(transaction)}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
