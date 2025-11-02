import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Check, Loader2, DollarSign, Tag, Package } from 'lucide-react';
import { Listing } from '../types';
import { sellingAgentService } from '../services/sellingAgent';
import { FileUpload } from './ui/file-upload';

interface ListingFormProps {
  onClose: () => void;
  onListingCreated: (listing: Listing) => void;
  initialInput?: string;
}

const ListingForm = ({ onClose, onListingCreated, initialInput }: ListingFormProps) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: initialInput || '',
    description: '',
    price: '',
    currency: 'USDC',
    condition: 'good' as 'new' | 'like-new' | 'good' | 'fair' | 'poor',
    category: 'electronics',
    imageUrl: '',
  });

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      setUploadedFiles(files);
      // Create a temporary URL for preview
      const imageUrl = URL.createObjectURL(files[0]);
      setFormData({ ...formData, imageUrl });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setIsLoading(true);

    try {
      // Create listing
      const listing = await sellingAgentService.createListing(
        formData.title,
        formData.description,
        parseFloat(formData.price),
        formData.currency,
        formData.imageUrl || undefined,
        formData.condition,
        formData.category
      );

      // Simulate publishing to marketplace
      // In production, this would require wallet authentication
      const mockSellerAddress = '0.0.999999';
      await sellingAgentService.publishListing(listing.id, mockSellerAddress);

      onListingCreated(listing);
    } catch (error) {
      console.error('Failed to create listing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const conditions = [
    { value: 'new', label: 'Brand New', description: 'Never used, in original packaging' },
    { value: 'like-new', label: 'Like New', description: 'Minimal use, no visible wear' },
    { value: 'good', label: 'Good', description: 'Used with minor wear, fully functional' },
    { value: 'fair', label: 'Fair', description: 'Visible wear, fully functional' },
    { value: 'poor', label: 'Poor', description: 'Significant wear, may have minor issues' },
  ];

  const categories = [
    { value: 'electronics', label: 'Electronics', icon: Package },
    { value: 'computers', label: 'Computers', icon: Package },
    { value: 'phones', label: 'Phones', icon: Package },
    { value: 'accessories', label: 'Accessories', icon: Tag },
    { value: 'other', label: 'Other', icon: Tag },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
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
            <h2 className="text-2xl font-bold text-white">Create Listing</h2>
            <p className="text-sm text-gray-400 mt-1">
              Step {step} of 3 - {step === 1 ? 'Basic Info' : step === 2 ? 'Pricing & Condition' : 'Review & Publish'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex space-x-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-all ${
                s <= step ? 'bg-primary-500' : 'bg-dark-700'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Item Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., MacBook Pro 16-inch 2023"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Describe your item, its features, and why it's great..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.value })}
                          className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all ${
                            formData.category === cat.value
                              ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                              : 'bg-dark-800 border-dark-600 text-gray-400 hover:border-dark-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Pricing & Condition */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Price *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Currency *
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="USDC">USDC</option>
                      <option value="HBAR">HBAR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Condition *
                  </label>
                  <div className="space-y-2">
                    {conditions.map((cond) => (
                      <button
                        key={cond.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, condition: cond.value as any })}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          formData.condition === cond.value
                            ? 'bg-primary-500/20 border-primary-500'
                            : 'bg-dark-800 border-dark-600 hover:border-dark-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${
                              formData.condition === cond.value ? 'text-primary-400' : 'text-white'
                            }`}>
                              {cond.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{cond.description}</p>
                          </div>
                          {formData.condition === cond.value && (
                            <Check className="w-5 h-5 text-primary-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product Image (optional)
                  </label>
                  <FileUpload onChange={handleFileUpload} />
                </div>
              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-dark-800 rounded-2xl p-6 border border-dark-600">
                  <h3 className="text-lg font-semibold text-white mb-4">Review Your Listing</h3>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-400">Title</p>
                      <p className="text-white font-medium">{formData.title}</p>
                    </div>

                    <div>
                      <p className="text-gray-400">Description</p>
                      <p className="text-white">{formData.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400">Price</p>
                        <p className="text-white font-medium">
                          {formData.price} {formData.currency}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400">Condition</p>
                        <p className="text-white font-medium capitalize">{formData.condition}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-400">Category</p>
                      <p className="text-white font-medium capitalize">{formData.category}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4">
                  <p className="text-sm text-primary-400">
                    Your listing will be published to the AI agent marketplace and will accept secure payments via Hedera blockchain.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex justify-between mt-6 pt-6 border-t border-dark-700">
            <button
              type="button"
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="px-6 py-3 rounded-xl bg-dark-700 hover:bg-dark-600 text-white transition-colors"
            >
              {step > 1 ? 'Back' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-xl premium-gradient text-white font-medium shadow-premium hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>{step < 3 ? 'Next' : 'Publish Listing'}</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ListingForm;
