import { useState, FormEvent, useEffect } from 'react';
import { FinancingFormData } from '../../types/financing';

interface FinancingFormProps {
  onSubmit: (data: FinancingFormData) => void;
  initialData?: FinancingFormData;
  purchasePrice?: number;
  loading?: boolean;
}

export default function FinancingForm({ onSubmit, initialData, purchasePrice, loading = false }: FinancingFormProps) {
  const [formData, setFormData] = useState<FinancingFormData>(
    initialData || { loan_amount: '', down_payment: '', interest_rate: '', loan_term: '30' }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FinancingFormData, string>>>({});

  useEffect(() => {
    if (purchasePrice && formData.down_payment && !formData.loan_amount) {
      const downPayment = parseFloat(formData.down_payment);
      if (!isNaN(downPayment) && downPayment < purchasePrice) {
        setFormData((prev) => ({ ...prev, loan_amount: String(purchasePrice - downPayment) }));
      }
    }
  }, [formData.down_payment, purchasePrice]);

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FinancingFormData, string>> = {};

    if (!formData.loan_amount.trim()) {
      newErrors.loan_amount = 'Loan amount is required';
    } else {
      const amount = parseFloat(formData.loan_amount);
      if (isNaN(amount) || amount <= 0) newErrors.loan_amount = 'Must be a positive number';
      if (purchasePrice && amount > purchasePrice) newErrors.loan_amount = 'Cannot exceed purchase price';
    }

    if (formData.down_payment.trim()) {
      const dp = parseFloat(formData.down_payment);
      if (isNaN(dp) || dp < 0) newErrors.down_payment = 'Must be a non-negative number';
    }

    if (!formData.interest_rate.trim()) {
      newErrors.interest_rate = 'Interest rate is required';
    } else {
      const rate = parseFloat(formData.interest_rate);
      if (isNaN(rate) || rate < 0 || rate > 30) newErrors.interest_rate = 'Must be between 0% and 30%';
    }

    if (!formData.loan_term.trim()) {
      newErrors.loan_term = 'Loan term is required';
    } else {
      const term = parseInt(formData.loan_term);
      if (isNaN(term) || term < 1 || term > 50) newErrors.loan_term = 'Must be between 1 and 50 years';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FinancingFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleDownPaymentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const dp = e.target.value;
    setFormData((prev) => {
      const downPayment = parseFloat(dp);
      const loanAmount = purchasePrice && !isNaN(downPayment) ? String(purchasePrice - downPayment) : prev.loan_amount;
      return { ...prev, down_payment: dp, loan_amount: loanAmount };
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  }

  function calculateMonthlyPayment(): string {
    const principal = parseFloat(formData.loan_amount);
    const rate = parseFloat(formData.interest_rate) / 100 / 12;
    const payments = parseInt(formData.loan_term) * 12;
    if (isNaN(principal) || isNaN(rate) || isNaN(payments) || rate === 0) return '';
    const monthly = principal * (rate * Math.pow(1 + rate, payments)) / (Math.pow(1 + rate, payments) - 1);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(monthly);
  }

  const monthlyPayment = calculateMonthlyPayment();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {purchasePrice && (
        <div className="bg-indigo-50 rounded-lg p-4 text-sm">
          <span className="font-medium text-indigo-700">Purchase Price: </span>
          <span className="text-indigo-900">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(purchasePrice)}
          </span>
        </div>
      )}

      <div>
        <label htmlFor="down_payment" className="block text-sm font-medium text-gray-700 mb-1">
          Down Payment
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            id="down_payment"
            name="down_payment"
            type="number"
            min="0"
            step="1000"
            value={formData.down_payment}
            onChange={handleDownPaymentChange}
            placeholder="100000"
            className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${
              errors.down_payment ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
        </div>
        {errors.down_payment && <p className="mt-1 text-sm text-red-600">{errors.down_payment}</p>}
      </div>

      <div>
        <label htmlFor="loan_amount" className="block text-sm font-medium text-gray-700 mb-1">
          Loan Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            id="loan_amount"
            name="loan_amount"
            type="number"
            min="0"
            step="1000"
            value={formData.loan_amount}
            onChange={handleChange}
            placeholder="400000"
            className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${
              errors.loan_amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
        </div>
        {errors.loan_amount && <p className="mt-1 text-sm text-red-600">{errors.loan_amount}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="interest_rate" className="block text-sm font-medium text-gray-700 mb-1">
            Interest Rate (%)
          </label>
          <input
            id="interest_rate"
            name="interest_rate"
            type="number"
            min="0"
            max="30"
            step="0.125"
            value={formData.interest_rate}
            onChange={handleChange}
            placeholder="6.5"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${
              errors.interest_rate ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.interest_rate && <p className="mt-1 text-sm text-red-600">{errors.interest_rate}</p>}
        </div>

        <div>
          <label htmlFor="loan_term" className="block text-sm font-medium text-gray-700 mb-1">
            Loan Term (years)
          </label>
          <select
            id="loan_term"
            name="loan_term"
            value={formData.loan_term}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${
              errors.loan_term ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="15">15 years</option>
            <option value="20">20 years</option>
            <option value="25">25 years</option>
            <option value="30">30 years</option>
          </select>
          {errors.loan_term && <p className="mt-1 text-sm text-red-600">{errors.loan_term}</p>}
        </div>
      </div>

      {monthlyPayment && (
        <div className="bg-green-50 rounded-lg p-4">
          <span className="text-sm font-medium text-green-700">Estimated Monthly Payment: </span>
          <span className="text-lg font-bold text-green-900">{monthlyPayment}</span>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : 'Continue to Expenses'}
        </button>
      </div>
    </form>
  );
}
