
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, SaleItem } from '../types';
import { useApp } from '../AppContext';
import { Card, Button, Input, Modal } from '../components/UI';
import { ScanLine, Trash2, X, ShoppingCart, Send } from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';
import { generateUpsellSuggestion } from '../services/geminiService';

// Mock Data
const MOCK_PRODUCTS: Product[] = [
    { id: 'p1', name: 'Cosmic Coffee', barcode: '123456789', price: 3.50, quantity: 8, lowStockThreshold: 10 },
    { id: 'p2', name: 'Stardust Donut', barcode: '987654321', price: 2.50, quantity: 25, lowStockThreshold: 15 },
    { id: 'p3', name: 'Galaxy Muffin', barcode: '112233445', price: 3.00, quantity: 4, lowStockThreshold: 5 },
    { id: 'p4', name: 'Nebula Nectar', barcode: '556677889', price: 4.75, quantity: 30, lowStockThreshold: 10 },
    { id: 'p5', name: 'Meteor Munchies', barcode: '998877665', price: 5.20, quantity: 0, lowStockThreshold: 5 },
    { id: 'p6', name: 'Butter', barcode: '0001', price: 1.50, quantity: 50, lowStockThreshold: 10 },
    { id: 'p7', name: 'Soda', barcode: '0002', price: 2.00, quantity: 100, lowStockThreshold: 20 },
];

const FinalizeSaleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  receiptItems: SaleItem[];
  grandTotal: number;
  onFinalize: (payload: { items: SaleItem[]; grandTotal: number; paymentMethod: 'Cash' | 'Card'; customerPhone: string | null; }) => void;
  isProcessing: boolean;
}> = ({ isOpen, onClose, receiptItems, grandTotal, onFinalize, isProcessing }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Cash');

  const formatReceiptForWhatsApp = (): string => {
    let message = "Thank you for your purchase from ScannBizz!\n\n*Your Receipt:*\n";
    receiptItems.forEach(item => {
      message += `\n- ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`;
    });
    message += `\n\n*Total: $${grandTotal.toFixed(2)}*`;
    return encodeURIComponent(message);
  };

  const handleProcessSale = () => {
    if (phoneNumber) {
      const formattedMessage = formatReceiptForWhatsApp();
      const cleanPhoneNumber = phoneNumber.replace(/[^0-9]/g, ''); 
      const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${formattedMessage}`;
      window.open(whatsappUrl, '_blank');
    }

    const payload = {
      items: receiptItems,
      grandTotal,
      paymentMethod,
      customerPhone: phoneNumber || null,
    };
    onFinalize(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Finalize Sale">
      <div className="space-y-6">
        <p className="text-5xl font-orbitron text-center text-sky-400">${grandTotal.toFixed(2)}</p>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setPaymentMethod('Cash')} variant={paymentMethod === 'Cash' ? 'primary' : 'secondary'} className="!py-3" disabled={isProcessing}>Cash</Button>
              <Button onClick={() => setPaymentMethod('Card')} variant={paymentMethod === 'Card' ? 'primary' : 'secondary'} className="!py-3" disabled={isProcessing}>Card</Button>
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
            Send WhatsApp Receipt (Optional)
          </label>
          <div className="relative">
             <Input id="phone" type="tel" placeholder="Enter customer phone number..." value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="pl-4" disabled={isProcessing}/>
          </div>
        </div>

        <Button onClick={handleProcessSale} className="w-full !py-4 text-lg" isLoading={isProcessing}>
          {phoneNumber ? <>Record Sale & Send Receipt <Send size={18}/></> : 'Record Sale'}
        </Button>
      </div>
    </Modal>
  );
};


export const SellPage: React.FC = () => {
    const { showToast, user } = useApp();
    const [receipt, setReceipt] = useState<SaleItem[]>([]);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [isProcessingSale, setIsProcessingSale] = useState(false);
    const [upsellSuggestion, setUpsellSuggestion] = useState('');

    const findProductByBarcode = (barcode: string): Product | undefined => {
        return MOCK_PRODUCTS.find(p => p.barcode === barcode);
    };

    const addToReceipt = (product: Product) => {
        setReceipt(currentReceipt => {
            const existingItem = currentReceipt.find(item => item.productId === product.id);
            if (existingItem) {
                return currentReceipt.map(item =>
                    item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...currentReceipt, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
        });
    };

    const handleScanSuccess = useCallback((decodedText: string) => {
        const product = findProductByBarcode(decodedText);
        if (product) {
            if (product.quantity > 0) {
                addToReceipt(product);
                showToast(`${product.name} added to receipt.`, 'success');
            } else {
                showToast(`${product.name} is out of stock!`, 'error');
            }
        } else {
            showToast(`Product with barcode ${decodedText} not found.`, 'error');
        }
    }, [showToast]);

    const updateQuantity = (productId: string, newQuantity: number) => {
        setReceipt(currentReceipt => {
            if (newQuantity <= 0) {
                return currentReceipt.filter(item => item.productId !== productId);
            }
            return currentReceipt.map(item =>
                item.productId === productId ? { ...item, quantity: newQuantity } : item
            );
        });
    };
    
    const grandTotal = useMemo(() => receipt.reduce((total, item) => total + (item.price * item.quantity), 0), [receipt]);
    
    const clearReceipt = () => {
        setReceipt([]);
        setUpsellSuggestion('');
        showToast('Receipt cleared.', 'info');
    };

    const handleFinalizeSale = async (payload: { items: SaleItem[]; grandTotal: number; paymentMethod: 'Cash' | 'Card'; customerPhone: string | null; }) => {
        if (!user) {
            showToast('You must be logged in to process a sale.', 'error');
            return;
        }
        setIsProcessingSale(true);
        try {
            const response = await fetch('/.netlify/functions/processSale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, userId: user.uid })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
                throw new Error(errorData.error || 'Failed to process sale.');
            }

            const result = await response.json();
            console.log('Sale processed:', result);
            
            clearReceipt();
            showToast(`Sale of $${payload.grandTotal.toFixed(2)} recorded successfully!`, 'success');
            setIsFinalizeModalOpen(false);

        } catch (error) {
            showToast((error as Error).message, 'error');
        } finally {
            setIsProcessingSale(false);
        }
    };

    useEffect(() => {
        if (receipt.length > 0) {
            generateUpsellSuggestion(receipt).then(setUpsellSuggestion);
        } else {
            setUpsellSuggestion('');
        }
    }, [receipt]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <div className="lg:col-span-2">
                <Card className="p-6 h-full flex flex-col">
                    <h2 className="font-orbitron text-2xl text-white mb-4">Live Receipt</h2>
                    {receipt.length === 0 ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-400 p-8 border-2 border-dashed border-slate-700 rounded-lg">
                           <ShoppingCart size={48} className="mb-4 text-slate-600"/>
                           <p className="font-semibold text-lg">Ready to make a sale!</p>
                           <p>Scan a product barcode or add an item manually.</p>
                        </div>
                    ) : (
                        <div className="flex-grow space-y-2 overflow-y-auto pr-2">
                           {receipt.map(item => (
                               <div key={item.productId} className="flex items-center gap-4 bg-slate-800/60 p-3 rounded-md">
                                   <div className="flex-grow">
                                       <p className="font-semibold text-white">{item.name}</p>
                                       <p className="text-sm text-slate-400">${item.price.toFixed(2)} each</p>
                                   </div>
                                   <div className="flex items-center gap-2">
                                       <Input type="number" value={item.quantity} onChange={e => updateQuantity(item.productId, parseInt(e.target.value))} className="w-16 text-center !py-1" />
                                       <Button variant="danger" className="!p-2" onClick={() => updateQuantity(item.productId, 0)}><Trash2 size={16}/></Button>
                                   </div>
                                   <p className="w-20 text-right font-semibold text-sky-400 text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                               </div>
                           ))}
                        </div>
                    )}
                    {upsellSuggestion && (
                         <div className="mt-4 p-3 bg-sky-500/10 border border-sky-500/30 rounded-lg text-center animate-pulse">
                             <p className="text-sky-300 font-medium">{upsellSuggestion}</p>
                         </div>
                    )}
                </Card>
            </div>
            <div className="lg:col-span-1">
                 <Card className="p-6 space-y-6 sticky top-8">
                     <h2 className="font-orbitron text-2xl text-white">Actions</h2>
                     <Button onClick={() => setIsScannerOpen(true)} className="w-full !py-4 text-lg">
                         <ScanLine className="mr-2"/> Open Scanner
                     </Button>
                     <div className="text-center space-y-2">
                         <p className="text-slate-400 font-semibold">GRAND TOTAL</p>
                         <p className="font-orbitron text-5xl text-sky-400">${grandTotal.toFixed(2)}</p>
                     </div>
                     <div className="space-y-2">
                        <Button variant="primary" onClick={() => setIsFinalizeModalOpen(true)} className="w-full !py-3" disabled={receipt.length === 0}>
                            Finalize Sale
                        </Button>
                        <Button variant="danger" onClick={clearReceipt} className="w-full !py-3" disabled={receipt.length === 0}>
                            Clear Receipt
                        </Button>
                     </div>
                 </Card>
            </div>

            {isScannerOpen && <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />}
            
            <FinalizeSaleModal
                isOpen={isFinalizeModalOpen}
                onClose={() => !isProcessingSale && setIsFinalizeModalOpen(false)}
                receiptItems={receipt}
                grandTotal={grandTotal}
                onFinalize={handleFinalizeSale}
                isProcessing={isProcessingSale}
            />
        </div>
    );
};
