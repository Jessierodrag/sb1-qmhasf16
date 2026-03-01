import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { Wallet as WalletIcon, PlusCircle, MinusCircle, CreditCard, ArrowDownCircle, ArrowUpCircle, Clock, Filter, ChevronDown, Search, Download, Calendar, Sparkles, MapPin, Edit2 } from 'lucide-react';
import { getWalletBalance, getTransactions, addTransaction } from '../lib/wallet';
import { getUserBoosts, updateBoostCity, PostBoost } from '../lib/boosts';
import { regions } from '../data/regions';

interface WalletProps {
  walletBalance: number;
  setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

type TransactionType = 'all' | 'credit' | 'debit';
type PaymentMethod = 'card' | 'bank' | 'paypal';

const Wallet: React.FC<WalletProps> = ({
  walletBalance,
  setWalletBalance,
  transactions,
  setTransactions
}) => {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [withdrawMethod, setWithdrawMethod] = useState<PaymentMethod>('bank');
  const [filterType, setFilterType] = useState<TransactionType>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBoosts, setActiveBoosts] = useState<PostBoost[]>([]);
  const [editingBoostId, setEditingBoostId] = useState<string | null>(null);
  const [newCity, setNewCity] = useState('');

  // Load wallet balance and transactions from Supabase
  useEffect(() => {
    const loadWalletData = async () => {
      setIsLoading(true);
      try {
        // Get wallet balance
        const { balance, error: balanceError } = await getWalletBalance();
        if (!balanceError) {
          setWalletBalance(balance);
        }

        // Get transactions
        const { transactions: dbTransactions, error: transactionsError } = await getTransactions();
        if (!transactionsError) {
          setTransactions(dbTransactions);
        }

        // Get active boosts
        const { boosts, error: boostsError } = await getUserBoosts();
        if (!boostsError && boosts) {
          const now = new Date();
          const active = boosts.filter(boost =>
            boost.is_active && new Date(boost.end_date) > now
          );
          setActiveBoosts(active);
        }
      } catch (error) {
        console.error('Error loading wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWalletData();
  }, [setWalletBalance, setTransactions]);

  // Filtrer les transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Filtrer par type
    if (filterType !== 'all' && transaction.type !== filterType) {
      return false;
    }

    // Filtrer par recherche
    if (searchQuery && !transaction.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filtrer par date
    if (dateRange.start && dateRange.end) {
      const transactionDate = new Date(transaction.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59); // Inclure toute la journée de fin

      if (transactionDate < startDate || transactionDate > endDate) {
        return false;
      }
    }

    return true;
  });

  const handleDeposit = async () => {
    setError(null);
    
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Veuillez entrer un montant valide");
      return;
    }

    setIsProcessing(true);

    try {
      const { transaction, error: transactionError } = await addTransaction(
        'credit',
        amount,
        `Recharge via ${
          paymentMethod === 'card' ? 'carte bancaire' : 
          paymentMethod === 'bank' ? 'virement bancaire' : 
          'PayPal'
        }`,
        paymentMethod
      );

      if (transactionError) {
        throw new Error(transactionError.message);
      }

      if (transaction) {
        // Update local state
        setWalletBalance(prev => prev + amount);
        setTransactions(prev => [transaction, ...prev]);
      }

      // Reset form and close modal
      setDepositAmount('');
      setShowDepositModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    setError(null);
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Veuillez entrer un montant valide");
      return;
    }

    if (amount > walletBalance) {
      setError("Solde insuffisant");
      return;
    }

    setIsProcessing(true);

    try {
      const { transaction, error: transactionError } = await addTransaction(
        'debit',
        amount,
        `Retrait vers ${
          withdrawMethod === 'card' ? 'carte bancaire' : 
          withdrawMethod === 'bank' ? 'compte bancaire' : 
          'compte PayPal'
        }`,
        withdrawMethod
      );

      if (transactionError) {
        throw new Error(transactionError.message);
      }

      if (transaction) {
        // Update local state
        setWalletBalance(prev => prev - amount);
        setTransactions(prev => [transaction, ...prev]);
      }

      // Reset form and close modal
      setWithdrawAmount('');
      setShowWithdrawModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === 'credit') {
      return <ArrowDownCircle className="h-5 w-5 text-green-400" />;
    } else {
      return <ArrowUpCircle className="h-5 w-5 text-rose" />;
    }
  };

  const handleUpdateCity = async (boostId: string) => {
    if (!newCity) {
      alert('Veuillez sélectionner une ville');
      return;
    }

    const { success, error } = await updateBoostCity(boostId, newCity);

    if (success) {
      setActiveBoosts(prevBoosts =>
        prevBoosts.map(boost =>
          boost.id === boostId ? { ...boost, city: newCity } : boost
        )
      );
      setEditingBoostId(null);
      setNewCity('');
      alert('Ville de promotion mise à jour avec succès!');
    } else {
      alert(error?.message || 'Erreur lors de la mise à jour de la ville');
    }
  };

  const getMethodIcon = (method?: PaymentMethod) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'bank':
        return <WalletIcon className="h-5 w-5" />;
      case 'paypal':
        return <WalletIcon className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Si la date est déjà formatée (ex: "15/02/2024")
      return dateString;
    }
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <WalletIcon className="h-12 w-12 text-gray-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Chargement du portefeuille...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-dark-50 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-200">Mon Abonnement</h2>
            <div className="text-right">
              <p className="text-sm text-gray-400">Solde actuel</p>
              <p className="text-3xl font-bold text-rose">{walletBalance.toFixed(2)}€</p>
            </div>
          </div>

