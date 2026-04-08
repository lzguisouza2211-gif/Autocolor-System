import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { supabase } from '../supabase';

interface Customer {
  id: number;
  full_name: string;
  cpf: string;
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

type FormMode = 'create' | 'edit' | 'view';

const emptyForm: CustomerForm = {
  full_name: '',
  cpf: '',
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
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-slate-500';

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const maskCpf = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
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

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<FormMode>('create');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const lastCepLookup = useRef<string>('');

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
        customer.cpf.toLowerCase().includes(term) ||
        (customer.phone ?? '').toLowerCase().includes(term) ||
        (customer.city ?? '').toLowerCase().includes(term)
      );
    });
  }, [customers, search]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId]
  );

  const resetToCreate = () => {
    setMode('create');
    setSelectedCustomerId(null);
    setForm(emptyForm);
    setError(null);
    setSuccess(null);
    setCepError(null);
    lastCepLookup.current = '';
  };

  const loadCustomerIntoForm = (customer: Customer, nextMode: FormMode) => {
    setSelectedCustomerId(customer.id);
    setMode(nextMode);
    setForm({
      full_name: customer.full_name ?? '',
      cpf: customer.cpf ?? '',
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
    setError(null);
    setSuccess(null);
    setCepError(null);
  };

  const handleFormChange =
    (field: keyof CustomerForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;

      setForm((prev) => {
        if (field === 'cpf') return { ...prev, cpf: maskCpf(value) };
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
    const zipDigits = onlyDigits(form.zip_code);
    const phoneDigits = onlyDigits(form.phone);

    if (!form.full_name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }

    if (cpfDigits.length !== 11) {
      setError('CPF inválido. Informe os 11 dígitos.');
      return;
    }

    if (zipDigits.length > 0 && zipDigits.length !== 8) {
      setError('CEP inválido. Informe os 8 dígitos.');
      return;
    }

    setSaving(true);

    const payload = {
      full_name: form.full_name.trim(),
      cpf: maskCpf(cpfDigits),
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
        } else {
          setError(`Erro ao cadastrar cliente: ${insertError.message}`);
        }
        setSaving(false);
        return;
      }

      setMode('create');
      setSelectedCustomerId(null);
      setForm(emptyForm);
      setError(null);
      setCepError(null);
      lastCepLookup.current = '';
      setSuccess('Cliente cadastrado com sucesso.');
      await fetchCustomers();
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
      } else {
        setError(`Erro ao atualizar cliente: ${updateError.message}`);
      }
      setSaving(false);
      return;
    }

    await fetchCustomers();
    setMode('view');
    setSuccess('Cliente atualizado com sucesso.');

    setSaving(false);
  };

  const modeTitle =
    mode === 'create' ? 'Cadastro de Cliente' : mode === 'edit' ? 'Editar Cliente' : 'Visualização do Cliente';

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
              placeholder="Buscar por nome, CPF, telefone ou cidade..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-800 shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 w-full sm:w-auto"
            onClick={resetToCreate}
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
                  <th className="px-4 py-3 tracking-wider">CPF</th>
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
                    <td className="px-4 py-4">{customer.cpf}</td>
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
                          onClick={() => loadCustomerIntoForm(customer, 'view')}
                          title="Visualizar"
                        >
                          <Icon icon="solar:eye-linear" width={18} />
                        </button>
                        <button
                          className="text-slate-400 hover:text-slate-700 transition-colors"
                          onClick={() => loadCustomerIntoForm(customer, 'edit')}
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
                      <p className="text-xs text-slate-500 mt-1">{customer.cpf}</p>
                      <p className="text-xs text-slate-500">{customer.phone ?? '-'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        onClick={() => loadCustomerIntoForm(customer, 'view')}
                        title="Visualizar"
                      >
                        <Icon icon="solar:eye-linear" width={20} />
                      </button>
                      <button
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        onClick={() => loadCustomerIntoForm(customer, 'edit')}
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

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{modeTitle}</h2>
            <p className="text-xs text-slate-500 mt-1">Use este painel para cadastrar, visualizar e editar clientes.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
              <input
                type="text"
                value={form.full_name}
                onChange={handleFormChange('full_name')}
                className={inputBaseClass}
                disabled={mode === 'view' || saving}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
              <input
                type="text"
                value={form.cpf}
                onChange={handleFormChange('cpf')}
                className={inputBaseClass}
                disabled={mode === 'view' || saving}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
              <input
                type="text"
                value={form.phone}
                onChange={handleFormChange('phone')}
                className={inputBaseClass}
                disabled={mode === 'view' || saving}
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
                disabled={mode === 'view' || saving}
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
                  disabled={mode === 'view' || saving}
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
                disabled={mode === 'view' || saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
              <input
                type="text"
                value={form.address_number}
                onChange={handleFormChange('address_number')}
                className={inputBaseClass}
                disabled={mode === 'view' || saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Complemento</label>
              <input
                type="text"
                value={form.address_complement}
                onChange={handleFormChange('address_complement')}
                className={inputBaseClass}
                disabled={mode === 'view' || saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
              <input
                type="text"
                value={form.neighborhood}
                onChange={handleFormChange('neighborhood')}
                className={inputBaseClass}
                disabled={mode === 'view' || saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
              <input
                type="text"
                value={form.city}
                onChange={handleFormChange('city')}
                className={inputBaseClass}
                disabled={mode === 'view' || saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">UF</label>
              <input
                type="text"
                value={form.state}
                onChange={handleFormChange('state')}
                className={inputBaseClass}
                disabled={mode === 'view' || saving}
                placeholder="SP"
              />
            </div>
          </div>

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
                onClick={() => loadCustomerIntoForm(selectedCustomer, 'edit')}
                className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-800"
              >
                Editar Cliente
              </button>
            )}

            <button
              type="button"
              onClick={resetToCreate}
              className="bg-white text-slate-700 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Novo Cadastro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Customers;
