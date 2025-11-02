import { MessageSquare, ShoppingBag, Settings, Sparkles, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeView: 'chat' | 'transactions';
  setActiveView: (view: 'chat' | 'transactions') => void;
}

const Sidebar = ({ activeView, setActiveView }: SidebarProps) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'chat' as const, icon: MessageSquare, label: 'Agent Chat', badge: null },
    { id: 'transactions' as const, icon: ShoppingBag, label: 'Transactions', badge: null },
  ];

  return (
    <div className="w-20 bg-dark-800 border-r border-dark-700 flex flex-col items-center py-6 space-y-4 relative z-50">
      {/* Logo */}
      <div className="w-12 h-12 rounded-xl premium-gradient flex items-center justify-center mb-8 shadow-premium">
        <Sparkles className="w-6 h-6 text-white" />
      </div>

      {/* Menu Items */}
      <div className="flex-1 flex flex-col space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`
              relative w-14 h-14 rounded-xl flex items-center justify-center
              transition-all duration-200 group
              ${
                activeView === item.id
                  ? 'bg-primary-600 shadow-glow'
                  : 'bg-dark-700 hover:bg-dark-600'
              }
            `}
          >
            <item.icon
              className={`w-6 h-6 ${
                activeView === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'
              }`}
            />
            {item.badge && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                {item.badge}
              </span>
            )}

            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-3 py-1.5 bg-dark-700 rounded-lg text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl border border-dark-600">
              {item.label}
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col space-y-2">
        {/* User Profile */}
        <div className="relative group">
          <div className="w-14 h-14 rounded-xl bg-dark-700 flex items-center justify-center">
            <User className="w-6 h-6 text-gray-400" />
          </div>
          {/* User Info Tooltip */}
          {user && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-dark-700 rounded-lg text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 z-[100] shadow-xl border border-dark-600">
              <p className="font-medium">{user.username}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
              {user.walletAddress && (
                <p className="text-xs text-primary-400 mt-1">{user.walletAddress}</p>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-14 h-14 rounded-xl bg-dark-700 hover:bg-red-600 flex items-center justify-center transition-all duration-200 group"
          title="Logout"
        >
          <LogOut className="w-6 h-6 text-gray-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
