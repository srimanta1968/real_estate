import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-indigo-600">DealEval</Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
              <span className="font-medium text-indigo-600">Property</span>
              <span className="mx-1">-</span>
              <span className="bg-gray-300 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
              <span>Financing</span>
              <span className="mx-1">-</span>
              <span className="bg-gray-300 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
              <span>Expenses</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Property Information</h1>
          <p className="mt-2 text-gray-500">
            Enter the basic property details to begin your deal analysis.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <PropertyInfoForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </main>
    </div>
  );
}
