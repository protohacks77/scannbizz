
import React, { useState, useEffect, useRef } from 'react';
import { Sale, Product } from '../types';
import { Card, Button, Input } from '../components/UI';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts';
import { generateAnalyticsSummary } from '../services/geminiService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const processData = (sales: Sale[]) => {
    const dailyRevenue: { [key: string]: number } = {};
    const topProducts: { [key: string]: number } = {};

    sales.forEach(sale => {
        const date = sale.timestamp.toISOString().split('T')[0];
        dailyRevenue[date] = (dailyRevenue[date] || 0) + sale.grandTotal;
        sale.items.forEach(item => {
            topProducts[item.name] = (topProducts[item.name] || 0) + item.quantity;
        });
    });

    const dailyRevenueData = Object.entries(dailyRevenue).map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: parseFloat(revenue.toFixed(2))
    }));

    const topProductsData = Object.entries(topProducts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, sales]) => ({ name, sales }));
    
    return { dailyRevenueData, topProductsData };
};

const COLORS = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'];

import { useApp } from '../AppContext';

const ReportTemplate: React.FC<{ sales: Sale[], products: Product[], aiSummary: string | null, storeName: string }> = ({ sales, products, aiSummary, storeName }) => {
    const { dailyRevenueData, topProductsData } = processData(sales);
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.grandTotal, 0);

    return (
        <div className="bg-slate-800 p-8 text-white font-sans">
            <h1 className="font-orbitron text-3xl text-sky-400 mb-2">{storeName} - Sales Report</h1>
            <p className="text-slate-400 mb-6">Generated on {new Date().toLocaleDateString()}</p>
            <div className="mb-8 p-4 bg-slate-700/50 rounded-lg">
                <h2 className="font-orbitron text-xl text-sky-300 mb-2">AI-Powered Summary</h2>
                {aiSummary ? <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans">{aiSummary}</pre> : <p>Loading summary...</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-8">
                <div>
                     <h2 className="font-orbitron text-xl text-sky-300 mb-4">Daily Revenue (${totalRevenue.toFixed(2)})</h2>
                     <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={dailyRevenueData}>
                             <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                             <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${value}`} />
                             <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                         </BarChart>
                     </ResponsiveContainer>
                </div>
                <div>
                     <h2 className="font-orbitron text-xl text-sky-300 mb-4">Top Selling Products</h2>
                     <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                             <Pie data={topProductsData} dataKey="sales" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                                {topProductsData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                             </Pie>
                             <Tooltip />
                         </PieChart>
                     </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};


export const AnalyticsPage: React.FC = () => {
    const { user, showToast } = useApp();
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [chartType, setChartType] = useState<'Bar' | 'Area' | 'Line'>('Bar');
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const salesCollection = collection(db, "users", user.uid, "sales");
                const salesSnapshot = await getDocs(salesCollection);
                const salesData = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
                setSales(salesData);

                const productsCollection = collection(db, "users", user.uid, "products");
                const productsSnapshot = await getDocs(productsCollection);
                const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
                setProducts(productsData);
            } catch (error) {
                showToast((error as Error).message, 'error');
            }
        };
        fetchData();
    }, [user, showToast]);

    const { dailyRevenueData, topProductsData } = processData(sales);

    const generateReport = async () => {
        setIsGenerating(true);
        setAiSummary(null); // Clear previous summary
    
        // First, get AI summary
        const summary = await generateAnalyticsSummary(sales, products);
        setAiSummary(summary);
    
        // This timeout ensures the state update has rendered the summary to the DOM
        // before we try to capture it with html2canvas.
        setTimeout(async () => {
            if (reportRef.current) {
                try {
                    const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#1e293b' });
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({
                        orientation: 'landscape',
                        unit: 'px',
                        format: [canvas.width, canvas.height]
                    });
                    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                    pdf.save(`ScannBizz_Report_${new Date().toISOString().split('T')[0]}.pdf`);
                } catch (error) {
                    console.error("Error generating PDF:", error);
                } finally {
                    setIsGenerating(false);
                }
            } else {
                 setIsGenerating(false);
            }
        }, 500);
    };
    
    const commonChartElements = [
        <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#334155" />,
        <XAxis key="xaxis" dataKey="date" stroke="#94a3b8" fontSize={12} />,
        <YAxis key="yaxis" stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${value}`} />,
        <Tooltip key="tooltip" contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} labelStyle={{color: '#e2e8f0'}}/>,
        <Legend key="legend" wrapperStyle={{color: '#e2e8f0'}}/>
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="font-orbitron text-3xl text-white">Analytics</h1>
                <div className="flex items-center gap-2">
                    <Input type="date" defaultValue={new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]} />
                    <span className="text-slate-400">to</span>
                    <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                     <Button onClick={generateReport} isLoading={isGenerating}>
                        {isGenerating ? 'Generating...' : 'Generate & Export PDF'}
                    </Button>
                </div>
            </div>

            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-orbitron text-xl text-sky-400">Daily Revenue</h2>
                    <div className="flex gap-1 bg-slate-700 p-1 rounded-md">
                        {(['Bar', 'Area', 'Line'] as const).map(type => (
                            <button key={type} onClick={() => setChartType(type)} className={`px-3 py-1 text-sm rounded ${chartType === type ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                    {chartType === 'Bar' ? (
                        <BarChart data={dailyRevenueData}>
                            {commonChartElements}
                            <Bar dataKey="revenue" fill="#0ea5e9" />
                        </BarChart>
                    ) : chartType === 'Area' ? (
                        <AreaChart data={dailyRevenueData}>
                            {commonChartElements}
                            <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
                        </AreaChart>
                    ) : (
                        <LineChart data={dailyRevenueData}>
                            {commonChartElements}
                            <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" dot={false} />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card className="p-6">
                    <h2 className="font-orbitron text-xl text-sky-400 mb-4">Top Selling Products</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                             <Pie data={topProductsData} dataKey="sales" nameKey="name" cx="50%" cy="50%" outerRadius={120} fill="#8884d8" label>
                                {topProductsData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                             </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}/>
                            <Legend/>
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
                 <Card className="p-6">
                    <h2 className="font-orbitron text-xl text-sky-400 mb-4">AI Summary Preview</h2>
                     <div className="h-[300px] overflow-y-auto p-4 bg-slate-800/50 rounded-lg">
                        {isGenerating && !aiSummary && <p className="animate-pulse text-slate-400">Generating intelligent summary with Gemini...</p>}
                        {aiSummary && <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans">{aiSummary}</pre>}
                        {!aiSummary && !isGenerating && <p className="text-slate-500">Click "Generate & Export PDF" to see an AI-powered summary of your sales data.</p>}
                     </div>
                </Card>
            </div>
            
            {/* Hidden div for PDF generation */}
            <div style={{ position: 'fixed', left: '-2000px', top: 0 }}>
                <div ref={reportRef} style={{ width: '1280px' }}>
                    <ReportTemplate sales={MOCK_SALES_HISTORY} products={MOCK_PRODUCTS} aiSummary={aiSummary} storeName={user?.storeInfo?.name || 'My Store'}/>
                </div>
            </div>
        </div>
    );
};
