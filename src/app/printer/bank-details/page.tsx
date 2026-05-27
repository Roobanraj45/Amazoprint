import { getBankDetails } from "@/app/actions/bank-actions";
import { BankDetailsForm } from "@/components/BankDetailsForm";
import { CreditCard } from "lucide-react";

export default async function PrinterBankDetailsPage() {
    const bankData = await getBankDetails();

    return (
        <div className="space-y-6 min-h-screen p-6 lg:p-8 max-w-[1000px] mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-600/30">
                            <CreditCard className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Bank Details</h1>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 ml-10">
                        Manage your bank payout account details to receive your job print payouts.
                    </p>
                </div>
            </div>

            <div className="pt-2">
                <BankDetailsForm initialData={bankData} />
            </div>
        </div>
    );
}
