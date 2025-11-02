import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Wallet,
  Save,
  Shield,
  Bell,
  Palette,
  Globe,
  Copy,
  Check,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ProfileSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'appearance'>('profile');
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currency, setCurrency] = useState('USDC');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleCopyWallet = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    }
  };

  const handleSaveProfile = () => {
    // Save profile changes
    console.log('Saving profile...', { username, email });
    // In production, this would call an API
  };

  const handleSavePreferences = () => {
    // Save preferences
    console.log('Saving preferences...', { currency, language, timezone });
  };

  const handleSaveAppearance = () => {
    // Save appearance settings
    console.log('Saving appearance...', { theme, emailNotifications, pushNotifications });
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'preferences' as const, label: 'Preferences', icon: Globe },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-dark-700">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-sm text-gray-400 mt-1">
                Manage your account and preferences
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-6 border-b border-dark-700">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-dark-800 text-primary-400 border-t border-l border-r border-dark-600'
                    : 'text-gray-400 hover:text-white hover:bg-dark-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto w-full">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
            {/* User Info Card */}
            <div className="glass-effect rounded-2xl p-6 border border-dark-600">
              <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>

              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter email"
                    />
                  </div>
                </div>

                {/* Wallet Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hedera Wallet Address
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={user?.walletAddress || 'Not connected'}
                        readOnly
                        className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <button
                      onClick={handleCopyWallet}
                      className="p-3 bg-dark-700 hover:bg-dark-600 rounded-xl transition-colors"
                      title="Copy wallet address"
                    >
                      {copiedWallet ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Your Hedera wallet is used for blockchain transactions
                  </p>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveProfile}
                  className="w-full py-3 px-6 premium-gradient rounded-xl text-white font-medium shadow-premium hover:shadow-glow transition-all flex items-center justify-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-effect rounded-xl p-4 border border-dark-600 text-center">
                <Zap className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-xs text-gray-400">Transactions</p>
              </div>
              <div className="glass-effect rounded-xl p-4 border border-dark-600 text-center">
                <User className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-xs text-gray-400">Listings</p>
              </div>
              <div className="glass-effect rounded-xl p-4 border border-dark-600 text-center">
                <Wallet className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">0.00</p>
                <p className="text-xs text-gray-400">HBAR Balance</p>
              </div>
            </div>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
            <div className="glass-effect rounded-2xl p-6 border border-dark-600">
              <h2 className="text-lg font-semibold text-white mb-4">Preferences</h2>

              <div className="space-y-4">
                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preferred Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="USDC">USDC</option>
                    <option value="HBAR">HBAR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="EST">EST (Eastern Standard Time)</option>
                    <option value="PST">PST (Pacific Standard Time)</option>
                    <option value="CET">CET (Central European Time)</option>
                  </select>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSavePreferences}
                  className="w-full py-3 px-6 premium-gradient rounded-xl text-white font-medium shadow-premium hover:shadow-glow transition-all flex items-center justify-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
            <div className="glass-effect rounded-2xl p-6 border border-dark-600">
              <h2 className="text-lg font-semibold text-white mb-4">Security Settings</h2>

              <div className="space-y-4">
                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-white font-medium">Two-Factor Authentication</p>
                      <p className="text-xs text-gray-400">Add extra security to your account</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      twoFactorEnabled ? 'bg-primary-500' : 'bg-dark-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        twoFactorEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Change Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Change Password
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-12 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-500" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Connected Wallets */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Connected Wallets</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">Hedera Wallet</p>
                          <p className="text-xs text-gray-400">{user?.walletAddress || 'Not connected'}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Connected
                      </span>
                    </div>
                  </div>
                </div>

                <button className="w-full py-3 px-6 premium-gradient rounded-xl text-white font-medium shadow-premium hover:shadow-glow transition-all flex items-center justify-center space-x-2">
                  <Save className="w-5 h-5" />
                  <span>Update Security Settings</span>
                </button>
              </div>
            </div>
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
            <div className="glass-effect rounded-2xl p-6 border border-dark-600">
              <h2 className="text-lg font-semibold text-white mb-4">Appearance & Notifications</h2>

              <div className="space-y-4">
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTheme('dark')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                      }`}
                    >
                      <div className="w-full h-16 bg-dark-900 rounded-lg mb-2" />
                      <p className="text-white text-sm font-medium">Dark</p>
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme === 'light'
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                      }`}
                    >
                      <div className="w-full h-16 bg-gray-100 rounded-lg mb-2" />
                      <p className="text-white text-sm font-medium">Light</p>
                    </button>
                  </div>
                </div>

                {/* Notifications */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300">Notifications</h3>

                  <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-primary-400" />
                      <div>
                        <p className="text-white font-medium">Email Notifications</p>
                        <p className="text-xs text-gray-400">Receive updates via email</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        emailNotifications ? 'bg-primary-500' : 'bg-dark-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          emailNotifications ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-primary-400" />
                      <div>
                        <p className="text-white font-medium">Push Notifications</p>
                        <p className="text-xs text-gray-400">Get instant updates</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPushNotifications(!pushNotifications)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        pushNotifications ? 'bg-primary-500' : 'bg-dark-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          pushNotifications ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSaveAppearance}
                  className="w-full py-3 px-6 premium-gradient rounded-xl text-white font-medium shadow-premium hover:shadow-glow transition-all flex items-center justify-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Appearance</span>
                </button>
              </div>
            </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
