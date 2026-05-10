import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { jsPDF } from 'jspdf';
import { supabase } from '../supabase';
import { useNavigate, useParams } from 'react-router-dom';

interface Customer {
  id: number;
  full_name: string;
  cpf: string | null;
  cnpj: string | null;
  phone: string | null;
  birth_date: string | null;
  zip_code: string | null;
  street: string | null;
  address_number: string | null;
  address_complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
}

interface CustomerForm {
  full_name: string;
  cpf: string;
  cnpj: string;
  phone: string;
  birth_date: string;
  zip_code: string;
  street: string;
  address_number: string;
  address_complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CustomerAccountOverview {
  customer_id: number;
  total_sales: number;
  total_paid: number;
  total_pending: number;
  pending_sales_count: number;
  last_sale_at: string | null;
}

interface CustomerSaleHistoryItem {
  sale_id: number;
  created_at: string;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: 'paid' | 'pending';
  paid_at: string | null;
}

interface CustomerSalesRow {
  id: number;
  total: number;
  paid_amount: number | null;
  created_at: string;
  payment_status: 'paid' | 'pending' | null;
  paid_at: string | null;
}

type FormMode = 'create' | 'edit' | 'view';
type CustomersPageMode = 'list' | 'create' | 'edit' | 'view';
type DocumentType = 'cpf' | 'cnpj';

interface CustomersProps {
  pageMode: CustomersPageMode;
}

const emptyForm: CustomerForm = {
  full_name: '',
  cpf: '',
  cnpj: '',
  phone: '',
  birth_date: '',
  zip_code: '',
  street: '',
  address_number: '',
  address_complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

const inputBaseClass =
  'w-full px-3 py-2 text-sm text-slate-900 bg-slate-100 border border-slate-300 rounded-lg placeholder:text-slate-500 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:bg-slate-200 disabled:text-slate-500';

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const maskCpf = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

const maskCnpj = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};

const maskPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const maskZipCode = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const normalizeState = (value: string) => value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();

const getDocumentValue = (customer: Pick<Customer, 'cpf' | 'cnpj'>) => customer.cnpj || customer.cpf || '-';

const normalizeAddressPart = (value: string | null | undefined) => {
  const normalizedValue = (value ?? '').trim();
  if (!normalizedValue || normalizedValue === '-') return '';
  return normalizedValue;
};

const formatCustomerAddress = (form: Pick<CustomerForm, 'street' | 'address_number' | 'address_complement' | 'neighborhood' | 'city' | 'state' | 'zip_code'>) => {
  const street = normalizeAddressPart(form.street);
  const number = normalizeAddressPart(form.address_number);
  const complement = normalizeAddressPart(form.address_complement);
  const neighborhood = normalizeAddressPart(form.neighborhood);
  const city = normalizeAddressPart(form.city);
  const state = normalizeAddressPart(form.state);
  const zipCode = normalizeAddressPart(form.zip_code);

  const streetWithNumber = street && number ? `${street}, ${number}` : street || (number ? `Nº ${number}` : '');
  const cityWithState = [city, state].filter(Boolean).join('/');
  const location = [neighborhood, cityWithState].filter(Boolean).join(' - ');
  const formattedAddress = [streetWithNumber, complement, location].filter(Boolean).join(' - ');

  if (!formattedAddress && !zipCode) return '-';
  if (!formattedAddress) return zipCode;
  return zipCode ? `${formattedAddress} (${zipCode})` : formattedAddress;
};

const normalizePaidAmount = (total: number, paidAmount: number | null | undefined, status: 'paid' | 'pending') => {
  if (status === 'paid') {
    return total;
  }

  const numericPaid = Number(paidAmount ?? 0);
  if (!Number.isFinite(numericPaid) || numericPaid < 0) {
    return 0;
  }

  return Math.min(total, numericPaid);
};

const formatCurrency = (value: number) =>
  Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const sanitizeFileName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

const COMPANY_PROFILE = {
  fantasyName: 'AutoColor System',
  cnpj: '62.712.139/0001-15',
  phone: '(35) 99745-9490',
  address: 'Rua Manoel Jesuino de Carvalho - 1123',
  cityState: 'Ouro Fino/MG',
};

const loadImageAsDataUrl = async (imagePath: string): Promise<string | null> => {
  try {
    const response = await fetch(imagePath);
    if (!response.ok) return null;

    const imageBlob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onloadend = () => resolve(String(fileReader.result));
      fileReader.onerror = () => reject(new Error('Falha ao converter imagem para base64.'));
      fileReader.readAsDataURL(imageBlob);
    });
  } catch {
    return null;
  }
};

