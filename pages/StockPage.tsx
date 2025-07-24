
import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { useApp } from '../AppContext';
import { Card, Button, Input, Modal } from '../components/UI';
import { Plus, Search, Edit, Trash2, ScanLine } from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data
const MOCK_PRODUCTS: Product[] = [
    { id: 'p1', name: 'Cosmic Coffee', barcode: '123456789', price: 3.50, quantity: 8, lowStockThreshold: 10 },
    { id: 'p2', name: 'Stardust Donut', barcode: '987654321', price: 2.50, quantity: 25, lowStockThreshold: 15 },
    { id: 'p3', name: 'Galaxy Muffin', barcode: '112233445', price: 3.00, quantity: 4, lowStockThreshold: 5 },
    { id: 'p4', name: 'Nebula Nectar', barcode: '556677889', price: 4.75, quantity: 30, lowStockThreshold: 10 },
    { id: 'p5', name: 'Meteor Munchies', barcode: '998877665', price: 5.20, quantity: 0, lowStockThreshold: 5 },
];

const StockItemCard: React.FC<{ product: Product, onEdit: (p: Product) => void, onDelete: (p: Product) => void }> = ({ product, onEdit, onDelete }) => {
    const stockLevel = product.quantity;
    const lowThreshold = product.lowStockThreshold;
    let stockStatusColor = 'text-green-400';
    if (stockLevel <= lowThreshold) stockStatusColor = 'text-yellow-400';
    if (stockLevel === 0) stockStatusColor = 'text-red-500';

    return (
        <Card className="p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
            <div>
                <h3 className="font-orbitron text-lg text-white truncate">{product.name}</h3>
                <p className="text-sm text-slate-400">Barcode: {product.barcode}</p>
                <p className="text-2xl font-bold text-sky-400 mt-2">${product.price.toFixed(2)}</p>
            </div>
            <div className="mt-4">
                <p className={`text-lg font-semibold ${stockStatusColor}`}>
                    {product.quantity} <span className="text-sm font-normal text-slate-400">in stock</span>
                </p>
                <div className="flex gap-2 mt-2">
                    <Button variant="secondary" className="w-full !py-1" onClick={() => onEdit(product)}><Edit size={16}/> Edit</Button>
                    <Button variant="danger" className="w-full !py-1" onClick={() => onDelete(product)}><Trash2 size={16}/> Delete</Button>
                </div>
            </div>
        </Card>
    );
};

export const StockPage: React.FC = () => {
    const { showToast } = useApp();
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const filteredProducts = useMemo(() =>
        products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode.includes(searchTerm)
        ), [products, searchTerm]);

    const handleOpenModal = (product: Product | null = null) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSaveProduct = (productData: Omit<Product, 'id'>) => {
        if (editingProduct) {
            // Edit
            const updatedProduct = { ...editingProduct, ...productData };
            setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
            showToast('Product updated successfully!', 'success');
        } else {
            // Add
            const newProduct: Product = { id: `p${Date.now()}`, ...productData };
            setProducts([newProduct, ...products]);
            showToast('Product added successfully!', 'success');
        }
        handleCloseModal();
    };

    const handleDeleteProduct = (product: Product) => {
        if(window.confirm(`Are you sure you want to delete ${product.name}?`)) {
            setProducts(products.filter(p => p.id !== product.id));
            showToast(`${product.name} has been deleted.`, 'info');
        }
    }

    const handleScanSuccess = (decodedText: string) => {
        if(isModalOpen && editingProduct) {
           setEditingProduct({...editingProduct, barcode: decodedText });
        } else if (isModalOpen) {
            // How to set this in the form? The form is inside the modal. Pass a setter.
        }
        setIsScannerOpen(false);
        showToast(`Barcode Scanned: ${decodedText}`, 'success');
    }

    const ProductModal: React.FC = () => {
        const [formData, setFormData] = useState<Omit<Product, 'id'>>({
            name: editingProduct?.name || '',
            barcode: editingProduct?.barcode || '',
            price: editingProduct?.price || 0,
            quantity: editingProduct?.quantity || 0,
            lowStockThreshold: editingProduct?.lowStockThreshold || 5
        });

        useEffect(() => {
            // This is a bit of a hack to get the scanned barcode into the form.
            // A better way would be to lift the form state up or use a context.
            if(editingProduct?.barcode) {
                setFormData(f => ({...f, barcode: editingProduct.barcode}));
            }
        }, [editingProduct?.barcode])

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value, type } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: type === 'number' ? parseFloat(value) : value
            }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            handleSaveProduct(formData);
        };

        return (
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProduct ? 'Edit Product' : 'Add New Product'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Product Name</label>
                        <Input name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Barcode</label>
                        <div className="flex gap-2">
                             <Input name="barcode" value={formData.barcode} onChange={handleChange} required />
                             <Button type="button" onClick={() => setIsScannerOpen(true)}><ScanLine/></Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Price</label>
                            <Input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Quantity</label>
                            <Input name="quantity" type="number" value={formData.quantity} onChange={handleChange} required />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Low Stock Threshold</label>
                        <Input name="lowStockThreshold" type="number" value={formData.lowStockThreshold} onChange={handleChange} required />
                    </div>
                    <Button type="submit" className="w-full">{editingProduct ? 'Save Changes' : 'Add Product'}</Button>
                </form>
            </Modal>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="font-orbitron text-3xl text-white">Stock Management</h1>
                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative flex-grow">
                        <Input
                            type="text"
                            placeholder="Search by name or barcode..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    </div>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        <span className="hidden sm:inline">Add Product</span>
                    </Button>
                </div>
            </div>

            <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            >
                <AnimatePresence>
                {filteredProducts.map(product => (
                    <motion.div layout key={product.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                        <StockItemCard product={product} onEdit={handleOpenModal} onDelete={handleDeleteProduct} />
                    </motion.div>
                ))}
                </AnimatePresence>
            </motion.div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-slate-400">No products found. Try adjusting your search or add a new product.</p>
                </div>
            )}
            
            <ProductModal/>
            
            {isScannerOpen && <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />}
        </div>
    );
};
