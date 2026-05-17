'use client';

import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

export function InvoiceActions() {
    return (
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
                variant="outline" 
                className="flex-1 sm:flex-initial bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white rounded-xl font-bold text-xs py-5 px-6 shadow-sm"
                onClick={(e) => {
                    e.preventDefault();
                    window.print();
                }}
            >
                <Printer className="w-4 h-4 mr-2 text-indigo-400" /> Print Invoice
            </Button>
            <Button 
                className="flex-1 sm:flex-initial bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold text-xs py-5 px-6 shadow-lg shadow-indigo-500/20"
                onClick={(e) => {
                    e.preventDefault();
                    window.print();
                }}
            >
                <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
        </div>
    );
}