const Customers: React.FC<CustomersProps> = ({ pageMode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const routeCustomerId = id ? Number(id) : null;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<FormMode>(pageMode === 'create' ? 'create' : pageMode === 'edit' ? 'edit' : 'view');
  const [documentType, setDocumentType] = useState<DocumentType>('cpf');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [settlingSaleId, setSettlingSaleId] = useState<number | null>(null);
  const [abatementValues, setAbatementValues] = useState<Record<number, string>>({});
  const [totalAbatementValue, setTotalAbatementValue] = useState('');
  const [settlingTotalAbatement, setSettlingTotalAbatement] = useState(false);
  const [settlingAllSales, setSettlingAllSales] = useState(false);
  const [showSettleAllConfirmModal, setShowSettleAllConfirmModal] = useState(false);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState('');
  const [customerOverview, setCustomerOverview] = useState<CustomerAccountOverview | null>(null);
  const [customerSalesHistory, setCustomerSalesHistory] = useState<CustomerSaleHistoryItem[]>([]);
  const lastCepLookup = useRef<string>('');
  const pdfPreviewFrameRef = useRef<HTMLIFrameElement | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .order('full_name', { ascending: true });

    if (fetchError) {
      setError(`Erro ao carregar clientes: ${fetchError.message}`);
      setCustomers([]);
      setLoading(false);
      return;
    }

    setCustomers((data ?? []) as Customer[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const cepDigits = onlyDigits(form.zip_code);
    if (cepDigits.length !== 8 || cepDigits === lastCepLookup.current) return;

    const fetchAddressByCep = async () => {
      setCepLoading(true);
      setCepError(null);
      lastCepLookup.current = cepDigits;

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
        const data = (await response.json()) as {
          erro?: boolean;
          logradouro?: string;
          bairro?: string;
          localidade?: string;
          uf?: string;
        };

        if (data.erro) {
          setCepError('CEP não encontrado.');
          return;
        }

        setForm((prev) => ({
          ...prev,
          street: data.logradouro ?? '',
          neighborhood: data.bairro ?? '',
          city: data.localidade ?? '',
          state: (data.uf ?? '').toUpperCase(),
        }));
      } catch (fetchError) {
        console.error('Erro ao buscar CEP:', fetchError);
        setCepError('Não foi possível consultar o CEP agora.');
      } finally {
        setCepLoading(false);
      }
    };

    fetchAddressByCep();
  }, [form.zip_code]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;

    return customers.filter((customer) => {
      return (
        customer.full_name.toLowerCase().includes(term) ||
        (customer.cpf ?? '').toLowerCase().includes(term) ||
        (customer.cnpj ?? '').toLowerCase().includes(term) ||
        (customer.phone ?? '').toLowerCase().includes(term) ||
        (customer.city ?? '').toLowerCase().includes(term)
      );
    });
  }, [customers, search]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId]
  );

  const fetchCustomerFinancialData = useCallback(async (customerId: number) => {
    setDetailsLoading(true);
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('id, total, paid_amount, created_at, payment_status, paid_at')
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (salesError) {
      setError(`Erro ao carregar dados financeiros do cliente: ${salesError.message}`);
      setCustomerOverview(null);
      setCustomerSalesHistory([]);
      setDetailsLoading(false);
      return;
    }

    const rows = (salesData ?? []) as CustomerSalesRow[];

    const history: CustomerSaleHistoryItem[] = rows.map((sale) => {
      const total = Number(sale.total);
      const paymentStatus = sale.payment_status === 'pending' ? 'pending' : 'paid';
      const paidAmount = normalizePaidAmount(total, sale.paid_amount, paymentStatus);

      return {
        sale_id: sale.id,
        created_at: sale.created_at,
        total,
        paid_amount: paidAmount,
        remaining_amount: Math.max(0, total - paidAmount),
        payment_status: paymentStatus,
        paid_at: sale.paid_at,
      };
    });

    const totalSales = history.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalPaid = history.reduce((sum, sale) => sum + Number(sale.paid_amount), 0);
    const totalPending = history.reduce((sum, sale) => sum + Number(sale.remaining_amount), 0);
    const pendingSalesCount = history.filter((sale) => sale.payment_status === 'pending').length;

    setCustomerOverview({
      customer_id: customerId,
      total_sales: totalSales,
      total_paid: totalPaid,
      total_pending: totalPending,
      pending_sales_count: pendingSalesCount,
      last_sale_at: history.length > 0 ? history[0].created_at : null,
    });

    setCustomerSalesHistory(history);

    setDetailsLoading(false);
  }, []);

  const handleSettleSale = async (saleId: number) => {
    if (!selectedCustomerId) return;

    const selectedSale = customerSalesHistory.find((sale) => sale.sale_id === saleId);
    if (!selectedSale) return;

    setSettlingSaleId(saleId);
    setError(null);
    setSuccess(null);

    const { error: settleError } = await supabase
      .from('sales')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        paid_amount: selectedSale.total,
      })
      .eq('id', saleId)
      .eq('payment_status', 'pending')
      .is('deleted_at', null);

    if (settleError) {
      setError(`Erro ao dar baixa na venda: ${settleError.message}`);
      setSettlingSaleId(null);
      return;
    }

    setSuccess(`Venda #${saleId} baixada com sucesso.`);
    await fetchCustomerFinancialData(selectedCustomerId);
    setSettlingSaleId(null);
  };

  const handleApplyAbatement = async (saleId: number) => {
    if (!selectedCustomerId) return;

    const selectedSale = customerSalesHistory.find((sale) => sale.sale_id === saleId);
    if (!selectedSale || selectedSale.payment_status !== 'pending') return;

    const rawValue = abatementValues[saleId] ?? '';
    const amount = Number(rawValue.replace(',', '.'));

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor de abatimento maior que zero.');
      return;
    }

    if (amount > selectedSale.remaining_amount) {
      setError('O abatimento não pode ser maior que o valor restante da venda.');
      return;
    }

    setSettlingSaleId(saleId);
    setError(null);
    setSuccess(null);

    const newPaidAmount = Math.min(selectedSale.total, selectedSale.paid_amount + amount);
    const isSettled = newPaidAmount >= selectedSale.total;

    const { error: updateError } = await supabase
      .from('sales')
      .update({
        paid_amount: newPaidAmount,
        payment_status: isSettled ? 'paid' : 'pending',
        paid_at: isSettled ? new Date().toISOString() : null,
      })
      .eq('id', saleId)
      .is('deleted_at', null);

    if (updateError) {
      setError(`Erro ao abater valor da venda #${saleId}: ${updateError.message}`);
      setSettlingSaleId(null);
      return;
    }

    setSuccess(
      isSettled
        ? `Venda #${saleId} quitada com sucesso após abatimento.`
        : `Abatimento aplicado na venda #${saleId}.`
    );
    setAbatementValues((prev) => ({ ...prev, [saleId]: '' }));
    await fetchCustomerFinancialData(selectedCustomerId);
    setSettlingSaleId(null);
  };

  const handleApplyTotalAbatement = async () => {
    if (!selectedCustomerId) return;

    const amount = Number(totalAbatementValue.replace(',', '.'));

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor de abatimento total maior que zero.');
      return;
    }

    const pendingSales = customerSalesHistory
      .filter((sale) => sale.payment_status === 'pending' && sale.remaining_amount > 0)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (pendingSales.length === 0) {
      setError('Este cliente não possui vendas pendentes para abater.');
      return;
    }

    const totalPending = pendingSales.reduce((sum, sale) => sum + Number(sale.remaining_amount), 0);

    if (amount > totalPending) {
      setError('O abatimento total não pode ser maior que o valor total em aberto do cliente.');
      return;
    }

    setSettlingTotalAbatement(true);
    setError(null);
    setSuccess(null);

    let remainingAmount = amount;

    for (const sale of pendingSales) {
      if (remainingAmount <= 0) break;

      const amountForSale = Math.min(remainingAmount, Number(sale.remaining_amount));
      const newPaidAmount = Math.min(Number(sale.total), Number(sale.paid_amount) + amountForSale);
      const isSettled = newPaidAmount >= Number(sale.total);

      const { error: updateError } = await supabase
        .from('sales')
        .update({
          paid_amount: newPaidAmount,
          payment_status: isSettled ? 'paid' : 'pending',
          paid_at: isSettled ? new Date().toISOString() : null,
        })
        .eq('id', sale.sale_id)
        .eq('payment_status', 'pending')
        .is('deleted_at', null);

      if (updateError) {
        setError(`Erro ao aplicar abatimento total na venda #${sale.sale_id}: ${updateError.message}`);
        setSettlingTotalAbatement(false);
        return;
      }

      remainingAmount -= amountForSale;
    }

    setSuccess('Abatimento total aplicado com sucesso no saldo em aberto do cliente.');
    setTotalAbatementValue('');
    await fetchCustomerFinancialData(selectedCustomerId);
    setSettlingTotalAbatement(false);
  };

  const handleSettleAllPendingSales = async () => {
    if (!selectedCustomerId) return;

    setShowSettleAllConfirmModal(false);

    const pendingSales = customerSalesHistory.filter(
      (sale) => sale.payment_status === 'pending' && sale.remaining_amount > 0
    );

    if (pendingSales.length === 0) {
      setError('Este cliente não possui vendas pendentes para quitar.');
      return;
    }

    setSettlingAllSales(true);
    setError(null);
    setSuccess(null);

    const paidAt = new Date().toISOString();
    let settledCount = 0;

    for (const sale of pendingSales) {
      const { error: updateError } = await supabase
        .from('sales')
        .update({
          paid_amount: Number(sale.total),
          payment_status: 'paid',
          paid_at: paidAt,
        })
        .eq('id', sale.sale_id)
        .eq('payment_status', 'pending')
        .is('deleted_at', null);

      if (updateError) {
        setError(`Erro ao quitar venda #${sale.sale_id}: ${updateError.message}`);
        setSettlingAllSales(false);
        return;
      }

      settledCount += 1;
    }

    setSuccess(
      settledCount === 1
        ? '1 venda pendente foi quitada com sucesso.'
        : `${settledCount} vendas pendentes foram quitadas com sucesso.`
    );
    await fetchCustomerFinancialData(selectedCustomerId);
    setSettlingAllSales(false);
  };

  const buildCustomerPdfDocument = async () => {
    if (!selectedCustomer) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pdfGeneratedAt = new Date();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 30;
    const topMargin = 26;
    const bottomMargin = 46;
    const maxTextWidth = pageWidth - marginX * 2;
    const palette = {
      white: [255, 255, 255] as [number, number, number],
      gray50: [248, 250, 252] as [number, number, number],
      gray100: [241, 245, 249] as [number, number, number],
      gray200: [226, 232, 240] as [number, number, number],
      gray400: [148, 163, 184] as [number, number, number],
      gray700: [51, 65, 85] as [number, number, number],
      blue900: [15, 23, 42] as [number, number, number],
      blue800: [30, 41, 59] as [number, number, number],
    };
    let y = topMargin;

    const logoDataUrl = await loadImageAsDataUrl('/icon-autocolor.png');

    const drawFooter = () => {
      const footerY = pageHeight - 24;
      doc.setLineWidth(0.4);
      doc.setDrawColor(...palette.gray200);
      doc.line(marginX, footerY - 12, pageWidth - marginX, footerY - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...palette.gray700);
      doc.text('AUTOCOLOR.SYSTEM • RELATÓRIO FINANCEIRO • PADRÃO ERP INDUSTRIAL', marginX, footerY);
      doc.text(`PÁGINA ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - marginX, footerY, { align: 'right' });
    };

    const drawHeader = (continued = false) => {
      const headerStartY = topMargin;
      const logoSize = 40;
      const detailsX = marginX + 52;

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', marginX, headerStartY, logoSize, logoSize);
      }

      doc.setTextColor(...palette.blue900);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(COMPANY_PROFILE.fantasyName, detailsX, headerStartY + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...palette.gray700);
      doc.text(`CNPJ: ${COMPANY_PROFILE.cnpj}`, detailsX, headerStartY + 28);
      doc.text(`Tel: ${COMPANY_PROFILE.phone}`, detailsX, headerStartY + 40);
      doc.text(`${COMPANY_PROFILE.address} - ${COMPANY_PROFILE.cityState}`, detailsX, headerStartY + 52);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...palette.blue800);
      doc.text(continued ? 'RELATÓRIO (CONTINUAÇÃO)' : 'RELATÓRIO ADMINISTRATIVO', pageWidth - marginX, headerStartY + 16, {
        align: 'right',
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...palette.gray400);
      doc.text('DOC: FIN-CLI-ERP', pageWidth - marginX, headerStartY + 27, {
        align: 'right',
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...palette.gray700);
      doc.text(`Emissão: ${pdfGeneratedAt.toLocaleDateString('pt-BR')}`, pageWidth - marginX, headerStartY + 42, {
        align: 'right',
      });

      doc.setLineWidth(0.6);
      doc.setDrawColor(...palette.blue900);
      doc.line(marginX, headerStartY + 62, pageWidth - marginX, headerStartY + 62);
      doc.setLineWidth(0.3);
      doc.setDrawColor(...palette.gray200);
      doc.line(marginX, headerStartY + 66, pageWidth - marginX, headerStartY + 66);
      y = headerStartY + 78;
    };

    const startNewPage = (continued = false) => {
      drawFooter();
      doc.addPage();
      drawHeader(continued);
    };

    const ensureSpace = (requiredHeight: number, continued = false) => {
      if (y + requiredHeight > pageHeight - bottomMargin) {
        startNewPage(continued);
      }
    };

    const customerDocument = selectedCustomer.cnpj || selectedCustomer.cpf || '-';
    const totalSalesValue = Number(customerOverview?.total_sales ?? 0);
    const totalPaidValue = Number(customerOverview?.total_paid ?? 0);
    const totalPendingValue = Number(customerOverview?.total_pending ?? 0);

    drawHeader();

    ensureSpace(72);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...palette.blue900);
    doc.text('Comprovante do Cliente', marginX, y);
    y += 16;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...palette.gray700);
    doc.text(`Cliente: ${selectedCustomer.full_name}`, marginX, y);
    y += 14;
    doc.text(`Documento: ${customerDocument}`, marginX, y);
    y += 14;
    doc.text(`Telefone: ${selectedCustomer.phone || '-'}`, marginX, y);
    y += 14;
    doc.text(`Endereço: ${formattedAddress}`, marginX, y);

    y += 18;
    doc.setLineWidth(0.3);
    doc.setDrawColor(...palette.gray200);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 16;

    ensureSpace(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...palette.blue800);
    doc.text('Detalhes Técnicos', marginX, y);
    y += 13;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...palette.gray700);
    doc.text(`Código do cliente: ${selectedCustomer.id}`, marginX, y);
    doc.text(`Módulo: Financeiro > Clientes`, marginX + 200, y);
    y += 12;
    doc.text(`Timestamp: ${pdfGeneratedAt.toLocaleString('pt-BR')}`, marginX, y);
    doc.text('Versão layout: ERP-IND v1', marginX + 200, y);
    y += 18;

    ensureSpace(88);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...palette.blue900);
    doc.text('Resumo Financeiro', marginX, y);
    y += 10;

    const cardsGap = 10;
    const cardsY = y;
    const cardsWidth = (maxTextWidth - cardsGap * 2) / 3;
    const cardHeight = 56;

    const summaryCards = [
      {
        title: 'Total Compras',
        value: formatCurrency(totalSalesValue),
        fill: palette.white,
        border: palette.gray200,
        text: palette.blue900,
      },
      {
        title: 'Pago',
        value: formatCurrency(totalPaidValue),
        fill: palette.gray50,
        border: palette.gray200,
        text: palette.blue800,
      },
      {
        title: 'Pendente',
        value: formatCurrency(totalPendingValue),
        fill: palette.gray100,
        border: palette.gray400,
        text: palette.blue900,
      },
    ];

    summaryCards.forEach((card, index) => {
      const cardX = marginX + (cardsWidth + cardsGap) * index;
      doc.setFillColor(...card.fill);
      doc.setDrawColor(...card.border);
      doc.setLineWidth(0.5);
      doc.roundedRect(cardX, cardsY, cardsWidth, cardHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...card.text);
      doc.text(card.title, cardX + cardsWidth / 2, cardsY + 18, { align: 'center' });

      doc.setFontSize(12);
      doc.text(card.value, cardX + cardsWidth / 2, cardsY + 38, { align: 'center' });
    });

    y += cardHeight + 22;

    const drawHistoryTitle = (continued = false) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...palette.blue900);
      doc.text(continued ? 'Histórico de vendas (continuação)' : 'Histórico de vendas', marginX, y);
      y += 8;
    };

    const historyColumns = [60, 76, 82, 90, 90, 93];
    const historyHeaders = ['Venda', 'Data', 'Status', 'Pago', 'Pendente', 'Total'];
    const columnGap = 8;
    const tableWidth = historyColumns.reduce((sum, value) => sum + value, 0) + columnGap * (historyColumns.length - 1);
    const rowHeight = 20;
    const textOffsetY = 13;

    const columnStarts = historyColumns.reduce<number[]>((acc, _width, index) => {
      if (index === 0) {
        acc.push(marginX);
        return acc;
      }

      acc.push(acc[index - 1] + historyColumns[index - 1] + columnGap);
      return acc;
    }, []);

    const drawHistoryHeader = () => {
      ensureSpace(rowHeight + 2, true);
      doc.setFillColor(...palette.gray100);
      doc.rect(marginX, y, tableWidth, rowHeight, 'F');
      doc.setLineWidth(0.4);
      doc.setDrawColor(...palette.gray200);
      doc.rect(marginX, y, tableWidth, rowHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...palette.blue800);

      historyHeaders.forEach((header, index) => {
        const startX = columnStarts[index];
        const width = historyColumns[index];
        doc.text(header, startX + width / 2, y + textOffsetY, { align: 'center' });
      });

      y += rowHeight;
    };

    drawHistoryTitle();

    if (customerSalesHistory.length === 0) {
      ensureSpace(20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...palette.gray700);
      doc.text('Nenhuma venda vinculada a este cliente.', marginX, y + 12);
    } else {
      drawHistoryHeader();

      customerSalesHistory.forEach((sale, index) => {
        if (y + rowHeight > pageHeight - 40) {
          startNewPage(true);
          drawHistoryTitle(true);
          drawHistoryHeader();
        }

        const saleDate = new Date(sale.created_at).toLocaleDateString('pt-BR');
        const statusLabel = sale.payment_status === 'paid'
          ? 'PAGO'
          : sale.paid_amount > 0
            ? 'PARCIAL'
            : 'PENDENTE';

        if (index % 2 === 0) {
          doc.setFillColor(...palette.gray50);
          doc.rect(marginX, y, tableWidth, rowHeight, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...palette.gray700);

        doc.text(`#${sale.sale_id}`, columnStarts[0] + historyColumns[0] / 2, y + textOffsetY, { align: 'center' });
        doc.text(saleDate, columnStarts[1] + historyColumns[1] / 2, y + textOffsetY, { align: 'center' });

        const statusCenterX = columnStarts[2] + historyColumns[2] / 2;
        const statusTextWidth = doc.getTextWidth(statusLabel);
        const badgeWidth = Math.max(44, statusTextWidth + 16);
        const badgeHeight = 12;
        const badgeX = statusCenterX - badgeWidth / 2;
        const badgeY = y + 4;

        if (statusLabel === 'PAGO') {
          doc.setFillColor(...palette.gray50);
          doc.setDrawColor(...palette.gray200);
          doc.setTextColor(...palette.blue900);
        } else if (statusLabel === 'PARCIAL') {
          doc.setFillColor(...palette.gray100);
          doc.setDrawColor(...palette.gray400);
          doc.setTextColor(...palette.blue800);
        } else {
          doc.setFillColor(...palette.white);
          doc.setDrawColor(...palette.gray400);
          doc.setTextColor(...palette.gray700);
        }

        doc.setLineWidth(0.4);
        doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(statusLabel, statusCenterX, badgeY + 8.5, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...palette.gray700);
        doc.text(formatCurrency(sale.paid_amount), columnStarts[3] + historyColumns[3] / 2, y + textOffsetY, { align: 'center' });
        doc.text(formatCurrency(sale.remaining_amount), columnStarts[4] + historyColumns[4] / 2, y + textOffsetY, { align: 'center' });
        doc.text(formatCurrency(sale.total), columnStarts[5] + historyColumns[5] / 2, y + textOffsetY, { align: 'center' });

        doc.setLineWidth(0.3);
        doc.setDrawColor(...palette.gray200);
        doc.line(marginX, y + rowHeight, marginX + tableWidth, y + rowHeight);

        y += rowHeight;
      });
    }

    drawFooter();

    const safeName = sanitizeFileName(selectedCustomer.full_name) || `cliente_${selectedCustomer.id}`;
    const fileName = `relatorio-compras-${safeName}.pdf`;

    return { doc, fileName };
  };

  const handleOpenCustomerPdfPreview = async () => {
    const result = await buildCustomerPdfDocument();
    if (!result) return;

    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }

    const blob = result.doc.output('blob');
    const nextPreviewUrl = URL.createObjectURL(blob);

    setPdfPreviewUrl(nextPreviewUrl);
    setPdfPreviewFileName(result.fileName);
    setShowPdfPreviewModal(true);
  };

  const handleClosePdfPreviewModal = () => {
    setShowPdfPreviewModal(false);
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
    setPdfPreviewFileName('');
  };

  const handlePrintPdfPreview = () => {
    const iframeWindow = pdfPreviewFrameRef.current?.contentWindow;
    if (!iframeWindow) return;

    iframeWindow.focus();
    iframeWindow.print();
  };

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  const loadCustomerIntoForm = useCallback((customer: Customer, nextMode: FormMode) => {
    setSelectedCustomerId(customer.id);
    setMode(nextMode);
    setForm({
      full_name: customer.full_name ?? '',
      cpf: customer.cpf ?? '',
      cnpj: customer.cnpj ?? '',
      phone: customer.phone ?? '',
      birth_date: customer.birth_date ?? '',
      zip_code: customer.zip_code ?? '',
      street: customer.street ?? '',
      address_number: customer.address_number ?? '',
      address_complement: customer.address_complement ?? '',
      neighborhood: customer.neighborhood ?? '',
      city: customer.city ?? '',
      state: customer.state ?? '',
    });
    setDocumentType(customer.cnpj ? 'cnpj' : 'cpf');
    setError(null);
    setSuccess(null);
    setCepError(null);
    setAbatementValues({});
    setTotalAbatementValue('');
    setShowSettleAllConfirmModal(false);

    if (nextMode === 'view') {
      fetchCustomerFinancialData(customer.id);
    } else {
      setCustomerOverview(null);
      setCustomerSalesHistory([]);
    }
  }, [fetchCustomerFinancialData]);

  useEffect(() => {
    if (pageMode === 'list') return;

    if (pageMode === 'create') {
      setMode('create');
      setDocumentType('cpf');
      setSelectedCustomerId(null);
      setForm(emptyForm);
      setError(null);
      setSuccess(null);
      setCepError(null);
      setCustomerOverview(null);
      setCustomerSalesHistory([]);
      setAbatementValues({});
      setTotalAbatementValue('');
      setShowSettleAllConfirmModal(false);
      lastCepLookup.current = '';
      return;
    }

    if (!routeCustomerId || Number.isNaN(routeCustomerId)) {
      setError('Cliente inválido.');
      return;
    }

    const customer = customers.find((item) => item.id === routeCustomerId);

    if (customer) {
      loadCustomerIntoForm(customer, pageMode === 'edit' ? 'edit' : 'view');
    } else if (!loading) {
      setError('Cliente não encontrado.');
    }
  }, [pageMode, routeCustomerId, customers, loading, loadCustomerIntoForm]);

  const handleFormChange =
    (field: keyof CustomerForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;

      setForm((prev) => {
        if (field === 'cpf') return { ...prev, cpf: maskCpf(value) };
        if (field === 'cnpj') return { ...prev, cnpj: maskCnpj(value) };
        if (field === 'phone') return { ...prev, phone: maskPhone(value) };
        if (field === 'zip_code') return { ...prev, zip_code: maskZipCode(value) };
        if (field === 'state') return { ...prev, state: normalizeState(value) };
        return { ...prev, [field]: value };
      });

      if (field === 'zip_code') {
        setCepError(null);
      }
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'view') return;

    const cpfDigits = onlyDigits(form.cpf);
    const cnpjDigits = onlyDigits(form.cnpj);
    const zipDigits = onlyDigits(form.zip_code);
    const phoneDigits = onlyDigits(form.phone);

    if (!form.full_name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }

    if (documentType === 'cnpj' && cnpjDigits.length !== 14) {
      setError('CNPJ inválido. Informe os 14 dígitos.');
      return;
    }

    if (zipDigits.length > 0 && zipDigits.length !== 8) {
      setError('CEP inválido. Informe os 8 dígitos.');
      return;
    }

    setSaving(true);

    const payload = {
      full_name: form.full_name.trim(),
      cpf: documentType === 'cpf' && cpfDigits ? maskCpf(cpfDigits) : null,
      cnpj: documentType === 'cnpj' && cnpjDigits ? maskCnpj(cnpjDigits) : null,
      phone: phoneDigits ? maskPhone(phoneDigits) : null,
      birth_date: form.birth_date || null,
      zip_code: zipDigits ? maskZipCode(zipDigits) : null,
      street: form.street.trim() || null,
      address_number: form.address_number.trim() || null,
      address_complement: form.address_complement.trim() || null,
      neighborhood: form.neighborhood.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() ? normalizeState(form.state) : null,
    };

    if (mode === 'create') {
      const { error: insertError } = await supabase.from('customers').insert(payload);

      if (insertError) {
        if (insertError.message.includes('customers_cpf_key')) {
          setError('Já existe cliente com este CPF.');
        } else if (insertError.message.includes('idx_customers_cnpj_unique') || insertError.message.includes('customers_cnpj_key')) {
          setError('Já existe cliente com este CNPJ.');
        } else {
          setError(`Erro ao cadastrar cliente: ${insertError.message}`);
        }
        setSaving(false);
        return;
      }

      await fetchCustomers();
      navigate('/clientes');
      setSaving(false);
      return;
    }

    if (!selectedCustomerId) {
      setError('Cliente inválido para edição.');
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', selectedCustomerId);

    if (updateError) {
      if (updateError.message.includes('customers_cpf_key')) {
        setError('Já existe cliente com este CPF.');
      } else if (updateError.message.includes('idx_customers_cnpj_unique') || updateError.message.includes('customers_cnpj_key')) {
        setError('Já existe cliente com este CNPJ.');
      } else {
        setError(`Erro ao atualizar cliente: ${updateError.message}`);
      }
      setSaving(false);
      return;
    }

    await fetchCustomers();
    setSuccess('Cliente atualizado com sucesso.');
    navigate(`/clientes/${selectedCustomerId}`);

    setSaving(false);
  };

  const modeTitle =
    mode === 'create' ? 'Cadastro de Cliente' : mode === 'edit' ? 'Editar Cliente' : 'Visualização do Cliente';

  const formattedAddress = formatCustomerAddress(form);

  if (pageMode === 'list') {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col gap-2 sm:gap-4">
            <div className="relative w-full">
              <Icon
                icon="solar:magnifer-linear"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                width={16}
              />
              <input
                type="text"
                placeholder="Buscar por nome, CPF/CNPJ, telefone ou cidade..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-800 shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 w-full sm:w-auto"
              onClick={() => navigate('/clientes/novo')}
            >
              <Icon icon="solar:add-circle-linear" width={18} />
              <span>Novo Cliente</span>
            </button>
          </div>

          <div className="hidden lg:block overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Carregando clientes...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Nenhum cliente encontrado.</div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600 min-w-[920px]">
                <thead className="bg-gray-50 text-xs uppercase text-slate-500 font-medium">
                  <tr>
                    <th className="px-4 py-3 tracking-wider">Nome</th>
                    <th className="px-4 py-3 tracking-wider">CPF/CNPJ</th>
                    <th className="px-4 py-3 tracking-wider">Telefone</th>
                    <th className="px-4 py-3 tracking-wider">Cidade/UF</th>
                    <th className="px-4 py-3 tracking-wider">Nascimento</th>
                    <th className="px-4 py-3 tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="group hover:bg-slate-50/50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{customer.full_name}</div>
                      </td>
                      <td className="px-4 py-4">{getDocumentValue(customer)}</td>
                      <td className="px-4 py-4">{customer.phone ?? '-'}</td>
                      <td className="px-4 py-4">
                        {(customer.city ?? '-') + (customer.state ? `/${customer.state}` : '')}
                      </td>
                      <td className="px-4 py-4">
                        {customer.birth_date ? new Date(customer.birth_date).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                            onClick={() => navigate(`/clientes/${customer.id}`)}
                            title="Visualizar"
                          >
                            <Icon icon="solar:eye-linear" width={18} />
                          </button>
                          <button
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                            onClick={() => navigate(`/clientes/${customer.id}/editar`)}
                            title="Editar"
                          >
                            <Icon icon="solar:pen-linear" width={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="lg:hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Carregando clientes...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Nenhum cliente encontrado.</div>
            ) : (
              <div className="grid grid-cols-1 gap-3 p-3">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{customer.full_name}</p>
                        <p className="text-xs text-slate-500 mt-1">{getDocumentValue(customer)}</p>
                        <p className="text-xs text-slate-500">{customer.phone ?? '-'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                          onClick={() => navigate(`/clientes/${customer.id}`)}
                          title="Visualizar"
                        >
                          <Icon icon="solar:eye-linear" width={20} />
                        </button>
                        <button
                          className="text-slate-400 hover:text-slate-700 transition-colors"
                          onClick={() => navigate(`/clientes/${customer.id}/editar`)}
                          title="Editar"
                        >
                          <Icon icon="solar:pen-linear" width={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{modeTitle}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'view'
                ? 'Resumo do cliente com foco em compras, pagamentos e dados essenciais.'
                : 'Use este painel para cadastrar e editar clientes.'}
            </p>
          </div>
          {mode !== 'create' && selectedCustomer && (
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
              Cliente #{selectedCustomer.id}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 border border-red-200 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 border border-green-200 bg-green-50 text-green-700 rounded-lg px-3 py-2 text-sm">
            {success}
          </div>
        )}
        {cepError && (
          <div className="mb-4 border border-amber-200 bg-amber-50 text-amber-700 rounded-lg px-3 py-2 text-sm">
            {cepError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'view' ? (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-100 border border-slate-300 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Nome</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{form.full_name || '-'}</p>
                </div>
                <div className="bg-slate-100 border border-slate-300 rounded-lg p-3">
                  <p className="text-xs text-slate-500">{form.cnpj ? 'CNPJ' : 'CPF'}</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{form.cnpj || form.cpf || '-'}</p>
                </div>
                <div className="bg-slate-100 border border-slate-300 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Telefone</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{form.phone || '-'}</p>
                </div>
                <div className="md:col-span-3 bg-slate-100 border border-slate-300 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Endereço</p>
                  <p className="text-sm font-medium text-slate-900 mt-1 whitespace-normal break-words">{formattedAddress}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={handleFormChange('full_name')}
                  className={inputBaseClass}
                  disabled={saving}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de documento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      documentType === 'cpf'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      setDocumentType('cpf');
                      setForm((prev) => ({ ...prev, cnpj: '' }));
                    }}
                    disabled={saving}
                  >
                    Pessoa Física (CPF)
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      documentType === 'cnpj'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      setDocumentType('cnpj');
                      setForm((prev) => ({ ...prev, cpf: '' }));
                    }}
                    disabled={saving}
                  >
                    Pessoa Jurídica (CNPJ)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{documentType === 'cpf' ? 'CPF' : 'CNPJ'}</label>
                <input
                  type="text"
                  value={documentType === 'cpf' ? form.cpf : form.cnpj}
                  onChange={handleFormChange(documentType === 'cpf' ? 'cpf' : 'cnpj')}
                  className={inputBaseClass}
                  disabled={saving}
                  placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                  required={documentType === 'cnpj'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={handleFormChange('phone')}
                  className={inputBaseClass}
                  disabled={saving}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={form.birth_date}
                  onChange={handleFormChange('birth_date')}
                  className={inputBaseClass}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.zip_code}
                    onChange={handleFormChange('zip_code')}
                    className={inputBaseClass}
                    disabled={saving}
                    placeholder="00000-000"
                  />
                  {cepLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Buscando...</span>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={form.street}
                  onChange={handleFormChange('street')}
                  className={inputBaseClass}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                <input
                  type="text"
                  value={form.address_number}
                  onChange={handleFormChange('address_number')}
                  className={inputBaseClass}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Complemento</label>
                <input
                  type="text"
                  value={form.address_complement}
                  onChange={handleFormChange('address_complement')}
                  className={inputBaseClass}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                <input
                  type="text"
                  value={form.neighborhood}
                  onChange={handleFormChange('neighborhood')}
                  className={inputBaseClass}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={handleFormChange('city')}
                  className={inputBaseClass}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">UF</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={handleFormChange('state')}
                  className={inputBaseClass}
                  disabled={saving}
                  placeholder="SP"
                />
              </div>
            </div>
          )}

          {mode === 'view' && selectedCustomer && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Resumo Financeiro</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Histórico de vendas, total comprado e saldo pendente deste cliente.
                </p>
              </div>

              {detailsLoading ? (
                <div className="text-sm text-slate-400">Carregando dados financeiros...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="border border-slate-300 rounded-lg p-3 bg-slate-100">
                      <p className="text-xs text-slate-500">Total em compras</p>
                      <p className="text-base font-semibold text-slate-900 mt-1">
                        {Number(customerOverview?.total_sales ?? 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                    </div>
                    <div className="border border-slate-300 rounded-lg p-3 bg-slate-100">
                      <p className="text-xs text-slate-500">Valor já pago</p>
                      <p className="text-base font-semibold text-emerald-700 mt-1">
                        {Number(customerOverview?.total_paid ?? 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                    </div>
                    <div className="border border-slate-300 rounded-lg p-3 bg-slate-100">
                      <p className="text-xs text-slate-500">Quanto deve</p>
                      <p className="text-base font-semibold text-amber-700 mt-1">
                        {Number(customerOverview?.total_pending ?? 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {Number(customerOverview?.pending_sales_count ?? 0)} venda(s) marcada(s)
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-slate-900">Histórico de Vendas do Cliente</h4>
                      <button
                        type="button"
                        onClick={handleOpenCustomerPdfPreview}
                        className="inline-flex items-center gap-1.5 text-xs bg-slate-900 text-white rounded px-3 py-1.5 hover:bg-slate-800"
                      >
                        <Icon icon="solar:document-text-linear" width={14} />
                        Ver PDF
                      </button>
                    </div>
                    <div className="mb-3 border border-slate-300 rounded-lg p-3 bg-slate-100">
                      <p className="text-xs text-slate-500 mb-2">Abater no saldo total do cliente</p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={totalAbatementValue}
                          onChange={(event) => setTotalAbatementValue(event.target.value)}
                          className="w-full sm:w-36 border border-gray-200 rounded px-2 py-1 text-sm text-right hide-spin"
                          placeholder="Valor"
                          disabled={
                            settlingTotalAbatement ||
                            settlingAllSales ||
                            Number(customerOverview?.total_pending ?? 0) <= 0
                          }
                        />
                        <button
                          type="button"
                          onClick={handleApplyTotalAbatement}
                          disabled={
                            settlingTotalAbatement ||
                            settlingAllSales ||
                            Number(customerOverview?.total_pending ?? 0) <= 0
                          }
                          className="text-sm bg-slate-900 text-white rounded px-3 py-1.5 hover:bg-slate-800 disabled:opacity-60"
                        >
                          {settlingTotalAbatement ? 'Aplicando...' : 'Abater no Total'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSettleAllConfirmModal(true)}
                          disabled={
                            settlingAllSales ||
                            settlingTotalAbatement ||
                            Number(customerOverview?.total_pending ?? 0) <= 0
                          }
                          className="text-sm bg-emerald-600 text-white rounded px-3 py-1.5 hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {settlingAllSales ? 'Quitando...' : 'Quitar Tudo'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        O valor será distribuído automaticamente entre as vendas pendentes mais antigas.
                      </p>
                    </div>

                    {showSettleAllConfirmModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                          <h5 className="text-sm font-semibold text-slate-900">Confirmar quitação total</h5>
                          <p className="mt-2 text-sm text-slate-600">
                            Deseja realmente quitar todas as contas pendentes deste cliente?
                          </p>
                          <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowSettleAllConfirmModal(false)}
                              disabled={settlingAllSales}
                              className="text-sm rounded px-3 py-1.5 border border-gray-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleSettleAllPendingSales}
                              disabled={settlingAllSales}
                              className="text-sm bg-emerald-600 text-white rounded px-3 py-1.5 hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {settlingAllSales ? 'Quitando...' : 'Confirmar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {showPdfPreviewModal && (
                      <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                        onClick={handleClosePdfPreviewModal}
                      >
                        <div
                          className="w-full max-w-4xl rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-2">
                            <h5 className="text-sm font-semibold text-slate-900">Pré-visualização do relatório</h5>
                            <button
                              type="button"
                              onClick={handleClosePdfPreviewModal}
                              className="text-sm rounded px-2.5 py-1.5 border border-gray-200 text-slate-700 hover:bg-slate-50"
                            >
                              Fechar
                            </button>
                          </div>

                          <div className="h-[70vh] bg-slate-100">
                            {pdfPreviewUrl ? (
                              <iframe
                                ref={pdfPreviewFrameRef}
                                src={pdfPreviewUrl}
                                title="Pré-visualização do PDF"
                                className="w-full h-full"
                              />
                            ) : (
                              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                                Não foi possível carregar a pré-visualização do PDF.
                              </div>
                            )}
                          </div>

                          <div className="px-4 py-3 border-t border-gray-200 bg-white flex items-center justify-end gap-2">
                            <a
                              href={pdfPreviewUrl ?? '#'}
                              download={pdfPreviewFileName || 'relatorio-cliente.pdf'}
                              className={`text-sm rounded px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 ${
                                pdfPreviewUrl ? '' : 'pointer-events-none opacity-60'
                              }`}
                            >
                              Download
                            </a>
                            <button
                              type="button"
                              onClick={handlePrintPdfPreview}
                              disabled={!pdfPreviewUrl}
                              className="text-sm bg-slate-900 text-white rounded px-3 py-1.5 hover:bg-slate-800 disabled:opacity-60"
                            >
                              Imprimir
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {customerSalesHistory.length === 0 ? (
                        <div className="p-4 text-sm text-slate-400">Nenhuma venda vinculada a este cliente.</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm text-slate-600 min-w-[620px]">
                            <thead className="bg-gray-50 text-xs uppercase text-slate-500 font-medium">
                              <tr>
                                <th className="px-3 py-2 tracking-wider">Venda</th>
                                <th className="px-3 py-2 tracking-wider">Data</th>
                                <th className="px-3 py-2 tracking-wider">Status</th>
                                <th className="px-3 py-2 tracking-wider text-right">Pago</th>
                                <th className="px-3 py-2 tracking-wider text-right">Falta</th>
                                <th className="px-3 py-2 tracking-wider text-right">Valor</th>
                                <th className="px-3 py-2 tracking-wider text-right">Ação</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {customerSalesHistory.map((sale) => (
                                <tr key={sale.sale_id}>
                                  <td className="px-3 py-2 text-xs text-slate-500">#{sale.sale_id}</td>
                                  <td className="px-3 py-2">
                                    {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span
                                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                        sale.payment_status === 'pending'
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-blue-100 text-blue-700'
                                      }`}
                                    >
                                      {sale.payment_status === 'pending' ? 'A prazo' : 'Pago'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right text-emerald-700 font-medium">
                                    {Number(sale.paid_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </td>
                                  <td className="px-3 py-2 text-right text-amber-700 font-medium">
                                    {Number(sale.remaining_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </td>
                                  <td className="px-3 py-2 text-right font-medium text-slate-900">
                                    {Number(sale.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {sale.payment_status === 'pending' ? (
                                      <div className="flex items-center justify-end gap-2">
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={abatementValues[sale.sale_id] ?? ''}
                                          onChange={(event) =>
                                            setAbatementValues((prev) => ({
                                              ...prev,
                                              [sale.sale_id]: event.target.value,
                                            }))
                                          }
                                          className="w-24 border border-gray-200 rounded px-2 py-1 text-xs text-right hide-spin"
                                          placeholder="Abater"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleApplyAbatement(sale.sale_id)}
                                          disabled={
                                            settlingSaleId === sale.sale_id ||
                                            settlingTotalAbatement ||
                                            settlingAllSales
                                          }
                                          className="text-xs bg-slate-900 text-white rounded px-3 py-1 hover:bg-slate-800 disabled:opacity-60"
                                        >
                                          Abater
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSettleSale(sale.sale_id)}
                                          disabled={
                                            settlingSaleId === sale.sale_id ||
                                            settlingTotalAbatement ||
                                            settlingAllSales
                                          }
                                          className="text-xs bg-emerald-600 text-white rounded px-3 py-1 hover:bg-emerald-700 disabled:opacity-60"
                                        >
                                          {settlingSaleId === sale.sale_id ? 'Baixando...' : 'Quitar'}
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-400">
                                        {sale.paid_at
                                          ? `Pago em ${new Date(sale.paid_at).toLocaleDateString('pt-BR')}`
                                          : 'Pago'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {mode !== 'view' && (
              <button
                type="submit"
                disabled={saving}
                className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? 'Salvando...' : mode === 'create' ? 'Cadastrar Cliente' : 'Salvar Alterações'}
              </button>
            )}

            {mode === 'view' && selectedCustomer && (
              <button
                type="button"
                onClick={() => navigate(`/clientes/${selectedCustomer.id}/editar`)}
                className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-800"
              >
                Editar Cliente
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/clientes')}
              className="bg-white text-slate-700 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Voltar para Lista
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Customers;
