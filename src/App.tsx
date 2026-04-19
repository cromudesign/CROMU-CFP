import { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, PieChart, Coins, Loader2, CloudOff, AlertCircle } from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { Transaction, DashboardStats } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { AIFeatures } from './components/AIFeatures';
import { generatePDF } from './lib/pdfGenerator';
import { auth, db, ensureAuth } from './lib/firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ uid: string, isLocalFallback?: boolean } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloudEnabled, setIsCloudEnabled] = useState(true);

  // Inicializa autenticação e detecta se o Firebase Auth está liberado
  useEffect(() => {
    ensureAuth()
      .then(user => {
        setCurrentUser(user);
        if ('isLocalFallback' in user && user.isLocalFallback) {
          setIsCloudEnabled(false);
          // Carrega do storage local se o cloud falhou
          const saved = localStorage.getItem('finanflow_fallback_data');
          if (saved) setTransactions(JSON.parse(saved));
          setIsLoading(false);
        }
      });
  }, []);

  // Sync com Firestore em tempo real (apenas se cloud estiver habilitado)
  useEffect(() => {
    if (!currentUser || !isCloudEnabled) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const item = doc.data();
        return {
          ...item,
          id: doc.id,
          data: item.data || new Date().toISOString().split('T')[0], 
        } as Transaction;
      });
      setTransactions(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore sync error:", error);
      setIsCloudEnabled(false); // Fallback imediato em erro de permissão/auth
      const saved = localStorage.getItem('finanflow_fallback_data');
      if (saved) setTransactions(JSON.parse(saved));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, isCloudEnabled]);

  // Persistência secundária local (apenas para o modo fallback)
  useEffect(() => {
    if (!isCloudEnabled) {
      localStorage.setItem('finanflow_fallback_data', JSON.stringify(transactions));
    }
  }, [transactions, isCloudEnabled]);

  const stats = useMemo<DashboardStats>(() => {
    const totalEntradas = transactions
      .filter(t => t.tipo === 'entrada')
      .reduce((acc, t) => acc + t.valor, 0);

    const totalSaidas = transactions
      .filter(t => t.tipo === 'saida')
      .reduce((acc, t) => acc + t.valor, 0);

    return {
      totalEntradas,
      totalSaidas,
      saldoTotal: totalEntradas - totalSaidas,
      contasPendentes: transactions.filter(t => t.status === 'pendente').length,
      contasPagas: transactions.filter(t => t.status === 'pago').length,
    };
  }, [transactions]);

  const handleAddTransaction = async (data: Omit<Transaction, 'id'>) => {
    if (!currentUser) return;
    
    if (isCloudEnabled) {
      try {
        await addDoc(collection(db, 'transactions'), {
          ...data,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Cloud add failed, falling back to local:", err);
        setIsCloudEnabled(false);
      }
    } else {
      const newLocal: Transaction = { ...data, id: crypto.randomUUID() };
      setTransactions(prev => [newLocal, ...prev]);
    }
  };

  const handleUpdateTransaction = async (updated: Transaction) => {
    if (!currentUser) return;

    if (isCloudEnabled) {
      try {
        const { id, ...data } = updated;
        await updateDoc(doc(db, 'transactions', id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        setEditingTransaction(null);
      } catch (err) {
        setIsCloudEnabled(false);
      }
    } else {
      setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
      setEditingTransaction(null);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    if (isCloudEnabled) {
      try {
        await deleteDoc(doc(db, 'transactions', id));
      } catch (err) {
        setIsCloudEnabled(false);
      }
    } else {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleToggleStatus = async (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    if (isCloudEnabled) {
      try {
        await updateDoc(doc(db, 'transactions', id), {
          status: transaction.status === 'pago' ? 'pendente' : 'pago',
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        setIsCloudEnabled(false);
      }
    } else {
      setTransactions(prev => prev.map(t => {
        if (t.id === id) {
          return { ...t, status: t.status === 'pago' ? 'pendente' : 'pago' };
        }
        return t;
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Iniciando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              CROMU - CFP
            </h1>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-4 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                <LayoutGrid className="w-4 h-4" />
                Dashboard
              </span>
              <button 
                onClick={() => generatePDF(transactions, stats)}
                className="flex items-center gap-1.5 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg"
              >
                <PieChart className="w-4 h-4" />
                Exportar Relatório
              </button>
            </nav>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-6 ml-6">
              {isCloudEnabled ? (
                <>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Live Sync</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight leading-none">
                    Modo Local<br/><span className="font-normal text-[8px] opacity-70">Aguardando Auth</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {!isCloudEnabled && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>
              <strong>Atenção:</strong> O salvamento em nuvem está desativado porque a <strong>Autenticação Anônima</strong> não foi habilitada no Console do Firebase. Seus dados estão sendo salvos <strong>apenas neste navegador</strong>.
            </p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        <section>
          <Dashboard stats={stats} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <section className="lg:col-span-8 flex flex-col gap-8">
            <TransactionList
              transactions={transactions}
              onEdit={setEditingTransaction}
              onDelete={handleDeleteTransaction}
              onToggleStatus={handleToggleStatus}
              onExportPDF={() => generatePDF(transactions, stats)}
            />
          </section>

          <aside className="lg:col-span-4 space-y-8 sticky top-24">
            <TransactionForm
              onAdd={handleAddTransaction}
              onUpdate={handleUpdateTransaction}
              editingTransaction={editingTransaction}
              onCancelEdit={() => setEditingTransaction(null)}
            />

            <AIFeatures />
          </aside>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-200">
        <p className="text-center text-slate-400 text-sm">
          &copy; 2026 CROMU. Finanças Pessoais {isCloudEnabled ? 'na Cloud' : '(Offline Mode)'}.
        </p>
      </footer>
    </div>
  );
}
