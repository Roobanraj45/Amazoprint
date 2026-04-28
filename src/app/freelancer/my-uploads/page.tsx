import { getMyUploads } from "@/app/actions/upload-actions";
import { MyUploadsClient } from "@/components/uploads/MyUploadsClient";


export default async function FreelancerMyUploadsPage() {
    const uploads = await getMyUploads();

    return (
        <div className="min-h-full p-4 md:p-8 lg:p-10 space-y-8">
             <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-border/40">
                <div className="space-y-1">
                    <div className="inline-flex items-center rounded-full border border-pink-500/20 bg-pink-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-pink-500 mb-2">Cloud Storage</div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight font-headline">My Uploads</h1>
                    <p className="text-muted-foreground font-medium">Manage your design assets, reference materials, and completed artwork.</p>
                </div>
            </header>
            <MyUploadsClient initialUploads={uploads} />
        </div>
    );
}
