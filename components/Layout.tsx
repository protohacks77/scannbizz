
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, BarChart2, Users, Settings, LogOut } from 'lucide-react';
import { useApp } from '../AppContext';
import { AnimatePresence, motion } from 'framer-motion';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Stock', path: '/stock', icon: Package },
  { name: 'Sell', path: '/sell', icon: ShoppingCart },
  { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const NavItem: React.FC<{ item: typeof navItems[0], isMobile?: boolean }> = ({ item, isMobile }) => {
    const location = useLocation();
    const isActive = location.pathname === item.path;
    return (
        <NavLink to={item.path} className="group transition-colors duration-200">
            <div className={`flex items-center gap-3 rounded-md p-3 ${isMobile ? 'flex-col justify-center text-xs gap-1' : ''} ${isActive ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}>
                <item.icon className={`h-5 w-5 ${isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span className={isMobile && !isActive ? 'text-slate-500' : ''}>{item.name}</span>
            </div>
        </NavLink>
    );
};

const Sidebar: React.FC = () => {
    const { user, logout } = useApp();
    return (
        <aside className="hidden md:flex w-64 flex-col bg-slate-900/70 backdrop-blur-md border-r border-slate-800 p-4">
            <div className="font-orbitron text-2xl text-white font-bold mb-8 flex items-center gap-2">
                <ShoppingCart className="text-sky-400"/> ScannBizz
            </div>
            <nav className="flex flex-col gap-2 flex-grow">
                {navItems.map(item => <NavItem key={item.path} item={item} />)}
            </nav>
            <div className="mt-auto">
                <div className="p-3 mb-2">
                    <p className="text-sm font-medium text-white">{user?.storeInfo.name}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <button onClick={logout} className="w-full flex items-center gap-3 rounded-md p-3 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors duration-200">
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}

const BottomNav: React.FC = () => (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 grid grid-cols-5 gap-1 p-1">
        {navItems.map(item => <NavItem key={item.path} item={item} isMobile />)}
    </nav>
);

const Header: React.FC = () => {
    const location = useLocation();
    const { user } = useApp();
    const pageTitle = navItems.find(item => item.path === location.pathname)?.name || 'Dashboard';
    
    return (
        <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center md:hidden sticky top-0 z-10">
            <h1 className="font-orbitron text-xl text-white">{pageTitle}</h1>
            <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.storeInfo.name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
        </header>
    )
}

export const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AnimatePresence mode="wait">
        <motion.main
            key={useLocation().pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-grow p-4 md:p-8 overflow-auto"
        >
            {children}
        </motion.main>
    </AnimatePresence>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex h-screen bg-slate-950 text-slate-200">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header/>
                <div className="flex-grow overflow-y-auto pb-20 md:pb-0">
                    {children}
                </div>
                <BottomNav />
            </div>
        </div>
    );
};
