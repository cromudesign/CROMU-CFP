import React, { useState, useEffect } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { Transaction, TransactionType, TransactionStatus } from '../types';
import { cn } from '../lib/utils';

interface TransactionFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdate: (transaction: Transaction) => void;
  editingTransaction?: Transaction | null;
  onCancelEdit: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onAdd, 
  onUpdate,
  editingTransaction,
  onCancelEdit
}) => {
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<TransactionType>('saida');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<TransactionStatus>('pendente');

  useEffect(() => {
    if (editingTransaction) {
      setTitulo(editingTransaction.titulo);
      setValor(String(editingTransaction.valor));
      setTipo(editingTransaction.tipo);
      setData(editingTransaction.data);
      setStatus(editingTransaction.status);
    } else {
      resetForm();
    }
  }, [editingTransaction]);

  const resetForm = () => {
    setTitulo('');
    setValor('');
    setTipo('saida');
    setData(new Date().toISOString().split('T')[0]);
    setStatus('pendente');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const transactionData = {
      titulo,
      valor: Number(valor),
      tipo,
      data,
      status
    };

    if (editingTransaction) {
      onUpdate({ ...transactionData, id: editingTransaction.id });
    } else {
      onAdd(transactionData);
    }
    
    resetForm();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
        </h2>
        {editingTransaction && (
          <button 
            onClick={onCancelEdit}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Título</label>
          <input
            required
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Aluguel, Supermercado..."
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Valor (R$)</label>
            <input
              required
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Data</label>
            <input
              required
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Tipo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTipo('entrada')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg font-medium transition-all border",
                  tipo === 'entrada' 
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setTipo('saida')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg font-medium transition-all border",
                  tipo === 'saida' 
                    ? "bg-rose-50 border-rose-500 text-rose-700" 
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                Saída
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('pago')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg font-medium transition-all border",
                  status === 'pago' 
                    ? "bg-blue-50 border-blue-500 text-blue-700" 
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                Pago
              </button>
              <button
                type="button"
                onClick={() => setStatus('pendente')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg font-medium transition-all border",
                  status === 'pendente' 
                    ? "bg-amber-50 border-amber-500 text-amber-700" 
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                Pendente
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-md shadow-emerald-200 transition-all transform active:scale-[0.98]"
        >
          {editingTransaction ? 'Salvar Alterações' : (
            <>
              <PlusCircle className="w-5 h-5" />
              Adicionar Transação
            </>
          )}
        </button>
      </form>
    </div>
  );
};
