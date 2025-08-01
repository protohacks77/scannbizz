import React, { useState } from 'react';
import { Modal, Input, Button } from './UI';

interface ManualEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (barcode: string) => void;
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [barcode, setBarcode] = useState('');

    const handleAdd = () => {
        if (barcode) {
            onAdd(barcode);
            setBarcode('');
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manual Barcode Entry">
            <div className="space-y-4">
                <Input
                    type="text"
                    placeholder="Enter barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    autoFocus
                />
                <Button onClick={handleAdd} className="w-full">Add Product</Button>
            </div>
        </Modal>
    );
};

export default ManualEntryModal;
