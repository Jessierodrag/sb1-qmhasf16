import { Transaction } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface WalletError {
  message: string;
}

const WALLET_KEY = 'fire-roses-wallet';
const TRANSACTIONS_KEY = 'fire-roses-transactions';

const getWallet = (userId: string): number => {
  const wallets = JSON.parse(localStorage.getItem(WALLET_KEY) || '{}');
  return wallets[userId] || 0;
};

const saveWallet = (userId: string, balance: number) => {
  const wallets = JSON.parse(localStorage.getItem(WALLET_KEY) || '{}');
  wallets[userId] = balance;
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallets));
};

const getStoredTransactions = (userId: string): Transaction[] => {
  const transactions = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '{}');
  return transactions[userId] || [];
};

const saveTransactions = (userId: string, transactions: Transaction[]) => {
  const allTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '{}');
  allTransactions[userId] = transactions;
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(allTransactions));
};

export const getWalletBalance = async (): Promise<{ balance: number; error: WalletError | null }> => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.id) throw new Error('User not authenticated');

    const balance = getWallet(user.id);
    return { balance, error: null };
  } catch (error) {
    console.error('Get wallet balance error:', error);
    return {
      balance: 0,
      error: { 
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la récupération du solde'
      }
    };
  }
};

export const getTransactions = async (): Promise<{ transactions: Transaction[]; error: WalletError | null }> => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.id) throw new Error('User not authenticated');

    const transactions = getStoredTransactions(user.id);
    return { transactions, error: null };
  } catch (error) {
    console.error('Get transactions error:', error);
    return {
      transactions: [],
      error: { 
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la récupération des transactions'
      }
    };
  }
};

export const addTransaction = async (
  type: 'credit' | 'debit',
  amount: number,
  description: string,
  method: 'card' | 'bank' | 'paypal' | 'wallet'
): Promise<{ transaction: Transaction | null; error: WalletError | null }> => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.id) throw new Error('User not authenticated');

    if (isNaN(amount) || amount <= 0) {
      throw new Error('Le montant doit être supérieur à 0');
    }

    const currentBalance = getWallet(user.id);
    if (type === 'debit' && currentBalance < amount) {
      throw new Error('Solde insuffisant');
    }

    // Update balance
    const newBalance = type === 'credit' ? currentBalance + amount : currentBalance - amount;
    saveWallet(user.id, newBalance);

    // Create transaction
    const transaction: Transaction = {
      id: parseInt(uuidv4()),
      type,
      amount,
      description,
      date: new Date().toLocaleDateString('fr-FR'),
      method,
      status: 'completed',
      timestamp: new Date()
    };

    // Save transaction
    const transactions = getStoredTransactions(user.id);
    transactions.unshift(transaction);
    saveTransactions(user.id, transactions);

    return { transaction, error: null };
  } catch (error) {
    console.error('Add transaction error:', error);
    return {
      transaction: null,
      error: { 
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'ajout de la transaction'
      }
    };
  }
};