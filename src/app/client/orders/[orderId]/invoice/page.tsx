import { getMyOrderDetails } from "@/app/actions/order-actions";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { IndianRupee, ArrowLeft, ShieldCheck, Building2, Phone, Mail, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AmazoprintLogo } from "@/components/ui/logo";
import { InvoiceActions } from "./invoice-actions";

export default async function InvoicePage({ params }: { params: { orderId: string } }) {
    const orderId = parseInt(params.orderId, 10);
    if (isNaN(orderId)) {
        notFound();
    }

    const order = await getMyOrderDetails(orderId);

    if (!order) {
        notFound();
    }

    const isDirectSale = !!order.directSellingProduct;
    const productName = isDirectSale ? order.directSellingProduct.name : (order.product?.name || 'Custom Print Production');
    const subProductName = isDirectSale ? order.directSellingProduct.category : (order.subProduct?.name || 'Custom Specifications');
    
    const shippingAddress = order.shippingAddress as any || {};
    const billingAddress = order.billingAddress as any || shippingAddress;

    // Financial calculations
    const totalAmount = parseFloat(order.totalAmount) || 0;
    const unitPrice = parseFloat(order.unitPrice) || (totalAmount / order.quantity);
    
    let parsedCustomisation: any = null;
    try {
        const rawCustomisation = order.design?.customisation || (order as any).customisation;
        parsedCustomisation = typeof rawCustomisation === 'string' ? JSON.parse(rawCustomisation) : rawCustomisation;
    } catch (e) {}

    const breakup = parsedCustomisation?.priceBreakup;
    const addonsTotal = breakup?.addons?.reduce((acc: number, addon: any) => acc + addon.totalAmount, 0) || 0;
    const discount = breakup?.discount || 0;
    const baseSubtotal = totalAmount - addonsTotal + discount;

    // Assumed GST calculation for invoice itemization (18% standard print GST)
    const gstRate = 0.18;
    const taxableAmount = totalAmount / (1 + gstRate);
    const gstAmount = totalAmount - taxableAmount;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Floating Non-Printable Action Bar */}
                <div className="print:hidden flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 dark:bg-slate-900/80 backdrop-blur-xl text-white p-6 rounded-3xl shadow-2xl border border-slate-800">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl">
                            <Link href={`/client/orders/${order.id}`}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Order #{order.id}
                            </Link>
                        </Button>
                        <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />
                        <div>
                            <h2 className="text-base font-extrabold tracking-tight">Official Tax Invoice</h2>
                            <p className="text-xs text-slate-400 font-medium">Ready for high-quality PDF download & printing</p>
                        </div>
                    </div>
                    
                    <InvoiceActions />
                </div>

                {/* Printable Invoice Sheet */}
                <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 print:p-0 print:shadow-none print:border-none print:bg-white print:text-black">
                    
                    {/* Header: Logo & Company Info vs Invoice Title */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pb-8 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
                        <div className="space-y-4">
                            <div className="w-48">
                                <AmazoprintLogo className="w-full h-auto text-slate-900 dark:text-white print:text-black" />
                            </div>
                            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 print:text-slate-700 font-medium">
                                <p className="font-extrabold text-slate-900 dark:text-white print:text-black text-sm flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-indigo-600 print:text-slate-800" /> AMAZOPRINT
                                </p>
                                <p>No.21/2, Udayarpalayam, Attur Mainroad</p>
                                <p>Udayarpalayam, Thammampatti - 636113</p>
                                <p>Tamilnadu, India.</p>
                                <p className="pt-1 flex items-center gap-3 text-[11px]">
                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +91 94983 38053 / 81110 63111</span>
                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> support@amazoprint.com</span>
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 print:text-slate-500 font-bold tracking-wider pt-1 uppercase">
                                    GSTIN: 33BNLPK5597H1ZJ
                                </p>
                            </div>
                        </div>

                        <div className="sm:text-right space-y-2">
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white print:text-black uppercase">
                                Tax Invoice
                            </h1>
                            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 print:text-slate-700">
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Invoice No:</span> INV-2026-{order.id.toString().padStart(6, '0')}</p>
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Invoice Date:</span> {format(new Date(order.createdAt), 'dd MMM yyyy')}</p>
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Order Ref:</span> ORD-{order.id}</p>
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Payment Status:</span> <span className="text-emerald-600 print:text-emerald-800 font-extrabold uppercase">{order.paymentStatus}</span></p>
                                <p><span className="font-bold text-slate-900 dark:text-white print:text-black">Payment Method:</span> {order.paymentMethod?.toUpperCase() || 'ONLINE'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Addresses Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
                        <div className="space-y-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 print:text-slate-500 flex items-center gap-1.5">
                                Billed To (Tax Entity)
                            </h3>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200/60 dark:border-slate-800/60 print:border-slate-300 space-y-1 text-xs text-slate-700 dark:text-slate-300 print:text-slate-800 font-medium">
                                <p className="font-extrabold text-sm text-slate-900 dark:text-white print:text-black">{billingAddress.name || 'Valued Customer'}</p>
                                <p>{billingAddress.addressLine1}</p>
                                {billingAddress.addressLine2 && <p>{billingAddress.addressLine2}</p>}
                                <p>{billingAddress.city}, {billingAddress.state} {billingAddress.zip}</p>
                                <p>{billingAddress.country || 'India'}</p>
                                <p className="pt-2 font-bold text-slate-600 dark:text-slate-400 print:text-slate-600">Ph: {billingAddress.phone || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 print:text-slate-500 flex items-center gap-1.5">
                                Shipped To (Delivery Address)
                            </h3>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200/60 dark:border-slate-800/60 print:border-slate-300 space-y-1 text-xs text-slate-700 dark:text-slate-300 print:text-slate-800 font-medium">
                                <p className="font-extrabold text-sm text-slate-900 dark:text-white print:text-black">{shippingAddress.name || billingAddress.name || 'Valued Customer'}</p>
                                <p>{shippingAddress.addressLine1 || billingAddress.addressLine1}</p>
                                {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                                <p>{shippingAddress.city || billingAddress.city}, {shippingAddress.state || billingAddress.state} {shippingAddress.zip || billingAddress.zip}</p>
                                <p>{shippingAddress.country || billingAddress.country || 'India'}</p>
                                <p className="pt-2 font-bold text-slate-600 dark:text-slate-400 print:text-slate-600">Ph: {shippingAddress.phone || billingAddress.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Itemized Table */}
                    <div className="py-8 space-y-4 border-b border-slate-200 dark:border-slate-800 print:border-slate-300">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 print:text-slate-500">
                            Production Breakdown & Particulars
                        </h3>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-200 dark:border-slate-800 print:border-slate-400 text-xs font-extrabold text-slate-900 dark:text-white print:text-black">
                                        <th className="py-3 px-4">#</th>
                                        <th className="py-3 px-4">Item Description & Specifications</th>
                                        <th className="py-3 px-4 text-center">HSN/SAC</th>
                                        <th className="py-3 px-4 text-center">Qty</th>
                                        <th className="py-3 px-4 text-right">Unit Rate</th>
                                        <th className="py-3 px-4 text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-medium divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">
                                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 print:hover:bg-transparent">
                                        <td className="py-4 px-4 font-bold text-slate-500">1</td>
                                        <td className="py-4 px-4 space-y-1">
                                            <p className="font-extrabold text-sm text-slate-900 dark:text-white print:text-black">{productName}</p>
                                            <p className="text-slate-500 dark:text-slate-400 print:text-slate-600">{subProductName}</p>
                                            {parsedCustomisation && (
                                                <div className="text-[11px] text-slate-400 dark:text-slate-500 print:text-slate-500 space-y-0.5 pt-1">
                                                    {parsedCustomisation.pages && <p>• Pages/Sides: {parsedCustomisation.pages}</p>}
                                                    {parsedCustomisation.spotUv && <p>• Spot UV Gloss Applied</p>}
                                                    {parsedCustomisation.dieCut && <p>• Custom Die-Cut Pattern #{parsedCustomisation.dieCut}</p>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-center font-mono text-slate-500">49111090</td>
                                        <td className="py-4 px-4 text-center font-extrabold text-slate-900 dark:text-white print:text-black">{order.quantity}</td>
                                        <td className="py-4 px-4 text-right font-mono">₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="py-4 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-white print:text-black">₹{baseSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    {breakup?.addons?.map((addon: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 print:hover:bg-transparent">
                                            <td className="py-4 px-4 font-bold text-slate-500">{idx + 2}</td>
                                            <td className="py-4 px-4 space-y-1">
                                                <p className="font-bold text-slate-900 dark:text-white print:text-black">{addon.name}</p>
                                                <p className="text-[11px] text-slate-500">Premium Add-on Service</p>
                                            </td>
                                            <td className="py-4 px-4 text-center font-mono text-slate-500">998892</td>
                                            <td className="py-4 px-4 text-center font-extrabold text-slate-900 dark:text-white print:text-black">1</td>
                                            <td className="py-4 px-4 text-right font-mono">₹{addon.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            <td className="py-4 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-white print:text-black">₹{addon.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary & Tax Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 py-8 border-b border-slate-200 dark:border-slate-800 print:border-slate-300 items-start">
                        <div className="sm:col-span-7 space-y-4">
                            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 leading-relaxed font-medium">
                                <p className="font-extrabold text-slate-900 dark:text-white print:text-black text-xs uppercase tracking-wider mb-2">Terms & Conditions</p>
                                <p>1. All print jobs are produced strictly as per the approved digital artwork proof.</p>
                                <p>2. Claims for damages or shortages must be reported within 48 hours of delivery.</p>
                                <p>3. This is a computer-generated tax invoice and does not require a physical signature.</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 print:text-emerald-800 pt-2">
                                <ShieldCheck className="w-4 h-4" /> 100% Secure & Verified Transaction
                            </div>
                        </div>

                        <div className="sm:col-span-5 space-y-3 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 print:bg-slate-50 border border-slate-200/60 dark:border-slate-800/60 print:border-slate-300 font-medium">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">Subtotal (Taxable Value)</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            {discount > 0 && (
                                <div className="flex justify-between items-center text-xs text-emerald-600 print:text-emerald-800 font-bold">
                                    <span>Special Discount applied</span>
                                    <span className="font-mono">- ₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">IGST / CGST+SGST (18%)</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200 dark:border-slate-700 print:border-slate-300">
                                <span className="text-slate-600 dark:text-slate-400 print:text-slate-700">Shipping & Packaging</span>
                                <span className="font-mono font-bold text-emerald-600 print:text-emerald-800 uppercase text-[10px] tracking-wider">Free Express</span>
                            </div>

                            <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-slate-900 dark:border-white print:border-black">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-black text-slate-900 dark:text-white print:text-black uppercase tracking-wider block">Grand Total</span>
                                    <span className="text-[9px] font-bold text-slate-400 print:text-slate-500 uppercase tracking-widest block">All Taxes Included</span>
                                </div>
                                <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 print:text-black">
                                    <IndianRupee className="w-5 h-5 font-extrabold" />
                                    <span className="text-3xl font-black font-mono tracking-tighter">
                                        {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Signatory */}
                    <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-6 text-xs text-slate-500 print:text-slate-600">
                        <div className="space-y-1 text-center sm:text-left">
                            <p className="font-bold text-slate-900 dark:text-white print:text-black">Thank you for choosing AmazoPrint!</p>
                            <p>For support, visit <span className="text-indigo-600 print:text-indigo-800 font-bold">www.amazoprint.com/support</span></p>
                        </div>

                        <div className="text-center sm:text-right space-y-2">
                            <div className="h-12 w-32 border-b border-dashed border-slate-400 print:border-slate-500 mx-auto sm:ml-auto mb-1 flex items-end justify-center">
                                <span className="font-mono font-bold text-indigo-600/40 dark:text-indigo-400/40 print:text-indigo-800/40 text-xs tracking-widest uppercase">Verified Seal</span>
                            </div>
                            <p className="font-extrabold text-slate-900 dark:text-white print:text-black text-[11px]">Authorized Signatory</p>
                            <p className="text-[10px]">AMAZOPRINT</p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
