import React, { useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();
    const startScanner = async () => {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) throw new Error('Nenhuma câmera encontrada');
        await codeReader.current!.decodeFromVideoDevice(
          videoInputDevices[0].deviceId,
          videoRef.current!,
          (result) => {
            if (result) {
              onDetected(result.getText());
              onClose();
            }
          }
        );
      } catch (e) {
        alert('Erro ao acessar câmera: ' + e);
        onClose();
      }
    };
    startScanner();
    return () => {
      // Cleanup da câmera no desmonte do componente
    };
  }, [onDetected, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
      <video ref={videoRef} className="w-full max-w-md rounded shadow-lg" autoPlay muted playsInline />
      <button onClick={onClose} className="mt-4 bg-red-600 text-white px-4 py-2 rounded">Fechar</button>
    </div>
  );
};

export default BarcodeScanner;
