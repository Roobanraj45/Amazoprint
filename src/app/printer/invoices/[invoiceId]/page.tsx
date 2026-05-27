import { getPrinterInvoiceById } from "@/app/actions/invoice-actions";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { IndianRupee, ArrowLeft, ShieldCheck, Building2, Phone, Mail, Ban, CheckCircle2, Clock, Banknote, User2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AmazoprintLogo } from "@/components/ui/logo";
import { InvoiceActions } from "./invoice-actions";

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

    // GST logic
    const hasGst = !!printer.gstNumber?.trim();
    const gstRate = 0.18;
    const taxableAmount = hasGst ? (totalAmount / (1 + gstRate)) : totalAmount;
    const gstAmount = totalAmount - taxableAmount;

    // State check for intrastate (Tamilnadu check)
    const printerState = (printer.state || '').toLowerCase().replace(/\s+/g, '');
    const isIntrastate = printerState.includes('tamilnadu') || printerState.includes('tamil');

    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        pending: {
            label: 'Pending Review',
            color: 'text-amber-600 print:text-amber-700 font-extrabold',
            icon: <Clock className="w-4 h-4 text-amber-500 shrink-0 print:hidden" />
        },
        approved: {
            label: 'Approved',
            color: 'text-blue-600 print:text-blue-700 font-extrabold',
            icon: <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 print:hidden" />
        },
        paid: {
            label: 'Paid & Settled',
            color: 'text-emerald-600 print:text-emerald-700 font-extrabold',
            icon: <Banknote className="w-4 h-4 text-emerald-500 shrink-0 print:hidden" />
        },
        rejected: {
            label: 'Rejected',
            color: 'text-rose-600 print:text-rose-700 font-extrabold',
            icon: <Ban className="w-4 h-4 text-rose-500 shrink-0 print:hidden" />
        }
    };

    const currentStatus = statusConfig[invoice.status] || statusConfig.pending;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 dark:text-slate-100 selection:bg-violet-500 selection:text-white">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Floating Non-Printable Action Bar */}
                <div className="print:hidden flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 dark:bg-slate-900/80 backdrop-blur-xl text-white p-6 rounded-3xl shadow-2xl border border-slate-800">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl">
                            <Link href={backUrl}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Invoices
                            </Link>
                        </Button>
                        <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />
                        <div>
                            <h2 className="text-base font-extrabold tracking-tight">Print Hub Vendor Invoice</h2>
                            <p className="text-xs text-slate-400 font-medium">Ready for PDF download & record keeping</p>
                        </div>
                    </div>
                    
                    <InvoiceActions />
                </div>

                {/* Printable Invoice Sheet */}
                <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 print:p-0 print:shadow-none print:border-none print:bg-white print:text-black">
                    
                    {/* Header: Printer Info vs Invoice Title */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pb-8 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
                        <div className="space-y-3">
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white print:text-black flex items-center gap-2">
                                <Building2 className="w-6 h-6 text-violet-600 print:text-slate-800" />
                                {printerName}
                            </h1>
                            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 print:text-slate-700 font-medium">
                                {printer.address && <p>{printer.address}</p>}
                                <p>
                                    {[printer.city, printer.state, printer.postalCode].filter(Boolean).join(', ')}
                                    {printer.country && ` · ${printer.country}`}
                                </p>
                                <p className="pt-1 flex items-center gap-3">
                                    {printer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {printer.phone}</span>}
                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {printer.email}</span>
                                </p>
                                {hasGst && (
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 print:text-slate-500 font-bold tracking-wider pt-1 uppercase">
                                        GSTIN: {printer.gstNumber}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="sm:text-right space-y-2">
                            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white print:text-black uppercase">
                                Invoice
                            </h2>
                            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 print:text-slate-700">
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Invoice No:</span> <span className="font-mono font-bold text-violet-600 dark:text-violet-400 print:text-black">{invoice.invoiceNumber}</span></p>
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Invoice Date:</span> {format(new Date(invoice.createdAt || invoice.sentAt || new Date()), 'dd MMM yyyy')}</p>
                                {order && <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Order Ref:</span> #{order.id}</p>}
                                <p className="flex items-center sm:justify-end gap-1.5 pt-0.5">
                                    <span className="font-bold text-slate-900 dark:text-white print:text-black">Status:</span>
                                    {currentStatus.icon}
                                    <span className={currentStatus.color}>{currentStatus.label}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Parties Info Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
                        <div className="space-y-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 print:text-slate-500">
                                Billed To (Client / Platform)
                            </h3>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200/60 dark:border-slate-800/60 print:border-slate-300 space-y-1 text-xs text-slate-700 dark:text-slate-300 print:text-slate-800 font-medium">
                                <p className="font-extrabold text-sm text-slate-900 dark:text-white print:text-black">AMAZOPRINT</p>
                                <p>No.21/2, Udayarpalayam, Attur Mainroad</p>
                                <p>Udayarpalayam, Thammampatti - 636113</p>
                                <p>Tamilnadu, India.</p>
                                <p className="pt-2 font-bold text-slate-600 dark:text-slate-400 print:text-slate-600">GSTIN: 33BNLPK5597H1ZJ</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 print:text-slate-500">
                                Production Order Context
                            </h3>
                            {order ? (
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200/60 dark:border-slate-800/60 print:border-slate-300 space-y-1 text-xs text-slate-700 dark:text-slate-300 print:text-slate-800 font-medium">
                                    <p className="font-extrabold text-sm text-slate-900 dark:text-white print:text-black">Order #{order.id}</p>
                                    <p><span className="text-slate-400 print:text-slate-500 font-bold">Product:</span> {productName}</p>
                                    <p><span className="text-slate-400 print:text-slate-500 font-bold">Customer:</span> {order.user.name}</p>
                                    <p><span className="text-slate-400 print:text-slate-500 font-bold">Qty Ordered:</span> {order.quantity} units</p>
                                    <p><span className="text-slate-400 print:text-slate-500 font-bold">Completion:</span> {order.updatedAt ? format(new Date(order.updatedAt), 'dd MMM yyyy') : '—'}</p>
                                </div>
                            ) : (
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200/60 dark:border-slate-800/60 print:border-slate-300 flex items-center justify-center h-[116px] text-xs text-slate-400 italic">
                                    Order details not available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Particulars Table */}
                    <div className="py-8 space-y-4 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 print:text-slate-500">
                            Service Particulars & Line Items
                        </h3>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-200 dark:border-slate-800 print:border-slate-400 text-xs font-extrabold text-slate-900 dark:text-white print:text-black">
                                        <th className="py-3 px-4">#</th>
                                        <th className="py-3 px-4">Item Description</th>
                                        <th className="py-3 px-4 text-center">Qty</th>
                                        <th className="py-3 px-4 text-right">Unit Rate</th>
                                        <th className="py-3 px-4 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-medium divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">
                                    {displayItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 print:hover:bg-transparent">
                                            <td className="py-4 px-4 font-bold text-slate-500">{idx + 1}</td>
                                            <td className="py-4 px-4">
                                                <p className="font-extrabold text-slate-900 dark:text-white print:text-black">{item.description}</p>
                                            </td>
                                            <td className="py-4 px-4 text-center font-extrabold text-slate-900 dark:text-white print:text-black">{item.qty}</td>
                                            <td className="py-4 px-4 text-right font-mono">₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            <td className="py-4 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-white print:text-black">
                                                ₹{(item.total || (item.qty * item.unitPrice)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 py-8 border-b border-slate-200 dark:border-slate-800 print:border-slate-300 items-start">
                        <div className="sm:col-span-7 space-y-4">
                            {/* Notes / Remarks */}
                            {(invoice.notes || invoice.adminNote) && (
                                <div className="space-y-3">
                                    {invoice.notes && (
                                        <div className="text-xs leading-relaxed">
                                            <p className="font-bold text-slate-900 dark:text-white print:text-black mb-1">Vendor Remarks:</p>
                                            <p className="text-slate-500 dark:text-slate-400 print:text-slate-600 italic">"{invoice.notes}"</p>
                                        </div>
                                    )}
                                    {invoice.adminNote && (
                                        <div className="text-xs leading-relaxed p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-xl">
                                            <p className="font-bold text-amber-800 dark:text-amber-400 mb-1">Admin Feedback:</p>
                                            <p className="text-amber-700 dark:text-amber-500 italic">"{invoice.adminNote}"</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-600 leading-relaxed font-medium">
                                <p className="font-extrabold text-slate-900 dark:text-white print:text-black text-xs uppercase tracking-wider mb-2">Terms & Declarations</p>
                                <p>1. The goods/services are supplied strictly in accordance with client order requirements.</p>
                                <p>2. This is a digital tax invoice generated directly from the print partner network.</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-violet-600 print:text-slate-800 pt-2">
                                <ShieldCheck className="w-4 h-4 text-violet-500" /> Print Vendor Partner Verified
                            </div>
                        </div>

                        <div className="sm:col-span-5 space-y-3 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200/60 dark:border-slate-800/60 print:border-slate-300 font-medium">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">Subtotal (Taxable Value)</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            {hasGst ? (
                                <>
                                    {isIntrastate ? (
                                        <>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">CGST (9%)</span>
                                                <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">₹{(gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">SGST (9%)</span>
                                                <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">₹{(gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">IGST (18%)</span>
                                            <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex justify-between items-center text-xs text-slate-400">
                                    <span>GST (Exempted/Unregistered)</span>
                                    <span>₹0.00</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-slate-900 dark:border-white print:border-black">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-black text-slate-900 dark:text-white print:text-black uppercase tracking-wider block">Grand Total</span>
                                    <span className="text-[9px] font-bold text-slate-400 print:text-slate-500 uppercase tracking-widest block">Net Payable</span>
                                </div>
                                <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 print:text-black">
                                    <IndianRupee className="w-5 h-5 font-extrabold" />
                                    <span className="text-3xl font-black font-mono tracking-tighter">
                                        {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Signatory / Verification */}
                    <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-6 text-xs text-slate-500 print:text-slate-600">
                        <div className="space-y-1 text-center sm:text-left">
                            <p className="font-bold text-slate-900 dark:text-white print:text-black">Thank you for your valuable partnership!</p>
                            <p>For payout support, email <span className="text-violet-600 print:text-slate-800 font-bold">finance@amazoprint.com</span></p>
                        </div>

                        <div className="text-center sm:text-right space-y-2">
                            <div className="h-12 w-32 border-b border-dashed border-slate-400 print:border-slate-500 mx-auto sm:ml-auto mb-1 flex items-end justify-center">
                                <span className="font-mono font-bold text-violet-600/30 dark:text-violet-400/30 print:text-slate-800/40 text-[9px] tracking-widest uppercase">Verified Hub Partner</span>
                            </div>
                            <p className="font-extrabold text-slate-900 dark:text-white print:text-black text-[11px]">Authorized Signatory</p>
                            <p className="text-[10px] uppercase">{printerName}</p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
