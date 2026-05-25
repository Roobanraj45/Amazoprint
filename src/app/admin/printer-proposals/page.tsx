import { getAllProposalsAdmin } from "@/app/actions/proposal-actions";
import { ProposalsAdminClient } from "./ProposalsAdminClient";

export default async function AdminPrinterProposalsPage() {
    const proposals = await getAllProposalsAdmin();

    return (
        <ProposalsAdminClient initialProposals={proposals} />
    );
}
