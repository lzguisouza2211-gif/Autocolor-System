import React, { useRef, useEffect } from 'react';
import Quagga from 'quagga';


interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}


const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onClose }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const detectionCountRef = useRef<{ [key: string]: number }>({});

  // Remove caracteres inesperados e limpa o código
  const normalizeBarcode = (code: string): string => {
    if (!code) return '';
    // Remove espaços, hífens, caracteres especiais e mantém apenas números
    return code.replace(/[^\d]/g, '').trim();
  };

  // Identifica o tipo/padrão do código de barras
  const identifyBarcodeType = (code: string): string => {
    const cleanCode = normalizeBarcode(code);
    const length = cleanCode.length;

    if (length === 8) return 'EAN-8';
    if (length === 12) return 'UPC-A';
    if (length === 13) return 'EAN-13';
    if (length === 14) return 'GTIN-14 (ITF-14)';
    if (length > 13) return 'Code-128';
    return 'Desconhecido';
  };

  // Valida o dígito verificador (compatível com EAN-13, EAN-8, UPC-A)
  const isValidBarcode = (code: string): boolean => {
    const cleanCode = normalizeBarcode(code);
    
    // Verifica se contém apenas dígitos
    if (!/^\d+$/.test(cleanCode)) {
      console.warn('❌ Código contém caracteres não numéricos:', code);
      return false;
    }

    // Aceita comprimentos válidos: 8 (EAN-8), 12 (UPC-A), 13 (EAN-13), 14 (GTIN-14)
    const validLengths = [8, 12, 13, 14];
    if (!validLengths.includes(cleanCode.length)) {
      console.warn(`❌ Comprimento inválido: ${cleanCode.length}. Esperado: 8, 12, 13 ou 14 dígitos`);
      return false;
    }

    // Code-128 não usa dígito verificador padrão, apenas valida por comprimento
    if (cleanCode.length > 14) {
      console.log('✅ Code-128 válido por comprimento');
      return true;
    }

    // Calcula e valida o dígito verificador para EAN/UPC
    const digits = cleanCode.split('').map(Number);
    const checkDigit = digits.pop()!;
    let sum = 0;

    digits.forEach((digit, index) => {
      sum += digit * (index % 2 === 0 ? 1 : 3);
    });

    const calculatedCheck = (10 - (sum % 10)) % 10;
    const isValid = calculatedCheck === checkDigit;

    if (!isValid) {
      console.warn(
        `❌ Dígito verificador inválido. Esperado: ${calculatedCheck}, Recebido: ${checkDigit}`
      );
    } else {
      console.log(
        `✅ ${identifyBarcodeType(cleanCode)} válido: ${cleanCode}`
      );
    }

    return isValid;
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
        // Limpa e normaliza o código
        const rawCode = data.codeResult.code;
        const cleanCode = normalizeBarcode(rawCode);
        const quality = data.codeResult.quality || 0;
        
        if (!cleanCode) {
          console.warn('⚠️ Código vazio após limpeza');
          return;
        }

        // Validações de qualidade
        if (quality < 75) {
          console.warn(`⚠️ Qualidade baixa: ${quality.toFixed(1)}%`);
          return;
        }

        // Valida se é um código de barras legítimo
        if (!isValidBarcode(cleanCode)) {
          return;
        }
        
        // Conta quantas vezes o mesmo código foi detectado
        detectionCountRef.current[cleanCode] = (detectionCountRef.current[cleanCode] || 0) + 1;
        const detectionCount = detectionCountRef.current[cleanCode];
        
        console.log(
          `🔍 ${identifyBarcodeType(cleanCode)} detectado: ${cleanCode} (${detectionCount}/3)`
        );
        
        // Só aceita o código após 3 detecções consecutivas
        if (detectionCount >= 3) {
          console.log(`✅ Código aceito e enviado: ${cleanCode}`);
          onDetected(cleanCode);
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
