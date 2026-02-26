import { redirect } from 'next/navigation';
import { ARTKEY_ADMIN_DASHBOARD_PATH } from '@/lib/routes';

export default function AdminPage() {
  redirect(ARTKEY_ADMIN_DASHBOARD_PATH);
}
