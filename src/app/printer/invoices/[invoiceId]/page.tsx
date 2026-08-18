import { getPrinterInvoiceById } from "@/app/actions/invoice-actions";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { IndianRupee, ArrowLeft, ShieldCheck, Building2, Phone, Mail, Ban, CheckCircle2, Clock, Banknote, User2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InvoiceActions } from "./invoice-actions";
import { getGstStateInfo, SUPPLIER_GSTIN, SUPPLIER_STATE_CODE, SUPPLIER_STATE_NAME } from "@/lib/gst";

export default async function PrinterInvoiceDetailsPage({ params }: { params: Promise<{ invoiceId: string }> }) {
    const { invoiceId } = await params;
    const id = parseInt(invoiceId, 10);
    
    if (isNaN(id)) {
        notFound();
    }

    const session = await getSession();
    if (!session) {
        notFound();
    }

    const invoice = await getPrinterInvoiceById(id);
    if (!invoice) {
        notFound();
    }

    const isAdmin = ['admin', 'super_admin', 'company_admin'].includes(session.role);
    const backUrl = isAdmin ? '/admin/printer-invoices' : '/printer/invoices';

    const printer = invoice.printer;
    const order = invoice.order;
    const printerName = printer.companyName || printer.fullName || 'Print Vendor';
    
    const isDirectSale = !!order?.directSellingProduct;
    const productName = isDirectSale ? order.directSellingProduct?.name : (order?.product?.name || 'Custom Print Production');

    // Parse items
    const items = (invoice.invoiceItems as Array<{ description: string; qty: number; unitPrice: number; total?: number }>) || [];
    const totalAmount = parseFloat(invoice.amount) || 0;
    
    const fallbackItems = [{
        description: `Printing & fabrication for order: ${productName}`,
        qty: order?.quantity || 1,
        unitPrice: totalAmount / (order?.quantity || 1),
        total: totalAmount
    }];

    const displayItems = items.length > 0 ? items : fallbackItems;

    // GST logic with unified Indian GST state code mapping
    const hasGst = !!printer.gstNumber?.trim();
    const printerStateInfo = getGstStateInfo(printer.state, printer.gstNumber);
    const isIntrastate = printerStateInfo.isIntrastate;
    const gstRate = 0.18;
    const taxableAmount = hasGst ? (totalAmount / (1 + gstRate)) : totalAmount;
    const gstAmount = totalAmount - taxableAmount;

    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        pending: {
            label: 'Pending Review',
            color: 'text-amber-600 print:text-amber-700 font-extrabold',
            icon: <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 print:hidden" />
        },
        approved: {
            label: 'Approved',
            color: 'text-blue-600 print:text-blue-700 font-extrabold',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 print:hidden" />
        },
        paid: {
            label: 'Paid & Settled',
            color: 'text-emerald-600 print:text-emerald-700 font-extrabold',
            icon: <Banknote className="w-3.5 h-3.5 text-emerald-500 shrink-0 print:hidden" />
        },
        rejected: {
            label: 'Rejected',
            color: 'text-rose-600 print:text-rose-700 font-extrabold',
            icon: <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0 print:hidden" />
        }
    };

    const currentStatus = statusConfig[invoice.status] || statusConfig.pending;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-5 px-3 sm:px-6 font-sans text-slate-900 dark:text-slate-100 selection:bg-violet-500 selection:text-white">
            <div className="max-w-3xl mx-auto space-y-4">
                
                {/* Floating Non-Printable Action Bar (Compact) */}
                <div className="print:hidden flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 dark:bg-slate-900/80 backdrop-blur-xl text-white p-3.5 rounded-2xl shadow-lg border border-slate-800">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl h-8 text-xs">
                            <Link href={backUrl}>
                                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Invoices
                            </Link>
                        </Button>
                        <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />
                        <div>
                            <h2 className="text-xs font-black tracking-tight text-violet-400 uppercase">Print Partner Vendor Invoice</h2>
                            <p className="text-[10px] text-slate-400 font-medium">Ready for PDF download & print</p>
                        </div>
                    </div>
                    
                    <InvoiceActions />
                </div>

                {/* Printable Invoice Sheet (20% Reduced Footprint) */}
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 print:p-0 print:shadow-none print:border-none print:bg-white print:text-black">
                    
                    {/* Header: Printer Info vs Invoice Title */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
                        <div className="space-y-2">
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 print:text-slate-600 block">
                                    PRINT PRODUCTION VENDOR
                                </span>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white print:text-black flex items-center gap-1.5">
                                    <Building2 className="w-5 h-5 text-violet-600 print:text-slate-800" />
                                    {printerName}
                                </h1>
                            </div>
                            <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 print:text-slate-700 font-medium leading-tight">
                                {printer.address && <p>{printer.address}</p>}
                                <p>
                                    {[printer.city, printerStateInfo.stateName, printer.postalCode].filter(Boolean).join(', ')}
                                    {printer.country && ` · ${printer.country}`}
                                </p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 print:text-slate-900 text-[10px]">
                                    State Code: {printerStateInfo.stateCode} ({printerStateInfo.stateName})
                                </p>
                                <p className="pt-0.5 flex items-center gap-2 text-[10px]">
                                    {printer.phone && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" /> {printer.phone}</span>}
                                    <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" /> {printer.email}</span>
                                </p>
                                {hasGst && (
                                    <p className="text-[10px] text-violet-600 dark:text-violet-400 font-bold tracking-wider pt-0.5 uppercase">
                                        GSTIN: {printer.gstNumber}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="sm:text-right space-y-1">
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white print:text-black uppercase">
                                Invoice
                            </h2>
                            <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 print:text-slate-700">
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Invoice No:</span> <span className="font-mono font-bold text-violet-600 print:text-slate-900">{invoice.invoiceNumber}</span></p>
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Invoice Date:</span> {format(new Date(invoice.createdAt || invoice.sentAt || new Date()), 'dd MMM yyyy')}</p>
                                {order && <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Order Ref:</span> ORD-#{order.id}</p>}
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">GST State Code:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{SUPPLIER_STATE_CODE}</span></p>
                                <p className="flex items-center sm:justify-end gap-1 pt-0.5">
                                    <span className="font-bold text-slate-900 dark:text-white print:text-black">Status:</span>
                                    {currentStatus.icon}
                                    <span className={currentStatus.color}>{currentStatus.label}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Parties Info Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 print:text-slate-500">
                                Billed To (Buyer)
                            </h3>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200/60 dark:border-slate-800/60 print:border-slate-300 space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300 print:text-slate-800 font-medium">
                                <p className="font-extrabold text-xs text-slate-900 dark:text-white print:text-black">AMAZOPRINT</p>
                                <p>No.21/2, Udayarpalayam, Attur Mainroad</p>
                                <p>Udayarpalayam, Thammampatti - 636113</p>
                                <p>Tamil Nadu, India (State Code: {SUPPLIER_STATE_CODE})</p>
                                <p className="pt-1 font-bold text-slate-800 dark:text-slate-200 print:text-slate-900">GSTIN: {SUPPLIER_GSTIN}</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 print:text-slate-500">
                                Client Order Reference
                            </h3>
                            {order ? (
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200/60 dark:border-slate-800/60 print:border-slate-300 space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300 print:text-slate-800 font-medium">
                                    <p className="font-extrabold text-xs text-slate-900 dark:text-white print:text-black">Order #{order.id}</p>
                                    <p><span className="text-slate-500">Product:</span> {productName}</p>
                                    <p><span className="text-slate-500">End Customer:</span> {order.user.name}</p>
                                    <p><span className="text-slate-500">Order Quantity:</span> {order.quantity} units</p>
                                    <p><span className="text-slate-500">Production Status:</span> <span className="uppercase font-bold text-emerald-600">{order.orderStatus}</span></p>
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center text-[11px] text-slate-400 italic">
                                    Order details not available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Particulars Table */}
                    <div className="py-4 space-y-2.5 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 print:text-slate-500">
                            Service Particulars
                        </h3>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 print:border-slate-400 text-[10px] font-extrabold text-slate-900 dark:text-white print:text-black uppercase tracking-wider">
                                        <th className="py-2 px-2.5">#</th>
                                        <th className="py-2 px-2.5">Item Description</th>
                                        <th className="py-2 px-2.5 text-center">Qty</th>
                                        <th className="py-2 px-2.5 text-right">Unit Rate</th>
                                        <th className="py-2 px-2.5 text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] font-medium divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">
                                    {displayItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 print:hover:bg-transparent">
                                            <td className="py-2.5 px-2.5 font-bold text-slate-500">{idx + 1}</td>
                                            <td className="py-2.5 px-2.5 space-y-0.5">
                                                <p className="font-extrabold text-xs text-slate-900 dark:text-white print:text-black">{item.description}</p>
                                            </td>
                                            <td className="py-2.5 px-2.5 text-center font-extrabold text-slate-900 dark:text-white print:text-black">{item.qty}</td>
                                            <td className="py-2.5 px-2.5 text-right font-mono">₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            <td className="py-2.5 px-2.5 text-right font-mono font-extrabold text-slate-900 dark:text-white print:text-black">
                                                ₹{(item.total || (item.qty * item.unitPrice)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary & Split GST */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 py-4 border-b border-slate-200 dark:border-slate-800 print:border-slate-300 items-start">
                        <div className="sm:col-span-7 space-y-2.5">
                            {/* Notes / Remarks */}
                            {(invoice.notes || invoice.adminNote) && (
                                <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60">
                                    {invoice.notes && (
                                        <div className="text-[10px] leading-normal">
                                            <p className="font-bold text-slate-900 dark:text-white mb-0.5">Vendor Remarks:</p>
                                            <p className="text-slate-500 dark:text-slate-400 italic">"{invoice.notes}"</p>
                                        </div>
                                    )}
                                    {invoice.adminNote && (
                                        <div className="text-[10px] leading-normal pt-1.5 border-t border-slate-200 dark:border-slate-700">
                                            <p className="font-bold text-amber-600 dark:text-amber-400 mb-0.5">Admin Feedback:</p>
                                            <p className="text-amber-700 dark:text-amber-500 italic">"{invoice.adminNote}"</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <div className="space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-600 leading-normal font-medium">
                                <p className="font-extrabold text-slate-900 dark:text-white print:text-black text-[11px] uppercase tracking-wider mb-1">Terms & Declarations</p>
                                <p>1. Tax categorized under <span className="font-bold text-slate-700 dark:text-slate-300 print:text-black">{isIntrastate ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}</span> based on Vendor State ({printerStateInfo.stateCode} - {printerStateInfo.stateName}).</p>
                                <p>2. Goods/services supplied strictly in accordance with order requirements.</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-600 print:text-slate-800 pt-0.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-violet-500" /> Print Vendor Partner Verified
                            </div>
                        </div>

                        <div className="sm:col-span-5 space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200/60 dark:border-slate-800/60 print:border-slate-300 font-medium text-[11px]">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">Subtotal (Taxable Value)</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            {hasGst ? (
                                <>
                                    {isIntrastate ? (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">
                                                    CGST (9%) <span className="text-[9px] text-slate-400">[{printerStateInfo.stateCode}]</span>
                                                </span>
                                                <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">₹{(gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">
                                                    SGST (9%) <span className="text-[9px] text-slate-400">[{printerStateInfo.stateCode}]</span>
                                                </span>
                                                <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">₹{(gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">
                                                IGST (18%) <span className="text-[9px] text-slate-400">[{printerStateInfo.stateCode}]</span>
                                            </span>
                                            <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex justify-between items-center text-slate-400">
                                    <span>GST (Exempted/Unregistered)</span>
                                    <span>₹0.00</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2.5 mt-1 border-t-2 border-slate-900 dark:border-white print:border-black">
                                <div className="space-y-0.2">
                                    <span className="text-[11px] font-black text-slate-900 dark:text-white print:text-black uppercase tracking-wider block">Grand Total</span>
                                    <span className="text-[8px] font-bold text-slate-400 print:text-slate-500 uppercase tracking-widest block">Net Payable</span>
                                </div>
                                <div className="flex items-center gap-0.5 text-violet-600 dark:text-violet-400 print:text-black">
                                    <IndianRupee className="w-4 h-4 font-extrabold" />
                                    <span className="text-2xl font-black font-mono tracking-tighter">
                                        {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Signatory / Verification */}
                    <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 print:text-slate-600">
                        <div className="space-y-0.5 text-center sm:text-left">
                            <p className="font-bold text-slate-900 dark:text-white print:text-black">Thank you for your valuable partnership!</p>
                            <p>For payout queries: <span className="text-violet-600 print:text-slate-800 font-bold">finance@amazoprint.com</span></p>
                        </div>

                        <div className="text-center sm:text-right space-y-1">
                            <div className="h-8 w-24 border-b border-dashed border-slate-400 print:border-slate-500 mx-auto sm:ml-auto flex items-end justify-center">
                                <span className="font-mono font-bold text-violet-600/40 dark:text-violet-400/40 print:text-slate-800/40 text-[8px] tracking-widest uppercase">Verified Hub</span>
                            </div>
                            <p className="font-extrabold text-slate-900 dark:text-white print:text-black text-[10px]">Authorized Signatory</p>
                            <p className="text-[9px] uppercase">{printerName}</p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
