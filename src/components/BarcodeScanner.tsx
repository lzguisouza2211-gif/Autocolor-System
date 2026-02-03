import React, { useRef, useEffect } from 'react';
import Quagga from 'quagga';


interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}


const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onClose }) => {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: videoRef.current,
        constraints: {
          facingMode: 'environment',
        },
      },
      decoder: {
        readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'upc_reader', 'upc_e_reader'],
      },
      locate: true,
    }, (err) => {
      if (err) {
        alert('Erro ao acessar câmera: ' + err);
        onClose();
        return;
      }
      Quagga.start();
    });

    Quagga.onDetected((data) => {
      if (data && data.codeResult && data.codeResult.code) {
        onDetected(data.codeResult.code);
        Quagga.stop();
        Quagga.offDetected();
      }
    });

    return () => {
      Quagga.stop();
      Quagga.offDetected();
    };
  }, [onDetected, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-[70]">
      <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4">
        <h2 className="text-lg font-bold mb-3 text-center">Leitor de Código de Barras</h2>
        <div ref={videoRef} className="w-full rounded mb-4 bg-black" style={{ aspectRatio: '16/9' }} />
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
