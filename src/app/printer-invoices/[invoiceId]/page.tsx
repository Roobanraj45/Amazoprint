import { getPrinterInvoiceById } from "@/app/actions/invoice-actions";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { IndianRupee, ArrowLeft, ShieldCheck, Building2, Phone, Mail, Ban, CheckCircle2, Clock, Banknote } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InvoiceActions } from "./invoice-actions";

export default async function StandalonePrinterInvoicePage({ params }: { params: Promise<{ invoiceId: string }> }) {
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
            color: 'text-amber-600 font-extrabold',
            icon: <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        },
        approved: {
            label: 'Approved',
            color: 'text-blue-600 font-extrabold',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        },
        paid: {
            label: 'Paid & Settled',
            color: 'text-emerald-600 font-extrabold',
            icon: <Banknote className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        },
        rejected: {
            label: 'Rejected',
            color: 'text-rose-600 font-extrabold',
            icon: <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        }
    };

    const currentStatus = statusConfig[invoice.status] || statusConfig.pending;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-6 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 dark:text-slate-100 selection:bg-violet-500 selection:text-white">
            {/* Embedded styles to strip default margins & force rich color printing */}
            <style dangerouslySetInnerHTML={{ __html: `
                @page {
                    margin: 0 !important;
                }
                @media print {
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background-color: #f8fafc !important;
                        padding: 1.5cm !important;
                        margin: 0 !important;
                    }
                    .print-card {
                        background-color: #ffffff !important;
                        border-radius: 1rem !important;
                        box-shadow: none !important;
                        border: 1px solid #e2e8f0 !important;
                        padding: 2rem !important;
                    }
                    /* Ensure print colors are preserved */
                    .bg-slate-50 {
                        background-color: #f8fafc !important;
                    }
                    .text-violet-600 {
                        color: #7c3aed !important;
                    }
                    .text-emerald-600 {
                        color: #059669 !important;
                    }
                }
            `}} />

            <div className="max-w-3xl mx-auto space-y-4">
                
                {/* Floating Non-Printable Action Bar */}
                <div className="print:hidden flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 dark:bg-slate-900/80 backdrop-blur-xl text-white p-5 rounded-2xl shadow-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl h-8 text-xs">
                            <Link href={backUrl}>
                                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                            </Link>
                        </Button>
                        <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />
                        <div>
                            <h2 className="text-xs font-black tracking-wider uppercase text-violet-400">Vendor Invoice</h2>
                            <p className="text-[10px] text-slate-400 font-medium">Ready for PDF download & printing</p>
                        </div>
                    </div>
                    
                    <InvoiceActions />
                </div>

                {/* Printable Invoice Sheet */}
                <div className="print-card bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800/80">
                    
                    {/* Header: Printer Info vs Invoice Title */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="space-y-2">
                            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Building2 className="w-5 h-5 text-violet-600" />
                                {printerName}
                            </h1>
                            <div className="space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                {printer.address && <p>{printer.address}</p>}
                                <p>
                                    {[printer.city, printer.state, printer.postalCode].filter(Boolean).join(', ')}
                                    {printer.country && ` · ${printer.country}`}
                                </p>
                                <p className="pt-0.5 flex items-center gap-2.5">
                                    {printer.phone && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" /> {printer.phone}</span>}
                                    <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" /> {printer.email}</span>
                                </p>
                                {hasGst && (
                                    <p className="text-[9px] text-slate-400 font-bold tracking-wider pt-0.5 uppercase">
                                        GSTIN: {printer.gstNumber}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="sm:text-right space-y-1">
                            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                                Invoice
                            </h2>
                            <div className="space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <p><span className="font-bold text-slate-900 dark:text-white">Invoice No:</span> <span className="font-mono font-bold text-violet-600">{invoice.invoiceNumber}</span></p>
                                <p><span className="font-bold text-slate-900 dark:text-white">Date:</span> {format(new Date(invoice.createdAt || invoice.sentAt || new Date()), 'dd MMM yyyy')}</p>
                                {order && <p><span className="font-bold text-slate-900 dark:text-white">Order Ref:</span> #{order.id}</p>}
                                <p className="flex items-center sm:justify-end gap-1 pt-0.5">
                                    <span className="font-bold text-slate-900 dark:text-white">Status:</span>
                                    {currentStatus.icon}
                                    <span className={currentStatus.color}>{currentStatus.label}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Parties Info Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="space-y-1.5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                Billed To
                            </h3>
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                                <p className="font-extrabold text-xs text-slate-900 dark:text-white">AMAZOPRINT</p>
                                <p>No.21/2, Udayarpalayam, Attur Mainroad</p>
                                <p>Udayarpalayam, Thammampatti - 636113</p>
                                <p>Tamilnadu, India.</p>
                                <p className="pt-1.5 font-bold text-slate-600 dark:text-slate-400">GSTIN: 33BNLPK5597H1ZJ</p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                Order Details
                            </h3>
                            {order ? (
                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                                    <p className="font-extrabold text-xs text-slate-900 dark:text-white">Order #{order.id}</p>
                                    <p><span className="text-slate-400 font-bold">Product:</span> {productName}</p>
                                    <p><span className="text-slate-400 font-bold">Customer:</span> {order.user.name}</p>
                                    <p><span className="text-slate-400 font-bold">Qty Ordered:</span> {order.quantity} units</p>
                                    <p><span className="text-slate-400 font-bold">Completion:</span> {order.updatedAt ? format(new Date(order.updatedAt), 'dd MMM yyyy') : '—'}</p>
                                </div>
                            ) : (
                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center h-[96px] text-[11px] text-slate-400 italic">
                                    Order details not available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Particulars Table */}
                    <div className="py-6 space-y-3 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            Service Particulars
                        </h3>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                                        <th className="py-2 px-3">#</th>
                                        <th className="py-2 px-3">Item Description</th>
                                        <th className="py-2 px-3 text-center">Qty</th>
                                        <th className="py-2 px-3 text-right">Unit Rate</th>
                                        <th className="py-2 px-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] font-medium divide-y divide-slate-100 dark:divide-slate-800">
                                    {displayItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                            <td className="py-3 px-3 font-bold text-slate-500">{idx + 1}</td>
                                            <td className="py-3 px-3">
                                                <p className="font-extrabold text-slate-900 dark:text-white">{item.description}</p>
                                            </td>
                                            <td className="py-3 px-3 text-center font-extrabold text-slate-900 dark:text-white">{item.qty}</td>
                                            <td className="py-3 px-3 text-right font-mono">₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                                                ₹{(item.total || (item.qty * item.unitPrice)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 py-6 items-start">
                        <div className="sm:col-span-7 space-y-3">
                            {/* Notes / Remarks */}
                            {(invoice.notes || invoice.adminNote) && (
                                <div className="space-y-2">
                                    {invoice.notes && (
                                        <div className="text-[11px] leading-relaxed">
                                            <p className="font-bold text-slate-900 dark:text-white mb-0.5">Vendor Remarks:</p>
                                            <p className="text-slate-500 dark:text-slate-400 italic">"{invoice.notes}"</p>
                                        </div>
                                    )}
                                    {invoice.adminNote && (
                                        <div className="text-[11px] leading-relaxed p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-lg">
                                            <p className="font-bold text-amber-800 dark:text-amber-400 mb-0.5">Admin Feedback:</p>
                                            <p className="text-amber-700 dark:text-amber-500 italic">"{invoice.adminNote}"</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Payout & Settlement Ledger */}
                            {order && (
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-3 print:bg-white print:border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                            <Banknote className="w-3.5 h-3.5 text-violet-500" />
                                            Payout Settlement Ledger
                                        </h4>
                                        {invoice.status === 'paid' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                Paid & Settled
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                Unpaid
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                                        <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                            <span className="text-[10px] text-slate-400 block mb-0.5">Total Paid So Far</span>
                                            <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                ₹{(order.printerPayments || []).reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                            <span className="text-[10px] text-slate-400 block mb-0.5">Remaining Balance</span>
                                            <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
                                                ₹{Math.max(0, (parseFloat((order as any).printingAmount || '0') || totalAmount) - (order.printerPayments || []).reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                    {(order.printerPayments || []).length > 0 && (
                                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Payment Logs</span>
                                            {(order.printerPayments || []).map((payment: any, pIdx: number) => (
                                                <div key={payment.id || pIdx} className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 py-1 border-b border-dashed border-slate-100 dark:border-slate-800 last:border-0">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">{payment.description || 'Installment Payment'}</span>
                                                        <span className="text-[8px] text-slate-400">{payment.createdAt ? format(new Date(payment.createdAt), 'dd MMM yyyy HH:mm') : ''}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">₹{parseFloat(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                        {payment.transactionRef && <span className="block text-[8px] text-slate-400">Ref: {payment.transactionRef}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <div className="space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                <p className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Terms & Declarations</p>
                                <p>1. Supplied strictly in accordance with approved requirements.</p>
                                <p>2. Digital tax invoice generated via print partner network.</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-600 pt-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-violet-500" /> Print Vendor Partner Verified
                            </div>
                        </div>

                        <div className="sm:col-span-5 space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 font-medium">
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-600 dark:text-slate-400">Subtotal (Taxable Value)</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            {hasGst ? (
                                <>
                                    {isIntrastate ? (
                                        <>
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="text-slate-600 dark:text-slate-400">CGST (9%)</span>
                                                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{(gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="text-slate-600 dark:text-slate-400">SGST (9%)</span>
                                                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{(gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-slate-600 dark:text-slate-400">IGST (18%)</span>
                                            <span className="font-mono font-bold text-slate-900 dark:text-white">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex justify-between items-center text-[11px] text-slate-400">
                                    <span>GST (Exempt/Unregistered)</span>
                                    <span>₹0.00</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-3 mt-1.5 border-t border-slate-200 dark:border-slate-700">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider block">Grand Total</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Net Payable</span>
                                </div>
                                <div className="flex items-center gap-0.5 text-violet-600 dark:text-violet-400">
                                    <IndianRupee className="w-4 h-4 font-extrabold" />
                                    <span className="text-xl font-black font-mono tracking-tighter">
                                        {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Signatory / Verification */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
                        <div className="space-y-0.5 text-center sm:text-left">
                            <p className="font-bold text-slate-900 dark:text-white">Thank you for your valuable partnership!</p>
                            <p>For payout queries: <span className="text-violet-600 font-bold">finance@amazoprint.com</span></p>
                        </div>

                        <div className="text-center sm:text-right space-y-1">
                            <div className="h-10 w-28 border-b border-dashed border-slate-300 mx-auto sm:ml-auto flex items-end justify-center">
                                <span className="font-mono font-bold text-violet-600/30 text-[8px] tracking-widest uppercase">Verified Hub</span>
                            </div>
                            <p className="font-extrabold text-slate-900 dark:text-white text-[10px]">Authorized Signatory</p>
                            <p className="text-[9px] uppercase">{printerName}</p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
