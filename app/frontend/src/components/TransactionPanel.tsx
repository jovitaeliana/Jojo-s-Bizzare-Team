import { Clock, CheckCircle2, XCircle, Loader2, ExternalLink, Zap } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionPanelProps {
  transactions: Transaction[];
}

const TransactionPanel = ({ transactions }: TransactionPanelProps) => {
  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'processing':
        return 'bg-primary-500/20 text-primary-400 border-primary-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getStatusText = (status: Transaction['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (transactions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-12 h-12 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Transactions Yet</h3>
          <p className="text-gray-600">Your purchase history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-dark-700">
        <h2 className="text-2xl font-bold text-white mb-2">Transactions</h2>
        <p className="text-sm text-gray-400">Track your purchases and payment status</p>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="glass-effect rounded-2xl p-6 hover:bg-dark-700/50 transition-all animate-slide-up"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-xl bg-dark-700 overflow-hidden flex-shrink-0">
                    <img
                      src={transaction.product.imageUrl}
                      alt={transaction.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {transaction.product.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      Seller: {transaction.product.seller}
                    </p>
                    <div className="flex items-center space-x-2">
                      {transaction.product.sellerType === 'ai-agent' && (
                        <span className="px-2 py-1 bg-primary-600/20 text-primary-400 rounded-full text-xs flex items-center">
                          <Zap className="w-3 h-3 mr-1" />
                          AI Agent
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1">{getStatusText(transaction.status)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {transaction.product.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-400">{transaction.product.currency}</p>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="border-t border-dark-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="text-gray-300 font-mono">{transaction.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="text-gray-300 capitalize">
                    {transaction.paymentMethod === 'hedera' ? (
                      <span className="flex items-center">
                        <span className="mr-1">Hedera Network</span>
                        <Zap className="w-3 h-3 text-primary-400" />
                      </span>
                    ) : (
                      'Traditional Payment'
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Timestamp:</span>
                  <span className="text-gray-300">
                    {transaction.timestamp.toLocaleString()}
                  </span>
                </div>

                {/* Transaction Hash */}
                {transaction.transactionHash && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Transaction Hash:</span>
                    <a
                      href={`https://hashscan.io/testnet/transaction/${transaction.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-400 hover:text-primary-300 flex items-center font-mono"
                    >
                      {transaction.transactionHash.substring(0, 16)}...
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}

                {/* Agent Address */}
                {transaction.product.agentAddress && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Agent Address:</span>
                    <span className="text-primary-400 font-mono">
                      {transaction.product.agentAddress}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Indicator for Processing */}
              {transaction.status === 'processing' && (
                <div className="mt-4 pt-4 border-t border-dark-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Processing payment...</span>
                    <span className="text-sm text-primary-400">45%</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-premium h-full rounded-full animate-pulse w-[45%]" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransactionPanel;
