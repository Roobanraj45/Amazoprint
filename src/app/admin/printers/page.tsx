'use client';

import { useState, useEffect, useTransition } from 'react';
import { getPrinters, updatePrinterApproval } from '@/app/actions/printer-actions';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { Loader2, Building } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type Printer = Awaited<ReturnType<typeof getPrinters>>[0];

function PrinterApprovalToggle({ printer }: { printer: Printer }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggle = (isApproved: boolean) => {
        startTransition(async () => {
            try {
                await updatePrinterApproval(printer.id, isApproved);
                toast({
                    title: 'Success',
                    description: `Printer ${printer.companyName || printer.fullName} has been ${isApproved ? 'approved' : 'disabled'}.`,
                });
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Error updating status',
                    description: error.message,
                });
            }
        });
    };

    return (
        <div className="flex items-center space-x-2">
            <Switch
                id={`approve-${printer.id}`}
                checked={printer.isApproved ?? false}
                onCheckedChange={handleToggle}
                disabled={isPending}
                aria-label={`Toggle approval for ${printer.companyName || printer.fullName}`}
            />
            <label htmlFor={`approve-${printer.id}`} className="text-sm font-medium">
                {printer.isApproved ? 'Approved' : 'Not Approved'}
            </label>
        </div>
    );
}

export default function AdminPrintersPage() {
    const [printers, setPrinters] = useState<Printer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchPrinters = async () => {
            setIsLoading(true);
            try {
                const fetchedPrinters = await getPrinters();
                setPrinters(fetchedPrinters);
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Failed to load printers',
                    description: error.message,
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchPrinters();
    }, [toast]);


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Manage Printing Presses</h1>

            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {printers.map((printer) => (
                        <Card key={printer.id}>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarFallback><Building /></AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">{printer.companyName || printer.fullName}</CardTitle>
                                            <CardDescription>{printer.email} | {printer.username}</CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                                         <Badge variant={printer.isApproved ? 'default' : 'destructive'}>
                                            {printer.isApproved ? 'Approved' : 'Pending'}
                                        </Badge>
                                        <PrinterApprovalToggle printer={printer} />
                                    </div>
                                </div>
                            </CardHeader>
                             <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4 border-t">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Contact</p>
                                        <p className="font-medium">{printer.fullName}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Phone</p>
                                        <p className="font-medium">{printer.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Location</p>
                                        <p className="font-medium">{printer.city || 'N/A'}, {printer.state || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Joined</p>
                                        <p className="font-medium">{format(new Date(printer.createdAt!), 'PPP')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
