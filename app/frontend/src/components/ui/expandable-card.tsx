import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Product } from "@/types";
import { Star, ShoppingCart, Plus, ExternalLink, Zap, CheckCircle, X, ChevronLeft, ChevronRight } from "lucide-react";

interface ExpandableProductCardProps {
  products: Product[];
  onPurchase: (product: Product) => void;
  purchasedProductIds: Set<string>;
}

export function ExpandableProductCard({ products, onPurchase, purchasedProductIds }: ExpandableProductCardProps) {
  const [active, setActive] = useState<Product | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null);
      } else if (event.key === "ArrowLeft") {
        navigateToPrevious();
      } else if (event.key === "ArrowRight") {
        navigateToNext();
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, products]);

  useOutsideClick(ref, () => setActive(null));

  const getCurrentIndex = () => {
    if (!active) return -1;
    return products.findIndex(p => p.id === active.id);
  };

  const navigateToNext = () => {
    if (!active) return;
    const currentIndex = getCurrentIndex();
    if (currentIndex < products.length - 1) {
      setActive(products[currentIndex + 1]);
    }
  };

  const navigateToPrevious = () => {
    if (!active) return;
    const currentIndex = getCurrentIndex();
    if (currentIndex > 0) {
      setActive(products[currentIndex - 1]);
    }
  };

  const isFirstCard = () => getCurrentIndex() === 0;
  const isLastCard = () => getCurrentIndex() === products.length - 1;

  const getSourceIcon = (source: string) => {
    const icons: { [key: string]: string } = {
      agent: '🤖',
      ebay: '🏪',
      amazon: '📦',
      etsy: '🎨',
      other: '🛒',
    };
    return icons[source] || '🛒';
  };

  const isPurchased = (productId: string) => purchasedProductIds.has(productId);

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm h-full w-full z-[90]"
            onClick={() => setActive(null)}
          />
        )}
      </AnimatePresence>

      {/* Expanded Card Modal */}
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 grid place-items-center z-[95] p-4">
            <motion.div
              layoutId={`card-${active.id}-${id}`}
              ref={ref}
              className="w-full max-w-[600px] h-fit max-h-[90vh] flex flex-col glass-effect rounded-3xl overflow-hidden border border-dark-600 relative"
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8
              }}
            >
              {/* Product Image */}
              <motion.div
                layoutId={`image-${active.id}-${id}`}
                className="relative"
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8
                }}
              >
                <img
                  src={active.imageUrl}
                  alt={active.title}
                  className="w-full h-72 object-cover"
                />

                {/* Close Button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-4 right-4 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full h-10 w-10 transition-colors z-10"
                  onClick={() => setActive(null)}
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>

                {/* Navigation Buttons */}
                {products.length > 1 && (
                  <>
                    {!isFirstCard() && (
                      <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full h-10 w-10 transition-colors z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToPrevious();
                        }}
                      >
                        <ChevronLeft className="w-6 h-6 text-white" />
                      </motion.button>
                    )}

                    {!isLastCard() && (
                      <motion.button
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full h-10 w-10 transition-colors z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToNext();
                        }}
                      >
                        <ChevronRight className="w-6 h-6 text-white" />
                      </motion.button>
                    )}
                  </>
                )}

                {active.sellerType === 'ai-agent' && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-primary-600/90 backdrop-blur-sm rounded-full flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-white" />
                    <span className="text-xs font-medium text-white">AI Agent</span>
                  </div>
                )}
              </motion.div>

              {/* Product Details */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {/* Title and Price */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <motion.h3
                        layoutId={`title-${active.id}-${id}`}
                        className="text-2xl font-bold text-white mb-2"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          mass: 0.8
                        }}
                      >
                        {active.title}
                      </motion.h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-3">
                        <span>{getSourceIcon(active.source)}</span>
                        <span>{active.seller}</span>
                        {active.isVerified && (
                          <CheckCircle className="w-4 h-4 text-primary-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  {active.rating && (
                    <motion.div
                      layoutId={`rating-${active.id}-${id}`}
                      className="flex items-center space-x-2 mb-4"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        mass: 0.8
                      }}
                    >
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(active.rating!)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-300">
                        {active.rating.toFixed(1)} ({active.reviews} reviews)
                      </span>
                    </motion.div>
                  )}

                  {/* Price */}
                  <motion.div
                    layoutId={`price-${active.id}-${id}`}
                    className="mb-6"
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      mass: 0.8
                    }}
                  >
                    <div className="text-3xl font-bold text-white">
                      {active.price.toFixed(2)} <span className="text-xl text-gray-400">{active.currency}</span>
                    </div>
                    {active.sellerType === 'ai-agent' && (
                      <div className="flex items-center mt-2 text-sm text-primary-400">
                        <Zap className="w-4 h-4 mr-1" />
                        <span>Instant blockchain payment via Hedera</span>
                      </div>
                    )}
                  </motion.div>

                  {/* Description */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                    className="mb-6"
                  >
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Description</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {active.description || 'No description available.'}
                    </p>
                  </motion.div>

                  {/* Agent Address */}
                  {active.agentAddress && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
                      className="mb-6 p-4 bg-dark-800/50 rounded-xl border border-dark-600"
                    >
                      <h4 className="text-xs font-semibold text-gray-400 mb-2">Agent Address</h4>
                      <p className="text-sm font-mono text-primary-400 break-all">
                        {active.agentAddress}
                      </p>
                    </motion.div>
                  )}

                  {/* External Link */}
                  {active.url && active.sellerType === 'traditional' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
                      className="mb-6"
                    >
                      <a
                        href={active.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View on {active.source}</span>
                      </a>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
                    className="flex space-x-3"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isPurchased(active.id)) {
                          onPurchase(active);
                          setActive(null);
                        }
                      }}
                      disabled={isPurchased(active.id)}
                      className={`
                        flex-1 py-3 px-6 rounded-xl font-semibold text-sm
                        flex items-center justify-center space-x-2
                        transition-all duration-200
                        ${
                          isPurchased(active.id)
                            ? 'bg-yellow-600/50 text-yellow-200 cursor-not-allowed'
                            : active.sellerType === 'ai-agent'
                            ? 'premium-gradient text-white shadow-premium hover:shadow-glow'
                            : 'bg-dark-700 hover:bg-dark-600 text-white'
                        }
                      `}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>{isPurchased(active.id) ? 'Purchase Pending' : 'Buy Now'}</span>
                    </button>

                    <button
                      className="py-3 px-6 rounded-xl font-semibold text-sm bg-dark-700 hover:bg-dark-600 text-white flex items-center justify-center space-x-2 transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add to cart functionality can be implemented here
                        console.log('Add to cart:', active.id);
                      }}
                    >
                      <Plus className="w-5 h-5" />
                      <span>Cart</span>
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Collapsed Product Cards List */}
      <div className="w-full space-y-3">
        {products.map((product) => (
          <motion.div
            layoutId={`card-${product.id}-${id}`}
            key={`card-${product.id}-${id}`}
            onClick={() => setActive(product)}
            className="glass-effect p-4 rounded-2xl cursor-pointer hover:ring-1 hover:ring-primary-500/50 transition-all duration-200"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }}
          >
            <div className="flex space-x-4">
              {/* Product Image */}
              <motion.div
                layoutId={`image-${product.id}-${id}`}
                className="flex-shrink-0"
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8
                }}
              >
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-20 h-20 rounded-xl object-cover"
                />
              </motion.div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <motion.h3
                      layoutId={`title-${product.id}-${id}`}
                      className="text-sm font-semibold text-white truncate"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        mass: 0.8
                      }}
                    >
                      {product.title}
                    </motion.h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {getSourceIcon(product.source)} {product.seller}
                      </span>
                      {product.isVerified && (
                        <CheckCircle className="w-3 h-3 text-primary-400" />
                      )}
                      {product.sellerType === 'ai-agent' && (
                        <span className="px-2 py-0.5 bg-primary-600/20 text-primary-400 text-xs rounded-full flex items-center">
                          <Zap className="w-3 h-3 mr-1" />
                          Agent
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating and Price */}
                <div className="flex items-center justify-between">
                  <motion.div
                    layoutId={`rating-${product.id}-${id}`}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      mass: 0.8
                    }}
                  >
                    {product.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-gray-300">{product.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({product.reviews})</span>
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    layoutId={`price-${product.id}-${id}`}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      mass: 0.8
                    }}
                  >
                    <span className="text-base font-bold text-white">
                      {product.price.toFixed(2)} {product.currency}
                    </span>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}
