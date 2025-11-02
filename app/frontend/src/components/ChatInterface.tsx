import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Mic, MicOff, ShoppingBag, Plus, ImageIcon } from 'lucide-react';
import { Message, Product, Listing } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import ListingForm from './ListingForm';
import { FileUpload } from './ui/file-upload';
import { geminiService } from '../services/geminiService';
import { webSearchService } from '../services/webSearchService';

interface ChatInterfaceProps {
  onProductsFound: (products: Product[]) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  hasProducts: boolean;
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
  onListingCreated?: (listing: Listing) => void;
}

const PLACEHOLDER_EXAMPLES = [
  "Tell me what you want to buy...",
  "I want to sell my laptop...",
  "Search for laptops under $1000...",
  "List my iPhone for sale...",
  "Find wireless headphones with noise cancellation...",
  "I want to sell a smartwatch...",
  "Show me gaming keyboards...",
  "Sell my gaming console...",
];

const ChatInterface = ({ onProductsFound, messages, setMessages, hasProducts, isSidebarOpen, onOpenSidebar, onListingCreated }: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isVanishing, setIsVanishing] = useState(false);
  const [showListingForm, setShowListingForm] = useState(false);
  const [listingInput, setListingInput] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const [awaitingClarification, setAwaitingClarification] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech recognition hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error: speechError,
  } = useSpeechRecognition();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Rotate placeholder text every 3 seconds
  useEffect(() => {
    if (input.length > 0 || isListening) return; // Don't rotate if user is typing or listening

    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [input.length, isListening]);

  // Sync transcript with input
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setInput('');
      startListening();
    }
  };


  const handleListingCreated = (listing: Listing) => {
    setShowListingForm(false);

    // Notify parent component
    onListingCreated?.(listing);

    const successMessage: Message = {
      id: Date.now().toString(),
      type: 'agent',
      content: `Excellent! I've created your listing for "${listing.title}" at ${listing.price} ${listing.currency}. Your item is now live on the AI agent marketplace and ready to receive offers!\n\n📦 **Listing Details:**\n- Status: ${listing.status}\n- Condition: ${listing.condition}\n- Category: ${listing.category}\n\nBuyers can now find your listing and make secure payments via Hedera blockchain. I'll notify you when you receive any offers or sales!`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, successMessage]);
  };

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      setUploadedImage(files[0]);
    }
  };

  const handleImageSearch = async () => {
    if (!uploadedImage) return;

    setShowImageUpload(false);
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: `[Image uploaded: ${uploadedImage.name}]`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    const agentResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: 'agent',
      content: `I'm analyzing your image and searching for similar products across all marketplaces. This may take a moment...`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, agentResponse]);

    // Use Gemini to analyze the image
    const imageAnalysis = await geminiService.analyzeImage(uploadedImage);

    // Search for products based on image analysis
    const products = await webSearchService.searchProducts(imageAnalysis, 7);
    onProductsFound(products);

    const resultsMessage: Message = {
      id: (Date.now() + 2).toString(),
      type: 'agent',
      content: `Great! I analyzed your image and found ${products.length} similar products matching "${imageAnalysis}". I've identified items that match the visual characteristics, style, and features from your uploaded image.\n\nCheck out the results on the right to find the perfect match!`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, resultsMessage]);
    setIsLoading(false);
    setUploadedImage(null);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Stop listening if currently recording
    if (isListening) {
      stopListening();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Add to conversation context
    setConversationContext((prev) => [...prev, `User: ${input}`]);

    // Trigger vanish animation
    setIsVanishing(true);
    const currentInput = input;
    setTimeout(() => {
      setInput('');
      resetTranscript();
      setIsVanishing(false);
    }, 300);

    setIsLoading(true);

    // Use Gemini to analyze intent with conversation context
    const intentAnalysis = await geminiService.analyzeIntent(currentInput, conversationContext);

    // Add agent response to context
    setConversationContext((prev) => [...prev, `Intent: ${intentAnalysis.intent}, Product: ${intentAnalysis.productName}`]);

    if (intentAnalysis.intent === 'sell') {
      // Handle selling intent
      const sellingResponse = await geminiService.generateResponse(
        currentInput,
        intentAnalysis
      );

      const sellingAgentResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: sellingResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, sellingAgentResponse]);
      setIsLoading(false);

      // Extract item name and show listing form
      setListingInput(intentAnalysis.productName);
      setShowListingForm(true);
    } else if (intentAnalysis.intent === 'buy') {
      // Check if we need more information
      if (intentAnalysis.needsMoreInfo && !awaitingClarification) {
        setAwaitingClarification(true);

        // Generate clarifying question
        const clarifyingQ = await geminiService.generateClarifyingQuestion(
          currentInput,
          intentAnalysis
        );

        const agentResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          content: clarifyingQ.question,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, agentResponse]);
        setIsLoading(false);
        return;
      }

      // If we have enough info or user provided additional details, search for products
      setAwaitingClarification(false);

      const searchingResponse = await geminiService.generateResponse(
        currentInput,
        intentAnalysis,
        { hasProducts: false }
      );

      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: searchingResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentResponse]);

      // Use real web search to find products
      const searchQuery = intentAnalysis.searchQuery || intentAnalysis.productName;
      const products = await webSearchService.searchProducts(searchQuery, 7);

      onProductsFound(products);

      const agentProducts = products.filter((p) => p.sellerType === 'ai-agent');
      const traditionalProducts = products.filter((p) => p.sellerType === 'traditional');

      // Create detailed explanation
      let explanation = `Perfect! I found ${products.length} great options for you. Let me break down what I discovered:\n\n`;

      if (agentProducts.length > 0) {
        explanation += `**AI Agent Listings (${agentProducts.length}):**\n`;
        explanation += `These are verified autonomous agents on the Hedera network. They offer instant blockchain-based payments, automatic escrow, and smart contract protection. Price range: ${Math.min(...agentProducts.map(p => p.price)).toFixed(2)}-${Math.max(...agentProducts.map(p => p.price)).toFixed(2)} ${agentProducts[0].currency}\n\n`;
      }

      if (traditionalProducts.length > 0) {
        explanation += `**Traditional Marketplace (${traditionalProducts.length}):**\n`;
        explanation += `From established e-commerce platforms like ${[...new Set(traditionalProducts.map(p => p.source))].join(', ')}. These require standard checkout processes. Price range: ${Math.min(...traditionalProducts.map(p => p.price)).toFixed(2)}-${Math.max(...traditionalProducts.map(p => p.price)).toFixed(2)} ${traditionalProducts[0].currency}\n\n`;
      }

      explanation += `**My recommendation:** ${agentProducts.length > 0 ? 'The AI agent listings offer the most secure and fastest transactions through Hedera blockchain.' : 'Compare the ratings and seller reputation on the right.'}\n\n`;
      explanation += `Feel free to click on any listing for more details, or click "Buy" when you're ready to purchase!`;

      const resultsMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'agent',
        content: explanation,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, resultsMessage]);
      setIsLoading(false);
    } else {
      // Handle general conversation
      const generalResponse = await geminiService.generateResponse(
        currentInput,
        intentAnalysis
      );

      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: generalResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentResponse]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Listing Form Modal */}
      <AnimatePresence>
        {showListingForm && (
          <ListingForm
            onClose={() => setShowListingForm(false)}
            onListingCreated={handleListingCreated}
            initialInput={listingInput}
          />
        )}
      </AnimatePresence>

      {/* Image Upload Modal */}
      <AnimatePresence>
        {showImageUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => {
              setShowImageUpload(false);
              setUploadedImage(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass-effect rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-dark-600"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Search by Image</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Upload an image to find similar products
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowImageUpload(false);
                    setUploadedImage(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ImageIcon className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <FileUpload onChange={handleImageUpload} />
              </div>

              {/* Image Preview */}
              {uploadedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <div className="bg-dark-800 rounded-2xl p-4 border border-dark-600">
                    <div className="flex items-center space-x-3 mb-3">
                      <ImageIcon className="w-5 h-5 text-primary-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{uploadedImage.name}</p>
                        <p className="text-xs text-gray-500">
                          {(uploadedImage.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <img
                      src={URL.createObjectURL(uploadedImage)}
                      alt="Upload preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-6 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowImageUpload(false);
                    setUploadedImage(null);
                  }}
                  className="px-6 py-3 rounded-xl bg-dark-700 hover:bg-dark-600 text-white transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleImageSearch}
                  disabled={!uploadedImage}
                  className="px-6 py-3 rounded-xl premium-gradient text-white font-medium shadow-premium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Search Similar Products</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show Products Button - appears when sidebar is closed but products exist */}
      {hasProducts && !isSidebarOpen && (
        <motion.button
          key="show-products-btn"
          initial={{ opacity: 0, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          onClick={onOpenSidebar}
          className="fixed top-20 right-6 flex items-center space-x-2 px-4 py-3 premium-gradient rounded-xl shadow-premium hover:shadow-glow transition-all cursor-pointer"
          style={{
            zIndex: 60,
            WebkitAppRegion: 'no-drag',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ShoppingBag className="w-5 h-5 text-white" />
          <span className="text-sm font-medium text-white">Show Products</span>
        </motion.button>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{
                opacity: 0,
                y: message.type === 'user' ? 60 : 20,
                scale: message.type === 'user' ? 0.9 : 0.95,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                transition: { duration: 0.2 },
              }}
              transition={{
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              layout
            >
              <motion.div
                className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  message.type === 'user'
                    ? 'bg-gradient-premium text-white shadow-premium'
                    : 'glass-effect text-gray-100'
                }`}
                layout
              >
                <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                <span className="text-xs opacity-60 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              className="flex justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-effect rounded-2xl px-5 py-3 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                <span className="text-sm text-gray-300">Agora is thinking...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-dark-700">
        <AnimatePresence>
          {/* Speech recognition error display */}
          {speechError && isSupported && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg overflow-hidden"
            >
              <p className="text-xs text-red-400">{speechError}</p>
            </motion.div>
          )}

          {/* Not supported warning */}
          {!isSupported && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg overflow-hidden"
            >
              <p className="text-xs text-yellow-400">
                Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.
              </p>
            </motion.div>
          )}

          {/* Listening indicator */}
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-3 p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg flex items-center space-x-2 animate-pulse overflow-hidden"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <p className="text-xs text-primary-400">Listening... Speak now</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="flex items-end space-x-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Image Upload Button */}
          <motion.button
            onClick={() => setShowImageUpload(true)}
            disabled={isLoading}
            className="flex-shrink-0 w-12 h-12 rounded-xl glass-effect hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Search by image"
          >
            <Plus className="w-5 h-5 text-white" />
          </motion.button>

          <motion.div
            className={`flex-1 min-w-0 glass-effect rounded-2xl px-5 py-3 transition-all relative ${
              isListening ? 'ring-2 ring-red-500' : 'focus-within:ring-2 focus-within:ring-primary-500'
            }`}
          >
            {/* Animated placeholder overlay */}
            <AnimatePresence mode="wait">
              {!input && (
                <motion.div
                  key={isListening ? 'listening' : placeholderIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute left-5 top-3 text-sm text-gray-500 pointer-events-none"
                >
                  {isListening ? "Listening..." : PLACEHOLDER_EXAMPLES[placeholderIndex]}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-transparent text-white resize-none outline-none text-sm relative z-10"
              rows={1}
              disabled={isLoading}
              animate={{
                opacity: isVanishing ? 0 : 1,
                y: isVanishing ? -10 : 0,
                scale: isVanishing ? 0.95 : 1,
              }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          </motion.div>

          {/* Microphone button */}
          {isSupported && (
            <motion.button
              onClick={toggleListening}
              disabled={isLoading}
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50 animate-pulse'
                  : 'glass-effect hover:bg-white/10'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isListening ? "Stop recording" : "Start voice input"}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isListening ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </motion.button>
          )}

          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-12 h-12 rounded-xl premium-gradient flex items-center justify-center shadow-premium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              rotate: isLoading ? 0 : input.trim() ? [0, -10, 10, 0] : 0,
            }}
            transition={{
              rotate: { duration: 0.5, repeat: input.trim() && !isLoading ? Infinity : 0, repeatDelay: 2 },
            }}
          >
            <Send className="w-5 h-5 text-white" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatInterface;
