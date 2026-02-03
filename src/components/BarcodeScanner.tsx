import React, { useRef, useEffect } from 'react';
import Quagga from 'quagga';


interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}


const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onClose }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const detectionCountRef = useRef<{ [key: string]: number }>({});

  // Valida o dígito verificador de códigos EAN-13 e UPC
  const isValidBarcode = (code: string): boolean => {
    if (!code || (code.length !== 13 && code.length !== 12 && code.length !== 8)) {
      return false;
    }

    const digits = code.split('').map(Number);
    if (digits.some(isNaN)) return false;

    const checkDigit = digits.pop()!;
    let sum = 0;

    digits.forEach((digit, index) => {
      sum += digit * (index % 2 === 0 ? 1 : 3);
    });

    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
  };

  useEffect(() => {
    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: videoRef.current,
        constraints: {
          facingMode: 'environment',
          width: { min: 640, ideal: 1280 },
          height: { min: 480, ideal: 720 },
        },
      },
      decoder: {
        readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'upc_reader', 'upc_e_reader'],
        multiple: false,
      },
      locate: true,
      locator: {
        patchSize: 'medium',
        halfSample: true,
      },
      numOfWorkers: 4,
      frequency: 10,
    }, (err: Error | null) => {
      if (err) {
        alert('Erro ao acessar câmera: ' + err);
        onClose();
        return;
      }
      Quagga.start();
    });

    Quagga.onDetected((data: any) => {
      if (data && data.codeResult && data.codeResult.code) {
        const code = data.codeResult.code;
        const quality = data.codeResult.quality || 0;
        
        // Validações de qualidade
        if (quality < 75) return;
        if (!isValidBarcode(code)) return; // Valida dígito verificador
        
        // Conta quantas vezes o mesmo código foi detectado
        detectionCountRef.current[code] = (detectionCountRef.current[code] || 0) + 1;
        
        // Só aceita o código após 3 detecções consecutivas
        if (detectionCountRef.current[code] >= 3) {
          onDetected(code);
          Quagga.stop();
          Quagga.offDetected();
        }
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
