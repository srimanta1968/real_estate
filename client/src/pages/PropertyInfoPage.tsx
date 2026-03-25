import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropertyInfoForm from '../components/property/PropertyInfoForm';
import { PropertyInfoFormData } from '../types/property';

export default function PropertyInfoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  function handleSubmit(data: PropertyInfoFormData) {
    setLoading(true);
    // Store in session for multi-step flow
    sessionStorage.setItem('propertyInfo', JSON.stringify(data));
    setLoading(false);
    navigate('/property/financing');
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
        <span className="font-medium text-indigo-600">Property</span>
        <span className="mx-1">-</span>
        <span className="bg-gray-300 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
        <span>Financing</span>
        <span className="mx-1">-</span>
        <span className="bg-gray-300 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
        <span>Expenses</span>
      </div>

      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Property Information</h1>
          <p className="mt-2 text-gray-500">
            Enter the basic property details to begin your deal analysis.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <PropertyInfoForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>
    </div>
  );
}
