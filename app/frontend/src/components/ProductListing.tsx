import { motion } from 'framer-motion';
import { Zap, X } from 'lucide-react';
import { Product } from '../types';
import { ExpandableProductCard } from './ui/expandable-card';

interface ProductListingProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onPurchase: (product: Product) => void;
  onClose?: () => void;
  purchasedProductIds: Set<string>;
}

const ProductListing = ({ products, onSelectProduct, onPurchase, onClose, purchasedProductIds }: ProductListingProps) => {
  const handlePurchase = (product: Product) => {
    onPurchase(product);
    onSelectProduct(product);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        className="p-6 border-b border-dark-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Found {products.length} Listings</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-dark-700 transition-colors group"
              title="Close listings"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full flex items-center">
            <Zap className="w-3 h-3 mr-1" />
            {products.filter((p) => p.sellerType === 'ai-agent').length} Agent Listings
          </span>
          <span className="px-3 py-1 bg-dark-700 text-gray-400 rounded-full">
            {products.filter((p) => p.sellerType === 'traditional').length} Traditional
          </span>
        </div>
      </motion.div>

      {/* Product Grid with Expandable Cards */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <ExpandableProductCard
            products={products}
            onPurchase={handlePurchase}
            purchasedProductIds={purchasedProductIds}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default ProductListing;
