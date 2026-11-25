import { getAllPriceListsAdmin } from '@/app/actions/price-list-actions';
import { AdminPriceListsClient } from './AdminPriceListsClient';

export default async function AdminPrinterPriceListsPage() {
  const priceLists = await getAllPriceListsAdmin();
  return <AdminPriceListsClient initialPriceLists={priceLists as any} />;
}
