import { getMyUploads } from "@/app/actions/upload-actions";
import { MyUploadsClient } from "@/components/uploads/MyUploadsClient";
import { Badge } from "@/components/ui/badge";

export default async function ClientMyUploadsPage() {
    const uploads = await getMyUploads();

    return (
        <div className="min-h-full p-4 md:p-8 lg:p-10 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-border/40">
                <div className="space-y-1">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2 uppercase text-[10px] tracking-widest font-bold">File Manager</Badge>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight font-headline">My Uploads</h1>
                    <p className="text-muted-foreground font-medium">Manage your raw design files and assets.</p>
                </div>
            </header>
            
            <MyUploadsClient initialUploads={uploads} />
        </div>
    );
}
