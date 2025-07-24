
import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Card, Button } from '../components/UI';
import { DollarSign, Package, AlertTriangle, History, ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sale, Product, ActivityLog } from '../types';

// Mock Data - In a real app, this would come from a Firestore hook
const MOCK_SALES: Sale[] = [
    { id: '1', items: [{ productId: 'p1', name: 'Cosmic Coffee', price: 3.50, quantity: 2 }], grandTotal: 7.00, paymentMethod: 'Card', timestamp: new Date(Date.now() - 3600000) },
    { id: '2', items: [{ productId: 'p2', name: 'Stardust Donut', price: 2.50, quantity: 4 }], grandTotal: 10.00, paymentMethod: 'Cash', timestamp: new Date(Date.now() - 7200000) },
];
const MOCK_PRODUCTS: Product[] = [
    { id: 'p1', name: 'Cosmic Coffee', barcode: '123', price: 3.50, quantity: 8, lowStockThreshold: 10 },
    { id: 'p3', name: 'Galaxy Muffin', barcode: '456', price: 3.00, quantity: 4, lowStockThreshold: 5 },
];
const MOCK_ACTIVITY: ActivityLog[] = [
    { id: 'a1', message: 'Sale of $7.00 recorded.', timestamp: new Date(Date.now() - 3600000)},
    { id: 'a2', message: 'Product "Stardust Donut" quantity updated.', timestamp: new Date(Date.now() - 4800000)},
    { id: 'a3', message: 'Sale of $10.00 recorded.', timestamp: new Date(Date.now() - 7200000)},
];


const ClockWidget = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="font-orbitron text-right">
            <p className="text-4xl text-sky-400">{time.toLocaleTimeString()}</p>
            <p className="text-slate-400">{time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
    );
};

export const DashboardPage: React.FC = () => {
    const { user } = useApp();
    const todaysRevenue = MOCK_SALES.reduce((acc, sale) => acc + sale.grandTotal, 0);
    const itemsSoldToday = MOCK_SALES.reduce((acc, sale) => acc + sale.items.reduce((iAcc, item) => iAcc + item.quantity, 0), 0);
    const lowStockItems = MOCK_PRODUCTS.filter(p => p.quantity <= p.lowStockThreshold);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="font-orbitron text-4xl text-white">Welcome back,</h1>
                    <h2 className="font-orbitron text-2xl text-sky-400">{user?.storeInfo.name}</h2>
                </div>
                <ClockWidget />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                <motion.div variants={itemVariants}>
                    <Card className="p-6 flex items-center gap-4">
                        <DollarSign className="w-12 h-12 text-green-400 bg-green-500/10 p-3 rounded-full"/>
                        <div>
                            <p className="text-slate-400 text-sm">Today's Revenue</p>
                            <p className="font-orbitron text-3xl text-white">${todaysRevenue.toFixed(2)}</p>
                        </div>
                    </Card>
                </motion.div>
                <motion.div variants={itemVariants}>
                    <Card className="p-6 flex items-center gap-4">
                        <Package className="w-12 h-12 text-blue-400 bg-blue-500/10 p-3 rounded-full"/>
                        <div>
                            <p className="text-slate-400 text-sm">Items Sold Today</p>
                            <p className="font-orbitron text-3xl text-white">{itemsSoldToday}</p>
                        </div>
                    </Card>
                </motion.div>
                <motion.div variants={itemVariants} className="lg:col-span-2">
                     <Card className="p-6 flex flex-col md:flex-row items-center gap-4 h-full">
                        <div className="flex-grow space-y-2 md:space-y-0 md:flex md:gap-4">
                           <Link to="/sell" className="w-full">
                                <Button className="w-full h-full text-lg !py-4" variant="primary">Start Selling <ArrowRight/></Button>
                           </Link>
                           <Link to="/stock" className="w-full">
                                <Button className="w-full h-full text-lg !py-4" variant="secondary">Add Stock <Plus/></Button>
                           </Link>
                        </div>
                    </Card>
                </motion.div>
            </motion.div>

            <motion.div 
                 variants={containerVariants}
                 initial="hidden"
                 animate="show"
                 className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
                {lowStockItems.length > 0 && (
                     <motion.div variants={itemVariants}>
                        <Card className="p-6">
                            <h3 className="font-orbitron text-xl text-yellow-400 flex items-center gap-2 mb-4"><AlertTriangle/> Low Stock Alerts</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {lowStockItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-md">
                                        <p className="text-white font-medium">{item.name}</p>
                                        <p className="text-yellow-400">Qty: <span className="font-bold">{item.quantity}</span> / {item.lowStockThreshold}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                )}
                <motion.div variants={itemVariants} className={lowStockItems.length === 0 ? 'lg:col-span-2' : ''}>
                    <Card className="p-6">
                        <h3 className="font-orbitron text-xl text-sky-400 flex items-center gap-2 mb-4"><History/> Recent Activity</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {MOCK_ACTIVITY.map(log => (
                                <div key={log.id} className="flex justify-between items-center text-sm">
                                    <p className="text-slate-300">{log.message}</p>
                                    <p className="text-slate-500">{log.timestamp.toLocaleTimeString()}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
};
