import { getCompletedContestsWithWinners } from "@/app/actions/contest-actions";
import { PayoutsClient } from "./PayoutsClient";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
    const contests = await getCompletedContestsWithWinners();
    return <PayoutsClient contests={contests} />;
}
