
import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Card, Button } from '../components/UI';
import { DollarSign, Package, AlertTriangle, History, ArrowRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sale, Product, ActivityLog } from '../types';



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

import { db } from '../firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

export const DashboardPage: React.FC = () => {
    const { user, showToast } = useApp();
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [activity, setActivity] = useState<ActivityLog[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayTimestamp = Timestamp.fromDate(today);

                const salesQuery = query(collection(db, "users", user.uid, "sales"), where("timestamp", ">=", todayTimestamp));
                const salesSnapshot = await getDocs(salesQuery);
                const salesData = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
                setSales(salesData);

                const productsCollection = collection(db, "users", user.uid, "products");
                const productsSnapshot = await getDocs(productsCollection);
                const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
                setProducts(productsData);

                const activityQuery = query(collection(db, "users", user.uid, "activity"), where("timestamp", ">=", todayTimestamp));
                const activitySnapshot = await getDocs(activityQuery);
                const activityData = activitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
                setActivity(activityData);

            } catch (error) {
                showToast((error as Error).message, 'error');
            }
        };
        fetchData();
    }, [user, showToast]);

    const todaysRevenue = sales.reduce((acc, sale) => acc + sale.grandTotal, 0);
    const itemsSoldToday = sales.reduce((acc, sale) => acc + sale.items.reduce((iAcc, item) => iAcc + item.quantity, 0), 0);
    const lowStockItems = products.filter(p => p.quantity <= p.lowStockThreshold);

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
                            {activity.map(log => (
                                <div key={log.id} className="flex justify-between items-center text-sm">
                                    <p className="text-slate-300">{log.message}</p>
                                    <p className="text-slate-500">{log.timestamp.toDate().toLocaleTimeString()}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
};
