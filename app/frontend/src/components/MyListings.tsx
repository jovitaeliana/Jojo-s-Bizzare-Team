import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, DollarSign, Calendar, CheckCircle, XCircle, Clock, Edit, Trash2, Eye } from 'lucide-react';
import { Listing } from '../types';
import { sellingAgentService } from '../services/sellingAgent';

interface MyListingsProps {
  listings: Listing[];
  onListingUpdated: () => void;
}

const MyListings = ({ listings, onListingUpdated }: MyListingsProps) => {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const getStatusIcon = (status: Listing['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'sold':
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'draft':
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: Listing['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'sold':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const handleCancelListing = async (listingId: string) => {
    if (confirm('Are you sure you want to cancel this listing?')) {
      await sellingAgentService.cancelListing(listingId);
      onListingUpdated();
    }
  };

  const activeListing = listings.filter(l => l.status === 'active');
  const soldListings = listings.filter(l => l.status === 'sold');
  const otherListings = listings.filter(l => l.status === 'draft' || l.status === 'cancelled');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Listings</h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage your items on the marketplace
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Listings</p>
              <p className="text-2xl font-bold text-white">{listings.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-400">{activeListing.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Sold</p>
              <p className="text-2xl font-bold text-blue-400">{soldListings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {listings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <Package className="w-16 h-16 text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-300 mb-2">No Listings Yet</h2>
            <p className="text-gray-500 max-w-md">
              Start selling by telling Agora what you'd like to list. Just say "I want to sell..." in the chat!
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Active Listings */}
            {activeListing.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  Active Listings ({activeListing.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activeListing.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onCancel={handleCancelListing}
                      onClick={() => setSelectedListing(listing)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sold Listings */}
            {soldListings.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-400 mr-2" />
                  Sold Listings ({soldListings.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {soldListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onCancel={handleCancelListing}
                      onClick={() => setSelectedListing(listing)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Listings (Draft/Cancelled) */}
            {otherListings.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-2" />
                  Other Listings ({otherListings.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {otherListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onCancel={handleCancelListing}
                      onClick={() => setSelectedListing(listing)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Listing Detail Modal */}
      <AnimatePresence>
        {selectedListing && (
          <ListingDetailModal
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
            onCancel={handleCancelListing}
            onUpdated={onListingUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Listing Card Component
interface ListingCardProps {
  listing: Listing;
  onCancel: (id: string) => void;
  onClick: () => void;
}

const ListingCard = ({ listing, onCancel, onClick }: ListingCardProps) => {
  const getStatusIcon = (status: Listing['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'sold':
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'draft':
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: Listing['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'sold':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="glass-effect rounded-2xl p-4 border border-dark-600 cursor-pointer hover:border-primary-500/50 transition-all"
      onClick={onClick}
    >
      {/* Image or Placeholder */}
      <div className="relative mb-3">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-40 object-cover rounded-xl"
          />
        ) : (
          <div className="w-full h-40 bg-dark-800 rounded-xl flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-600" />
          </div>
        )}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full border text-xs font-medium flex items-center space-x-1 backdrop-blur-sm ${getStatusColor(listing.status)}`}>
          {getStatusIcon(listing.status)}
          <span className="capitalize">{listing.status}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-white font-semibold mb-2 truncate">{listing.title}</h3>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{listing.description}</p>

      {/* Details */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-1 text-white font-bold">
          <DollarSign className="w-4 h-4" />
          <span>{listing.price.toFixed(2)} {listing.currency}</span>
        </div>
        <div className="flex items-center space-x-1 text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{new Date(listing.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Condition */}
      {listing.condition && (
        <div className="mt-2 text-xs text-gray-500 capitalize">
          Condition: {listing.condition}
        </div>
      )}

      {/* Actions */}
      {listing.status === 'active' && (
        <div className="mt-3 pt-3 border-t border-dark-700 flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel(listing.id);
            }}
            className="flex-1 py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Cancel</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};

// Listing Detail Modal
interface ListingDetailModalProps {
  listing: Listing;
  onClose: () => void;
  onCancel: (id: string) => void;
  onUpdated: () => void;
}

const ListingDetailModal = ({ listing, onClose, onCancel, onUpdated }: ListingDetailModalProps) => {
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
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{listing.title}</h2>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                listing.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                listing.status === 'sold' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                listing.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              } capitalize`}>
                {listing.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <XCircle className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Image */}
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-64 object-cover rounded-2xl mb-6"
          />
        ) : (
          <div className="w-full h-64 bg-dark-800 rounded-2xl flex items-center justify-center mb-6">
            <Package className="w-24 h-24 text-gray-600" />
          </div>
        )}

        {/* Details */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-1">Description</h3>
            <p className="text-white">{listing.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-1">Price</h3>
              <p className="text-2xl font-bold text-white">
                {listing.price.toFixed(2)} <span className="text-lg text-gray-400">{listing.currency}</span>
              </p>
            </div>

            {listing.condition && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Condition</h3>
                <p className="text-white capitalize">{listing.condition}</p>
              </div>
            )}
          </div>

          {listing.category && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-1">Category</h3>
              <p className="text-white capitalize">{listing.category}</p>
            </div>
          )}

          {listing.sellerAddress && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-1">Seller Address</h3>
              <p className="text-primary-400 font-mono text-sm">{listing.sellerAddress}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 mb-1">Created</h3>
              <p className="text-gray-300">
                {new Date(listing.createdAt).toLocaleDateString()} {new Date(listing.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-400 mb-1">Last Updated</h3>
              <p className="text-gray-300">
                {new Date(listing.updatedAt).toLocaleDateString()} {new Date(listing.updatedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {listing.status === 'active' && (
          <div className="mt-6 pt-6 border-t border-dark-700 flex space-x-3">
            <button
              onClick={() => {
                onCancel(listing.id);
                onClose();
              }}
              className="flex-1 py-3 px-6 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-5 h-5" />
              <span>Cancel Listing</span>
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MyListings;