          {activeBoosts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Mes Abonnements Actifs
              </h3>
              <div className="space-y-4">
                {activeBoosts.map((boost) => {
                  const daysLeft = Math.ceil(
                    (new Date(boost.end_date).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                  );
                  const isEditing = editingBoostId === boost.id;

                  return (
                    <div
                      key={boost.id}
                      className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-200">
                              {boost.boost_type === '24h' ? 'Classic 24h' :
                               boost.boost_type === '7days' ? 'Premium 7 jours' :
                               'Elite 1 mois'}
                            </span>
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded-full">
                              {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            Expire le {formatDate(boost.end_date)}
                          </p>
                        </div>
                        <span className="text-rose font-medium">{boost.price.toFixed(2)}€</span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-300">
                          Ville de promotion: <span className="font-medium text-gray-200">{boost.city || 'Non définie'}</span>
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="mt-3 pt-3 border-t border-yellow-500/20">
                          <label className="block text-sm text-gray-300 mb-2">
                            Changer la ville de promotion
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={newCity}
                              onChange={(e) => setNewCity(e.target.value)}
                              className="flex-1 bg-dark-100 text-gray-200 px-3 py-2 rounded-lg border border-dark-200 focus:outline-none focus:border-rose"
                            >
                              <option value="">Sélectionner une ville</option>
                              {regions.flatMap(region =>
                                region.cities.map(city => (
                                  <option key={city} value={city}>
                                    {city}
                                  </option>
                                ))
                              )}
                            </select>
                            <button
                              onClick={() => handleUpdateCity(boost.id)}
                              className="px-4 py-2 bg-rose text-white rounded-lg hover:bg-rose-600 transition-colors"
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => {
                                setEditingBoostId(null);
                                setNewCity('');
                              }}
                              className="px-4 py-2 bg-dark-100 text-gray-300 rounded-lg hover:bg-dark-200 transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingBoostId(boost.id);
                            setNewCity(boost.city || '');
                          }}
                          className="mt-3 flex items-center gap-2 text-sm text-rose hover:text-rose-400 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                          Changer la ville
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex items-center justify-center gap-2 bg-rose text-white px-6 py-3 rounded-lg font-medium hover:bg-rose-600 transition-colors"
            >
              <PlusCircle className="h-5 w-5" />
              Recharger mon compte
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="flex items-center justify-center gap-2 bg-dark-100 text-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-dark-200 transition-colors"
              disabled={walletBalance <= 0}
            >
              <MinusCircle className="h-5 w-5" />
              Retirer des fonds
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-200">Historique des transactions</h3>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center gap-2 px-3 py-2 bg-dark-100 rounded-lg text-sm text-gray-300 hover:bg-dark-200 transition-colors"
                  >
                    <Filter className="h-4 w-4" />
                    {filterType === 'all' ? 'Toutes' : 
                     filterType === 'credit' ? 'Recharges' : 
                     'Retraits'}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-50 rounded-lg shadow-lg border border-dark-200 py-2 z-10">
                      <button
                        onClick={() => {
                          setFilterType('all');
                          setShowFilterDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-100 transition-colors"
                      >
                        Toutes les transactions
                      </button>
                      <button
                        onClick={() => {
                          setFilterType('credit');
                          setShowFilterDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-100 transition-colors"
                      >
                        Recharges uniquement
                      </button>
                      <button
                        onClick={() => {
                          setFilterType('debit');
                          setShowFilterDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-100 transition-colors"
                      >
                        Retraits uniquement
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    // Logique pour exporter l'historique
                    alert('Fonctionnalité d\'export en cours de développement');
                  }}
                  className="p-2 bg-dark-100 rounded-lg text-gray-300 hover:bg-dark-200 transition-colors"
                  title="Exporter l'historique"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Filtres de recherche */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="px-2 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                  />
                </div>
                <span className="text-gray-500">-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-2 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-dark-200 rounded-lg bg-dark-100"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction)}
                      <div>
                        <p className="font-medium text-gray-200">{transaction.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDate(transaction.date)}</span>
                          {transaction.method && (
                            <>
                              <span className="text-gray-500">•</span>
                              <div className="flex items-center gap-1">
                                {getMethodIcon(transaction.method as PaymentMethod)}
                                <span>
                                  {transaction.method === 'card' ? 'Carte' : 
                                   transaction.method === 'bank' ? 'Banque' : 
                                   'PayPal'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className={`font-medium ${
                      transaction.type === 'credit' 
                        ? 'text-green-400' 
                        : 'text-rose'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toFixed(2)}€
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-dark-100 rounded-lg border border-dark-200">
                  <WalletIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 mb-2">Aucune transaction</p>
                  <p className="text-sm text-gray-500">
                    Vos transactions apparaîtront ici une fois que vous aurez effectué des opérations
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de recharge */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[100]">
          <div className="bg-dark-50 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-200">Recharger mon compte</h3>
                <button
                  onClick={() => {
                    setShowDepositModal(false);
                    setDepositAmount('');
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-300"
                  disabled={isProcessing}
                >
                  <ChevronDown className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Montant à recharger (€)
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => {
                      setDepositAmount(e.target.value);
                      setError(null);
                    }}
                    min="10"
                    step="10"
                    placeholder="50"
                    className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Méthode de paiement
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border ${
                        paymentMethod === 'card'
                          ? 'border-rose bg-rose/10 text-rose'
                          : 'border-dark-200 text-gray-400 hover:border-gray-400'
                      }`}
                      disabled={isProcessing}
                    >
                      <CreditCard className="h-6 w-6" />
                      <span className="text-xs">Carte</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank')}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border ${
                        paymentMethod === 'bank'
                          ? 'border-rose bg-rose/10 text-rose'
                          : 'border-dark-200 text-gray-400 hover:border-gray-400'
                      }`}
                      disabled={isProcessing}
                    >
                      <WalletIcon className="h-6 w-6" />
                      <span className="text-xs">Banque</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paypal')}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border ${
                        paymentMethod === 'paypal'
                          ? 'border-rose bg-rose/10 text-rose'
                          : 'border-dark-200 text-gray-400 hover:border-gray-400'
                      }`}
                      disabled={isProcessing}
                    >
                      <WalletIcon className="h-6 w-6" />
                      <span className="text-xs">PayPal</span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-rose/10 text-rose rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleDeposit}
                  disabled={!depositAmount || isProcessing}
                  className="w-full bg-rose text-white py-2.5 rounded-lg font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Traitement en cours...' : 'Recharger'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de retrait */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[100]">
          <div className="bg-dark-50 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-200">Retirer des fonds</h3>
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-300"
                  disabled={isProcessing}
                >
                  <ChevronDown className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Montant à retirer (€)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => {
                      setWithdrawAmount(e.target.value);
                      setError(null);
                    }}
                    min="10"
                    max={walletBalance.toString()}
                    step="10"
                    placeholder="50"
                    className="w-full px-3 py-2 bg-dark-100 border border-dark-200 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                    disabled={isProcessing}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Solde disponible: {walletBalance.toFixed(2)}€
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Méthode de retrait
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('card')}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border ${
                        withdrawMethod === 'card'
                          ? 'border-rose bg-rose/10 text-rose'
                          : 'border-dark-200 text-gray-400 hover:border-gray-400'
                      }`}
                      disabled={isProcessing}
                    >
                      <CreditCard className="h-6 w-6" />
                      <span className="text-xs">Carte</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('bank')}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border ${
                        withdrawMethod === 'bank'
                          ? 'border-rose bg-rose/10 text-rose'
                          : 'border-dark-200 text-gray-400 hover:border-gray-400'
                      }`}
                      disabled={isProcessing}
                    >
                      <WalletIcon className="h-6 w-6" />
                      <span className="text-xs">Banque</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('paypal')}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border ${
                        withdrawMethod === 'paypal'
                          ? 'border-rose bg-rose/10 text-rose'
                          : 'border-dark-200 text-gray-400 hover:border-gray-400'
                      }`}
                      disabled={isProcessing}
                    >
                      <WalletIcon className="h-6 w-6" />
                      <span className="text-xs">PayPal</span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-rose/10 text-rose rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || isProcessing || walletBalance <= 0}
                  className="w-full bg-rose text-white py-2.5 rounded-lg font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Traitement en cours...' : 'Retirer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;