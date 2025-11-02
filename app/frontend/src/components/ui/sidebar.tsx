import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { MessageSquare, ShoppingBag, LogOut, User, Sparkles, Package, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-full px-4 py-6 hidden md:flex md:flex-col bg-dark-800 border-r border-dark-700 w-[240px] flex-shrink-0",
          className
        )}
        animate={{
          width: animate ? (open ? "240px" : "80px") : "240px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-dark-800 border-r border-dark-700 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-gray-200"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-dark-900 p-10 z-[200] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-gray-200 cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  return (
    <a
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        className
      )}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-gray-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </a>
  );
};

// Application-specific sidebar component
interface AppSidebarProps {
  activeView: 'chat' | 'transactions' | 'listings' | 'settings';
  setActiveView: (view: 'chat' | 'transactions' | 'listings' | 'settings') => void;
}

export const AppSidebar = ({ activeView, setActiveView }: AppSidebarProps) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const menuItems = [
    {
      id: 'chat' as const,
      icon: MessageSquare,
      label: 'Agent Chat',
      href: '#chat'
    },
    {
      id: 'transactions' as const,
      icon: ShoppingBag,
      label: 'Transactions',
      href: '#transactions'
    },
    {
      id: 'listings' as const,
      icon: Package,
      label: 'My Listings',
      href: '#listings'
    },
    {
      id: 'settings' as const,
      icon: Settings,
      label: 'Settings',
      href: '#settings'
    },
  ];

  const handleLinkClick = (id: 'chat' | 'transactions' | 'listings' | 'settings') => {
    setActiveView(id);
  };

  return (
    <Sidebar open={open} setOpen={setOpen} animate={true}>
      <SidebarBody className="justify-between gap-10 bg-dark-800 border-r border-dark-700">
        {/* Top Section - Logo and Menu */}
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-2 py-1 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{
                opacity: open ? 1 : 0,
                width: open ? "auto" : 0,
              }}
              className="font-bold text-xl bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap overflow-hidden"
            >
              Agora
            </motion.span>
          </div>

          {/* Menu Items */}
          <div className="mt-4 flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleLinkClick(item.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all group relative",
                    !open && "justify-center"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors",
                    isActive ? "text-primary-400" : "text-gray-400 group-hover:text-white"
                  )} />
                  <motion.span
                    animate={{
                      display: open ? "inline-block" : "none",
                      opacity: open ? 1 : 0,
                      width: open ? "auto" : 0,
                    }}
                    className={cn(
                      "text-sm whitespace-nowrap overflow-hidden transition-colors",
                      isActive ? "text-primary-400 font-medium" : "text-gray-300 group-hover:text-white"
                    )}
                  >
                    {item.label}
                  </motion.span>

                  {/* Tooltip for collapsed state */}
                  {!open && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-dark-700 rounded-lg text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl border border-dark-600">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section - User Profile and Logout */}
        <div className="flex flex-col gap-2">
          {/* User Profile */}
          {user && (
            <div className="relative group">
              <div className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-dark-600 transition-all",
                !open && "justify-center"
              )}>
                <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-300" />
                </div>
                <motion.div
                  animate={{
                    display: open ? "block" : "none",
                    opacity: open ? 1 : 0,
                    width: open ? "auto" : 0,
                  }}
                  className="flex flex-col min-w-0 overflow-hidden"
                >
                  <p className="text-sm font-medium text-white truncate">{user.username}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </motion.div>
              </div>

              {/* Tooltip for collapsed state */}
              {!open && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-dark-700 rounded-lg text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 z-[100] shadow-xl border border-dark-600">
                  <p className="font-medium">{user.username}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  {user.walletAddress && (
                    <p className="text-xs text-primary-400 mt-1 truncate">{user.walletAddress}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-red-600/20 transition-all group relative",
              !open && "justify-center"
            )}
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-400 flex-shrink-0 transition-colors" />
            <motion.span
              animate={{
                display: open ? "inline-block" : "none",
                opacity: open ? 1 : 0,
                width: open ? "auto" : 0,
              }}
              className="text-sm text-gray-300 group-hover:text-red-400 whitespace-nowrap overflow-hidden transition-colors"
            >
              Logout
            </motion.span>

            {/* Tooltip for collapsed state */}
            {!open && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-dark-700 rounded-lg text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl border border-dark-600">
                Logout
              </div>
            )}
          </button>
        </div>
      </SidebarBody>
    </Sidebar>
  );
};
