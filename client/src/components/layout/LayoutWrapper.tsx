import { Outlet } from 'react-router-dom';
import AppLayout from './AppLayout';

export default function LayoutWrapper() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
