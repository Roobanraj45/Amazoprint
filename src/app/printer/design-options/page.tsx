import { getPrinterProposals } from "@/app/actions/proposal-actions";
import { DesignOptionsClient } from "./DesignOptionsClient";

export default async function PrinterDesignOptionsPage() {
    const proposals = await getPrinterProposals();

    return (
        <DesignOptionsClient initialProposals={proposals} />
    );
}
