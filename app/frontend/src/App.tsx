import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSidebar } from './components/ui/sidebar';
import ChatInterface from './components/ChatInterface';
import ProductListing from './components/ProductListing';
import TransactionPanel from './components/TransactionPanel';
import MyListings from './components/MyListings';
import ProfileSettings from './components/ProfileSettings';
import WindowControls from './components/WindowControls';
import SplashScreen from './components/SplashScreen';
import { useAuth } from './contexts/AuthContext';
import { Product, Transaction, Message, Listing } from './types';
import { Loader2 } from 'lucide-react';
import { sellingAgentService } from './services/sellingAgent';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeView, setActiveView] = useState<'chat' | 'transactions' | 'listings' | 'settings'>('chat');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchasedProductIds, setPurchasedProductIds] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content: "Hello! I'm Agora, your autonomous marketplace assistant. Tell me what you'd like to buy, and I'll find the best options for you. Or if you want to sell something, just let me know and I'll help you create a listing on the AI agent marketplace!",
      timestamp: new Date(),
    },
  ]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handlePurchase = (product: Product) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      product,
      status: 'pending',
      timestamp: new Date(),
      paymentMethod: product.sellerType === 'ai-agent' ? 'hedera' : 'traditional',
    };
    setTransactions([newTransaction, ...transactions]);

    // Mark product as purchased
    setPurchasedProductIds((prev) => new Set(prev).add(product.id));

    // Add AI message about the purchase
    const purchaseMessage: Message = {
      id: Date.now().toString(),
      type: 'agent',
      content: product.sellerType === 'ai-agent'
        ? `Great choice! I've initiated a purchase for "${product.title}" from ${product.seller}. The transaction is being processed via Hedera blockchain for instant, secure payment. I'll notify you once it's confirmed!`
        : `Perfect! I'm processing your purchase for "${product.title}" from ${product.source}. Since this is from a traditional marketplace, you'll be redirected to complete the payment on their platform. Transaction ID: ${newTransaction.id}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, purchaseMessage]);
  };

  const handleCloseListing = () => {
    setIsSidebarOpen(false);
  };

  const handleOpenListing = () => {
    setIsSidebarOpen(true);
  };

  const handleProductsFound = (newProducts: Product[]) => {
    setProducts(newProducts);
    setIsSidebarOpen(true); // Open sidebar when new products are found
  };

  const handleListingCreated = (listing: Listing) => {
    setUserListings((prev) => [listing, ...prev]);
  };

  const handleListingsUpdated = () => {
    // Refresh listings from the service
    const allListings = sellingAgentService.getAllListings();
    setUserListings(allListings);
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen bg-dark-900 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
          <p className="text-gray-400 text-sm">Loading Agora...</p>
        </div>
      </div>
    );
  }

  // Show splash screen if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <WindowControls />
        <SplashScreen />
      </>
    );
  }

  // Show main app when authenticated
  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Window Controls */}
      <WindowControls />

      {/* Draggable Area - Large top area for easy window dragging, excludes right side for window controls */}
      <div
        className="fixed top-0 left-0 h-24 z-40"
        style={{
          WebkitAppRegion: 'drag',
          right: '400px', // Exclude the window controls area
        } as React.CSSProperties}
      />

      {/* Sidebar */}
      <AppSidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Also draggable for easy window control */}
        <header
          className="h-16 border-b border-dark-700 flex items-center px-8 glass-effect relative"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <h1
            className="text-2xl font-bold text-gradient"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            Agora
          </h1>
          <div
            className="ml-4 px-3 py-1 bg-primary-600/20 rounded-full"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <span className="text-xs text-primary-400 font-medium">Powered by Hedera</span>
          </div>
          {/* Reserve space for window controls */}
          <div
            className="absolute top-0 right-0 h-full"
            style={{ width: '400px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          />
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {activeView === 'chat' ? (
            <>
              {/* Chat Section */}
              <motion.div
                className="flex-1 flex flex-col"
                initial={false}
                animate={{
                  width: products.length > 0 && isSidebarOpen ? '50%' : '100%',
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <ChatInterface
                  onProductsFound={handleProductsFound}
                  messages={messages}
                  setMessages={setMessages}
                  hasProducts={products.length > 0}
                  isSidebarOpen={isSidebarOpen}
                  onOpenSidebar={handleOpenListing}
                  onListingCreated={handleListingCreated}
                />
              </motion.div>

              {/* Product Listing Section */}
              <AnimatePresence mode="wait">
                {products.length > 0 && isSidebarOpen && (
                  <motion.div
                    key="product-listing"
                    className="w-1/2 border-l border-dark-700 bg-dark-800/50"
                    initial={{
                      x: '100%',
                      opacity: 0,
                    }}
                    animate={{
                      x: 0,
                      opacity: 1,
                    }}
                    exit={{
                      x: '100%',
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.4,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  >
                    <ProductListing
                      products={products}
                      onSelectProduct={handleProductSelect}
                      onPurchase={handlePurchase}
                      onClose={handleCloseListing}
                      purchasedProductIds={purchasedProductIds}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : activeView === 'transactions' ? (
            <div className="flex-1 w-full">
              <TransactionPanel transactions={transactions} />
            </div>
          ) : activeView === 'listings' ? (
            <div className="flex-1 w-full">
              <MyListings listings={userListings} onListingUpdated={handleListingsUpdated} />
            </div>
          ) : (
            <div className="flex-1 w-full">
              <ProfileSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
