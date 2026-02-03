import React, { useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const startScanner = async () => {
      try {
        // Parar qualquer leitor anterior
        if (codeReader.current) {
          await codeReader.current.reset();
        }

        codeReader.current = new BrowserMultiFormatReader();
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          throw new Error('Nenhuma câmera encontrada');
        }

        // Filtrar para pegar a câmera traseira (back) ou a primeira câmera disponível
        let deviceId = videoInputDevices[0].deviceId;
        const backCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        if (backCamera) {
          deviceId = backCamera.deviceId;
        }

        if (!isMountedRef.current) return;

        await codeReader.current.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result) => {
            if (result && isMountedRef.current) {
              onDetected(result.getText());
            }
          }
        );
      } catch (e) {
        if (isMountedRef.current) {
          alert('Erro ao acessar câmera: ' + (e instanceof Error ? e.message : String(e)));
          onClose();
        }
      }
    };

    startScanner();

    return () => {
      isMountedRef.current = false;
      const stopScanner = async () => {
        try {
          if (codeReader.current) {
            await codeReader.current.reset();
            codeReader.current = null;
          }
        } catch (e) {
          console.error('Erro ao parar scanner:', e);
        }
      };
      stopScanner();
    };
  }, [onDetected, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-[70]">
      <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4">
        <h2 className="text-lg font-bold mb-3 text-center">Leitor de Código de Barras</h2>
        <video 
          ref={videoRef} 
          className="w-full rounded mb-4 bg-black" 
          autoPlay 
          muted 
          playsInline 
          style={{ aspectRatio: '16/9' }}
        />
        <p className="text-center text-sm text-gray-600 mb-4">Aponte a câmera para o código de barras</p>
        <button 
          onClick={onClose} 
          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition"
        >
          Fechar Câmera
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;
