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

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Standalone pages (no sidebar) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* App pages with sidebar layout */}
        <Route element={<LayoutWrapper />}>
          <Route path="/dashboard" element={<EnhancedDashboardPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/compare" element={<ComparisonPage />} />
          <Route path="/property/new" element={<PropertyInfoPage />} />
          <Route path="/property/financing" element={<FinancingPage />} />
          <Route path="/property/expenses" element={<ExpensePage />} />
          <Route path="/property/analysis" element={<CapRatePage />} />
          <Route path="/property/irr" element={<IrrPage />} />
          <Route path="/property/cashflow" element={<CashFlowPage />} />
          <Route path="/property/projections" element={<ProjectionsPage />} />
          <Route path="/property/dashboard" element={<DashboardPage />} />
          <Route path="/property/scenarios" element={<ScenarioPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
