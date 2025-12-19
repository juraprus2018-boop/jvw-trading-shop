import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminProducts } from '@/components/admin/AdminProducts';
import { AdminOrders } from '@/components/admin/AdminOrders';
import { AdminPurchaseRequests } from '@/components/admin/AdminPurchaseRequests';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="producten" element={<AdminProducts />} />
        <Route path="bestellingen" element={<AdminOrders />} />
        <Route path="inkoop" element={<AdminPurchaseRequests />} />
      </Routes>
    </AdminLayout>
  );
}
