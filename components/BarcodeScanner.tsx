
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Camera, Zap, X } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const readerId = "barcode-scanner-reader";

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          setSelectedCameraId(devices[0].id);
        }
      })
      .catch((err) => {
        console.error("Error getting cameras:", err);
        setError("Could not access cameras. Please grant permission and refresh.");
      });
  }, []);

  useEffect(() => {
    if (selectedCameraId) {
      scannerRef.current = new Html5Qrcode(readerId);
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      const startScanner = async () => {
        try {
            if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop();
            }
            await scannerRef.current.start(
                selectedCameraId,
                config,
                (decodedText, decodedResult) => {
                    onScanSuccess(decodedText);
                },
                (errorMessage) => {
                    // console.warn(`QR error: ${errorMessage}`);
                }
            );
        } catch (err) {
            console.error("Scanner start error:", err);
            setError("Failed to start the scanner with the selected camera.");
        }
      };

      startScanner();

      return () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
        }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCameraId]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 rounded-lg overflow-hidden border-2 border-sky-500 shadow-2xl shadow-sky-500/30">
        <div className="p-4 bg-slate-800 flex justify-between items-center">
            <h3 className="font-orbitron text-lg text-sky-400 flex items-center gap-2"><Zap/> Scan Barcode</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
                <X size={24} className="text-white"/>
            </button>
        </div>
        
        <div id={readerId} className="w-full aspect-square md:aspect-video bg-black"></div>

        <div className="p-4 bg-slate-800/50">
            {error ? (
                <p className="text-red-400 text-center">{error}</p>
            ) : (
                <div className="flex items-center gap-2">
                    <Camera className="text-slate-400"/>
                    <select
                        value={selectedCameraId}
                        onChange={(e) => setSelectedCameraId(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        disabled={cameras.length === 0}
                    >
                        {cameras.length > 0 ? (
                            cameras.map((camera) => (
                                <option key={camera.id} value={camera.id}>
                                    {camera.label}
                                </option>
                            ))
                        ) : (
                            <option>No cameras found</option>
                        )}
                    </select>
                </div>
            )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[250px] h-[250px] border-4 border-dashed border-sky-400/50 rounded-lg animate-pulse"></div>
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 animate-glow"></div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;