import { getMyUploads } from "@/app/actions/upload-actions";
import { MyUploadsClient } from "@/components/uploads/MyUploadsClient";


export default async function ClientMyUploadsPage() {
    const uploads = await getMyUploads();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">My Uploads</h1>
            <MyUploadsClient initialUploads={uploads} />
        </div>
    );
}
