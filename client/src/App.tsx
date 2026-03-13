import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PropertyInfoPage from './pages/PropertyInfoPage';
import FinancingPage from './pages/FinancingPage';
import ExpensePage from './pages/ExpensePage';
import CapRatePage from './pages/CapRatePage';
import IrrPage from './pages/IrrPage';
import CashFlowPage from './pages/CashFlowPage';
import ProjectionsPage from './pages/ProjectionsPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/property/new" element={<PropertyInfoPage />} />
      <Route path="/property/financing" element={<FinancingPage />} />
      <Route path="/property/expenses" element={<ExpensePage />} />
      <Route path="/property/analysis" element={<CapRatePage />} />
      <Route path="/property/irr" element={<IrrPage />} />
      <Route path="/property/cashflow" element={<CashFlowPage />} />
      <Route path="/property/projections" element={<ProjectionsPage />} />
      <Route path="/property/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}

export default App;
