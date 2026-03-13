import { useState, FormEvent } from 'react';
import { PropertyInfoFormData } from '../../types/property';

interface PropertyInfoFormProps {
  onSubmit: (data: PropertyInfoFormData) => void;
  initialData?: PropertyInfoFormData;
  loading?: boolean;
}

export default function PropertyInfoForm({ onSubmit, initialData, loading = false }: PropertyInfoFormProps) {
  const [formData, setFormData] = useState<PropertyInfoFormData>(
    initialData || { address: '', purchase_price: '' }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof PropertyInfoFormData, string>>>({});

  function validate(): boolean {
    const newErrors: Partial<Record<keyof PropertyInfoFormData, string>> = {};

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.purchase_price.trim()) {
      newErrors.purchase_price = 'Purchase price is required';
    } else {
      const price = parseFloat(formData.purchase_price);
      if (isNaN(price) || price <= 0) {
        newErrors.purchase_price = 'Purchase price must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof PropertyInfoFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  }

  function formatCurrency(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Property Address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          value={formData.address}
          onChange={handleChange}
          placeholder="123 Main St, City, State ZIP"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
            errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address}</p>
        )}
      </div>

      <div>
        <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700 mb-1">
          Purchase Price
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            id="purchase_price"
            name="purchase_price"
            type="number"
            min="0"
            step="1000"
            value={formData.purchase_price}
            onChange={handleChange}
            placeholder="500000"
            className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
              errors.purchase_price ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
        </div>
        {errors.purchase_price && (
          <p className="mt-1 text-sm text-red-600">{errors.purchase_price}</p>
        )}
        {formData.purchase_price && !errors.purchase_price && (
          <p className="mt-1 text-sm text-gray-500">{formatCurrency(formData.purchase_price)}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Saving...' : 'Continue to Financing'}
      </button>
    </form>
  );
}
