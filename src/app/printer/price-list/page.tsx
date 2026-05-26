import { getPrinterPriceList } from "@/app/actions/price-list-actions";
import { PriceListClient } from "./PriceListClient";

export default async function PrinterPriceListPage() {
    const priceList = await getPrinterPriceList();

    // Map database decimal strings to numeric types for the client UI
    const mappedPriceList = priceList.map(item => ({
        ...item,
        qty250: item.qty250 ? Number(item.qty250) : null,
        qty500: item.qty500 ? Number(item.qty500) : null,
        qty1000: item.qty1000 ? Number(item.qty1000) : null,
        qty5000: item.qty5000 ? Number(item.qty5000) : null,
    }));

    return (
        <PriceListClient initialPriceList={mappedPriceList as any} />
    );
}
