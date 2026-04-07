import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LayoutWrapper from './components/layout/LayoutWrapper';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import PropertyInfoPage from './pages/PropertyInfoPage';
import FinancingPage from './pages/FinancingPage';
import ExpensePage from './pages/ExpensePage';
import CapRatePage from './pages/CapRatePage';
import IrrPage from './pages/IrrPage';
import CashFlowPage from './pages/CashFlowPage';
import ProjectionsPage from './pages/ProjectionsPage';
import DashboardPage from './pages/DashboardPage';
import ScenarioPage from './pages/ScenarioPage';
import EnhancedDashboardPage from './pages/EnhancedDashboardPage';
import SearchPage from './pages/SearchPage';
import ListingDetailPage from './pages/ListingDetailPage';
import ComparisonPage from './pages/ComparisonPage';
import PricingPage from './pages/PricingPage';
import SubscriptionPage from './pages/SubscriptionPage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FaqPage from './pages/FaqPage';
import FeedbackPage from './pages/FeedbackPage';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Admin
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminRevenuePage from './pages/admin/AdminRevenuePage';
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage';
import AdminEmailsPage from './pages/admin/AdminEmailsPage';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Standalone pages (no sidebar) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FaqPage />} />

        {/* Admin pages (separate login, dark theme, hidden from customers) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminProtectedRoute><AdminLayout><AdminDashboardPage /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/users" element={<AdminProtectedRoute><AdminLayout><AdminUsersPage /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/revenue" element={<AdminProtectedRoute><AdminLayout><AdminRevenuePage /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/feedback" element={<AdminProtectedRoute><AdminLayout><AdminFeedbackPage /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/emails" element={<AdminProtectedRoute><AdminLayout><AdminEmailsPage /></AdminLayout></AdminProtectedRoute>} />

        {/* App pages with sidebar layout */}
        <Route element={<LayoutWrapper />}>
          {/* Public pages (no login required) */}
          <Route path="/search" element={<SearchPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/subscription/success" element={<PricingPage />} />
          <Route path="/subscription/cancelled" element={<PricingPage />} />

          {/* Protected pages (login required) */}
          <Route path="/dashboard" element={<ProtectedRoute><EnhancedDashboardPage /></ProtectedRoute>} />
          <Route path="/listing/:id" element={<ProtectedRoute><ListingDetailPage /></ProtectedRoute>} />
          <Route path="/compare" element={<ProtectedRoute><ComparisonPage /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
          <Route path="/property/new" element={<ProtectedRoute><PropertyInfoPage /></ProtectedRoute>} />
          <Route path="/property/financing" element={<ProtectedRoute><FinancingPage /></ProtectedRoute>} />
          <Route path="/property/expenses" element={<ProtectedRoute><ExpensePage /></ProtectedRoute>} />
          <Route path="/property/analysis" element={<ProtectedRoute><CapRatePage /></ProtectedRoute>} />
          <Route path="/property/irr" element={<ProtectedRoute><IrrPage /></ProtectedRoute>} />
          <Route path="/property/cashflow" element={<ProtectedRoute><CashFlowPage /></ProtectedRoute>} />
          <Route path="/property/projections" element={<ProtectedRoute><ProjectionsPage /></ProtectedRoute>} />
          <Route path="/property/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/property/scenarios" element={<ProtectedRoute><ScenarioPage /></ProtectedRoute>} />
          <Route path="/settings/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
