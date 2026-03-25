import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AuthModal from '../components/auth/AuthModal';

interface Listing {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lot_size: number | null;
  year_built: number | null;
  property_type: string | null;
  tax_amount: number | null;
  hoa: number | null;
  listing_status: string | null;
  source: string | null;
  source_url: string | null;
  created_at: string;
}

const fmt = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/search/${id}`);
        setListing(res.data.data.listing);
      } catch {
        setError('Listing not found');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleEvaluate = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!listing) return;

    sessionStorage.setItem('propertyInfo', JSON.stringify({
      address: listing.address,
      purchase_price: String(listing.price),
    }));

    if (listing.tax_amount || listing.hoa) {
      const expense: Record<string, string> = {};
      if (listing.tax_amount) expense.property_tax = String(listing.tax_amount);
      sessionStorage.setItem('expenseInfo', JSON.stringify(expense));
    }

    navigate('/property/new');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto">
        {error || !listing ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-medium">{error || 'Listing not found'}</p>
            <Link to="/search" className="mt-4 inline-block text-indigo-600 font-medium hover:text-indigo-700">
              Back to Search
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 py-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white">{listing.address}</h1>
                    <p className="text-indigo-100 mt-1">
                      {listing.city}, {listing.state} {listing.zip}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{fmt(listing.price)}</p>
                    {listing.listing_status && (
                      <span className="inline-block mt-1 text-xs bg-white/20 text-white px-3 py-1 rounded-full">
                        {listing.listing_status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  {listing.beds !== null && (
                    <DetailItem label="Bedrooms" value={String(listing.beds)} />
                  )}
                  {listing.baths !== null && (
                    <DetailItem label="Bathrooms" value={String(listing.baths)} />
                  )}
                  {listing.sqft !== null && (
                    <DetailItem label="Square Feet" value={listing.sqft.toLocaleString()} />
                  )}
                  {listing.lot_size !== null && (
                    <DetailItem label="Lot Size" value={`${listing.lot_size.toLocaleString()} sqft`} />
                  )}
                  {listing.year_built !== null && (
                    <DetailItem label="Year Built" value={String(listing.year_built)} />
                  )}
                  {listing.property_type && (
                    <DetailItem label="Property Type" value={listing.property_type} />
                  )}
                  {listing.tax_amount !== null && (
                    <DetailItem label="Annual Taxes" value={fmt(listing.tax_amount)} />
                  )}
                  {listing.hoa !== null && (
                    <DetailItem label="HOA / Month" value={fmt(listing.hoa)} />
                  )}
                </div>

                {listing.sqft && listing.price > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-8">
                    <p className="text-sm text-gray-500">
                      Price per sqft: <span className="font-semibold text-gray-900">{fmt(listing.price / listing.sqft)}</span>
                    </p>
                  </div>
                )}

                {listing.source_url && (
                  <div className="mb-8">
                    <p className="text-sm text-gray-400">
                      Source: {listing.source || 'External'} —{' '}
                      <a href={listing.source_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                        View Original Listing
                      </a>
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate('/search')}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Back to Search
                  </button>
                  <button
                    onClick={handleEvaluate}
                    className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Evaluate This Property
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          handleEvaluate();
        }}
      />
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase">{label}</p>
      <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
