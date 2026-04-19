import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Clock, CheckCircle2 } from 'lucide-react';
import { DashboardStats } from '../types';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

interface DashboardProps {
  stats: DashboardStats;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Saldo Total',
      value: stats.saldoTotal,
      icon: Wallet,
      color: 'text-slate-600',
      bg: 'bg-white',
      isCurrency: true
    },
    {
      label: 'Entradas',
      value: stats.totalEntradas,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      isCurrency: true
    },
    {
      label: 'Saídas',
      value: stats.totalSaidas,
      icon: TrendingDown,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      isCurrency: true
    },
    {
      label: 'Pendentes',
      value: stats.contasPendentes,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      isCurrency: false
    },
    {
      label: 'Pagas',
      value: stats.contasPagas,
      icon: CheckCircle2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      isCurrency: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-6 rounded-2xl shadow-sm border border-slate-100 ${card.bg}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {card.label}
            </span>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <div className={`text-2xl font-bold ${card.color}`}>
            {card.isCurrency ? formatCurrency(card.value as number) : card.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
