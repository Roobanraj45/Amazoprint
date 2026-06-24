import { db } from "../src/db";
import { orders } from "../src/db/schema";
import { getAdminOrderDetails } from "../src/app/actions/order-actions";

async function main() {
    try {
        const firstOrder = await db.select({ id: orders.id }).from(orders).limit(1).then(res => res[0]);
        if (!firstOrder) {
            console.log("No orders found in database.");
            return;
        }

        console.log(`Testing with Order ID: ${firstOrder.id}`);
        // Mock getSession to bypass auth since we are running in node
        // Wait, getAdminOrderDetails checks session:
        // const session = await getSession();
        // So calling it directly will throw "Unauthorized" because getSession returns null.
        // Let's run a direct query mimicking getAdminOrderDetails to see what is returned!
        const order = await db.query.orders.findFirst({
            where: (o, { eq }) => eq(o.id, firstOrder.id),
            with: {
                user: {
                    columns: {
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                product: true,
                subProduct: true,
                design: true,
                designUpload: true,
                directSellingProduct: true,
                payment: true,
                logs: {
                    orderBy: (logs, { desc }) => [desc(logs.createdAt)],
                },
                printerPayments: {
                    orderBy: (p, { desc }) => [desc(p.createdAt)],
                },
                designVerifications: {
                    with: {
                        freelancer: {
                            columns: {
                                id: true,
                                name: true,
                                email: true,
                                profileImage: true
                            }
                        }
                    },
                    orderBy: (dv, { desc }) => [desc(dv.createdAt)],
                },
            },
        });

        console.log("Result order structure:", JSON.stringify(order, null, 2));
    } catch (e) {
        console.error("Error running test:", e);
    }
}

main().then(() => process.exit(0));
