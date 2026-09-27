// app/admin/layout.js
'use client';

import { useAuth } from '../auth/authContext';
import AdminHeader from '../Components/navigation/adminNavigation';

export default function AdminLayout({ children }) {
  const { currentUser } = useAuth();
  const plan = currentUser?.plan ?? 'free';

  return (
    <div>
      <AdminHeader currentUser={currentUser} plan={plan} />
      <main>{children}</main>
    </div>
  );
}