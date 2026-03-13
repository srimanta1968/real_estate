import { useState, FormEvent } from 'react';
import { ExpenseFormData } from '../../types/expense';

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => void;
  initialData?: ExpenseFormData;
  purchasePrice?: number;
  monthlyMortgage?: number;
  loading?: boolean;
}

export default function ExpenseForm({ onSubmit, initialData, purchasePrice, monthlyMortgage, loading = false }: ExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>(
    initialData || {
      property_tax: '',
      insurance: '',
      maintenance: '',
      management_fee: '',
      vacancy_rate: '5',
      monthly_rental_income: '',
    }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ExpenseFormData, string>> = {};

    if (!formData.property_tax.trim()) {
      newErrors.property_tax = 'Property tax is required';
    } else {
      const val = parseFloat(formData.property_tax);
      if (isNaN(val) || val < 0) newErrors.property_tax = 'Must be a non-negative number';
    }

    if (!formData.insurance.trim()) {
      newErrors.insurance = 'Insurance is required';
    } else {
      const val = parseFloat(formData.insurance);
      if (isNaN(val) || val < 0) newErrors.insurance = 'Must be a non-negative number';
    }

    if (formData.maintenance.trim()) {
      const val = parseFloat(formData.maintenance);
      if (isNaN(val) || val < 0) newErrors.maintenance = 'Must be a non-negative number';
    }

    if (formData.management_fee.trim()) {
      const val = parseFloat(formData.management_fee);
      if (isNaN(val) || val < 0 || val > 100) newErrors.management_fee = 'Must be between 0% and 100%';
    }

    if (!formData.vacancy_rate.trim()) {
      newErrors.vacancy_rate = 'Vacancy rate is required';
    } else {
      const val = parseFloat(formData.vacancy_rate);
      if (isNaN(val) || val < 0 || val > 100) newErrors.vacancy_rate = 'Must be between 0% and 100%';
    }

    if (!formData.monthly_rental_income.trim()) {
      newErrors.monthly_rental_income = 'Monthly rental income is required';
    } else {
      const val = parseFloat(formData.monthly_rental_income);
      if (isNaN(val) || val <= 0) newErrors.monthly_rental_income = 'Must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ExpenseFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  }

  function calculateMonthlyExpenses(): number {
    const tax = parseFloat(formData.property_tax) || 0;
    const ins = parseFloat(formData.insurance) || 0;
    const maint = parseFloat(formData.maintenance) || 0;
    const monthlyTax = tax / 12;
    const monthlyIns = ins / 12;
    const monthlyMaint = maint / 12;
    return monthlyTax + monthlyIns + monthlyMaint;
  }

  function calculateNetMonthlyIncome(): string | null {
    const rental = parseFloat(formData.monthly_rental_income);
    if (isNaN(rental) || rental <= 0) return null;

    const vacancyRate = parseFloat(formData.vacancy_rate) || 0;
    const mgmtRate = parseFloat(formData.management_fee) || 0;
    const effectiveRental = rental * (1 - vacancyRate / 100);
    const mgmtCost = effectiveRental * (mgmtRate / 100);
    const expenses = calculateMonthlyExpenses();
    const mortgage = monthlyMortgage || 0;
    const net = effectiveRental - mgmtCost - expenses - mortgage;

    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(net);
  }

  const netIncome = calculateNetMonthlyIncome();
  const fmt = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {purchasePrice && (
        <div className="bg-indigo-50 rounded-lg p-4 text-sm flex justify-between">
          <div>
            <span className="font-medium text-indigo-700">Purchase Price: </span>
            <span className="text-indigo-900">{fmt(purchasePrice)}</span>
          </div>
          {monthlyMortgage && (
            <div>
              <span className="font-medium text-indigo-700">Monthly Mortgage: </span>
              <span className="text-indigo-900">{fmt(monthlyMortgage)}</span>
            </div>
          )}
        </div>
      )}

      <div>
        <label htmlFor="monthly_rental_income" className="block text-sm font-medium text-gray-700 mb-1">
          Expected Monthly Rental Income
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            id="monthly_rental_income"
            name="monthly_rental_income"
            type="number"
            min="0"
            step="100"
            value={formData.monthly_rental_income}
            onChange={handleChange}
            placeholder="3000"
            className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${
              errors.monthly_rental_income ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
        </div>
        {errors.monthly_rental_income && <p className="mt-1 text-sm text-red-600">{errors.monthly_rental_income}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="property_tax" className="block text-sm font-medium text-gray-700 mb-1">
            Annual Property Tax
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              id="property_tax"
              name="property_tax"
              type="number"
              min="0"
              step="100"
              value={formData.property_tax}
              onChange={handleChange}
              placeholder="5000"
              className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${
                errors.property_tax ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.property_tax && <p className="mt-1 text-sm text-red-600">{errors.property_tax}</p>}
        </div>

        <div>
          <label htmlFor="insurance" className="block text-sm font-medium text-gray-700 mb-1">
            Annual Insurance
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              id="insurance"
              name="insurance"
              type="number"
              min="0"
              step="100"
              value={formData.insurance}
              onChange={handleChange}
              placeholder="2400"
              className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${
                errors.insurance ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.insurance && <p className="mt-1 text-sm text-red-600">{errors.insurance}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="maintenance" className="block text-sm font-medium text-gray-700 mb-1">
          Annual Maintenance
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            id="maintenance"
            name="maintenance"
            type="number"
            min="0"
            step="100"
            value={formData.maintenance}
            onChange={handleChange}
            placeholder="1200"
            className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${
              errors.maintenance ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
        </div>
        {errors.maintenance && <p className="mt-1 text-sm text-red-600">{errors.maintenance}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="management_fee" className="block text-sm font-medium text-gray-700 mb-1">
            Management Fee (%)
          </label>
          <input
            id="management_fee"
            name="management_fee"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={formData.management_fee}
            onChange={handleChange}
            placeholder="10"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${
              errors.management_fee ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.management_fee && <p className="mt-1 text-sm text-red-600">{errors.management_fee}</p>}
        </div>

        <div>
          <label htmlFor="vacancy_rate" className="block text-sm font-medium text-gray-700 mb-1">
            Vacancy Rate (%)
          </label>
          <input
            id="vacancy_rate"
            name="vacancy_rate"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={formData.vacancy_rate}
            onChange={handleChange}
            placeholder="5"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${
              errors.vacancy_rate ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.vacancy_rate && <p className="mt-1 text-sm text-red-600">{errors.vacancy_rate}</p>}
        </div>
      </div>

      {netIncome && (
        <div className={`rounded-lg p-4 ${parseFloat(netIncome.replace(/[^-\d.]/g, '')) >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <span className={`text-sm font-medium ${parseFloat(netIncome.replace(/[^-\d.]/g, '')) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            Estimated Net Monthly Cash Flow:{' '}
          </span>
          <span className={`text-lg font-bold ${parseFloat(netIncome.replace(/[^-\d.]/g, '')) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {netIncome}
          </span>
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
          {loading ? 'Saving...' : 'Analyze Deal'}
        </button>
      </div>
    </form>
  );
}
