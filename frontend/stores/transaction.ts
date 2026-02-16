import { create } from 'zustand';

interface Transaction {
  id: number;
  party_id: number;
  type: 'debit' | 'credit';
  amount: number;
  running_balance: number;
  date: string;
  description: string | null;
  reference_number: string | null;
  user_name: string | null;
  payment_id: number | null;
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  setTransactions: (transactions: Transaction[]) => void;
  setIsLoading: (loading: boolean) => void;
  addTransaction: (transaction: Transaction) => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  isLoading: false,
  setTransactions: (transactions) => set({ transactions }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  addTransaction: (transaction) =>
    set((state) => ({ transactions: [transaction, ...state.transactions] })),
}));
