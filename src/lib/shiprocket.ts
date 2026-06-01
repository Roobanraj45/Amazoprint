import { db } from "@/db";
import { shipments, orders } from "@/db/schema";
import { eq } from "drizzle-orm";

const SHIPROCKET_EMAIL = "amazoprintcloud@gmail.com";
const SHIPROCKET_PASSWORD = "GC6PtFVG*50Q#2Nv@!$NkWBxF4ZXHGsw";
const API_BASE = "https://apiv2.shiprocket.in/v1/external";

let cachedToken: string | null = null;
let tokenExpiry: number = 0; // Epoch time in ms

async function getShiprocketToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && now < tokenExpiry) {
        return cachedToken;
    }

    try {
        console.log("[Shiprocket] Authenticating...");
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: SHIPROCKET_EMAIL,
                password: SHIPROCKET_PASSWORD,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Auth failed: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        if (data.token) {
            cachedToken = data.token;
            // Token is generally valid for 10 days, let's set expiry to 9 days to be safe
            tokenExpiry = now + 9 * 24 * 60 * 60 * 1000;
            return data.token;
        } else {
            throw new Error("No token returned in auth response");
        }
    } catch (error) {
        console.error("[Shiprocket] Auth Error:", error);
        throw error;
    }
}

// ── Helper: authenticated fetch ───────────────────────────────────────────────
async function shiprocketFetch(path: string, options: RequestInit = {}) {
    const token = await getShiprocketToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...(options.headers as Record<string, string> || {}),
    };
    return fetch(`${API_BASE}${path}`, { ...options, headers });
}

// ── Interfaces ────────────────────────────────────────────────────────────────

interface PrinterLocation {
    id: string;
    fullName: string | null;
    companyName: string | null;
    phone: string | null;
    email: string;
    address: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
}

interface ShippingAddress {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
}

interface OrderDetails {
    id: number;
    createdAt: Date;
    totalAmount: string;
    shippingAddress: unknown;
    quantity: number;
    user: {
        name: string;
        email: string;
        phone: string | null;
    };
    product?: {
        name: string;
        sku?: string | null;
    } | null;
    subProduct?: {
        name: string;
        sku?: string | null;
    } | null;
    directSellingProduct?: {
        name: string;
        sku?: string | null;
    } | null;
}

// ── Register Pickup Location ──────────────────────────────────────────────────

export async function registerPickupLocation(printer: PrinterLocation): Promise<string> {
    const nickname = `printer_${printer.id.substring(0, 8)}`; // max 36 chars, unique per printer
    
    // Strict Validation
    if (!printer.address || printer.address.trim().length < 3) throw new Error("Printer profile is incomplete: Missing or invalid address.");
    if (!printer.city || printer.city.trim().length < 2) throw new Error("Printer profile is incomplete: Missing or invalid city.");
    if (!printer.state || printer.state.trim().length < 2) throw new Error("Printer profile is incomplete: Missing or invalid state.");
    if (!printer.postalCode || printer.postalCode.replace(/[^0-9]/g, "").length < 6) throw new Error("Printer profile is incomplete: Missing or invalid postal code.");
    if (!printer.phone || printer.phone.replace(/[^0-9]/g, "").length < 10) throw new Error("Printer profile is incomplete: Missing or invalid phone number.");

    const body = {
        pickup_location: nickname,
        name: printer.companyName || printer.fullName || "Amazoprint Printer",
        email: printer.email,
        phone: printer.phone.replace(/[^0-9]/g, "").substring(0, 10),
        address: printer.address,
        city: printer.city,
        state: printer.state,
        country: printer.country || "India",
        pin_code: printer.postalCode.replace(/[^0-9]/g, "").substring(0, 6),
    };

    try {
        console.log(`[Shiprocket] Registering pickup location for printer: ${nickname}`);
        const response = await shiprocketFetch("/settings/company/addpickup", {
            method: "POST",
            body: JSON.stringify(body),
        });

        const data = await response.json();
        console.log("[Shiprocket] Add pickup location response:", data);
        
        // Return nickname whether newly added or already exists
        return nickname;
    } catch (error) {
        console.error("[Shiprocket] Failed to add pickup location:", error);
        // We still return nickname as the location might already be registered previously.
        return nickname;
    }
}

// ── Create Shiprocket Shipment ────────────────────────────────────────────────

export async function createShiprocketShipment(
    order: OrderDetails, 
    printer: PrinterLocation,
    dimensions?: { length?: number; breadth?: number; height?: number; weight?: number },
    attachmentsUrl?: string
) {
    const pickupNickname = await registerPickupLocation(printer);

    const addr = order.shippingAddress as ShippingAddress;
    const customerName = addr.name || order.user.name || "Customer";
    const nameParts = customerName.split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "Client";

    const formattedDate = new Date(order.createdAt).toISOString().replace("T", " ").substring(0, 16);

    const productName = order.directSellingProduct?.name || order.product?.name || order.subProduct?.name || "Print Product";
    const productSku = order.directSellingProduct?.sku || order.subProduct?.sku || `SKU-${order.id}`;

    if (!addr) {
        throw new Error("Shipping address is completely missing for this order.");
    }
    if (!addr.addressLine1 || addr.addressLine1.trim().length < 3) throw new Error("Customer shipping address is incomplete: Missing Address Line 1.");
    if (!addr.city || addr.city.trim().length < 2) throw new Error("Customer shipping address is incomplete: Missing City.");
    if (!addr.state || addr.state.trim().length < 2) throw new Error("Customer shipping address is incomplete: Missing State.");
    if (!addr.zip || addr.zip.replace(/[^0-9]/g, "").length < 6) throw new Error("Customer shipping address is incomplete: Missing or invalid ZIP code.");
    
    const phoneToUse = addr.phone || order.user.phone;
    if (!phoneToUse || phoneToUse.replace(/[^0-9]/g, "").length < 10) throw new Error("Customer shipping address is incomplete: Missing or invalid phone number.");

    // Create ad-hoc order
    const orderBody = {
        order_id: `AMZ-ORD-${order.id}-${Date.now().toString().slice(-4)}`,
        order_date: formattedDate,
        pickup_location: pickupNickname,
        billing_customer_name: firstName,
        billing_last_name: lastName,
        billing_address: addr.addressLine1,
        billing_address_2: addr.addressLine2 || "",
        billing_city: addr.city,
        billing_pincode: addr.zip.replace(/[^0-9]/g, "").substring(0, 6),
        billing_state: addr.state,
        billing_country: addr.country || "India",
        billing_email: order.user.email,
        billing_phone: phoneToUse.replace(/[^0-9]/g, "").substring(0, 10),
        shipping_is_billing: true,
        order_items: [
            {
                name: productName,
                sku: productSku,
                units: order.quantity,
                selling_price: parseFloat(order.totalAmount) / order.quantity,
                discount: "0",
                tax: "0",
            }
        ],
        payment_method: "Prepaid",
        sub_total: parseFloat(order.totalAmount),
        length: dimensions?.length || 15,
        breadth: dimensions?.breadth || 15,
        height: dimensions?.height || 10,
        weight: dimensions?.weight || 0.5,
    };

    console.log("[Shiprocket] Creating ad-hoc order...");
    const orderRes = await shiprocketFetch("/orders/create/adhoc", {
        method: "POST",
        body: JSON.stringify(orderBody),
    });

    if (!orderRes.ok) {
        const errText = await orderRes.text();
        throw new Error(`Shiprocket order creation failed: ${orderRes.status} - ${errText}`);
    }

    const orderData = await orderRes.json();
    console.log("[Shiprocket] Order created response:", orderData);

    const shiprocketOrderId = orderData.order_id;
    const shipmentId = orderData.shipment_id;

    if (!shipmentId) {
        throw new Error("Shiprocket created order but failed to return shipment_id");
    }

    // Generate AWB tracking
    console.log(`[Shiprocket] Generating AWB for shipment: ${shipmentId}`);
    const awbRes = await shiprocketFetch("/courier/assign/awb", {
        method: "POST",
        body: JSON.stringify({
            shipment_id: shipmentId,
        }),
    });

    let awbCode: string | null = null;
    let courierName: string | null = null;
    let status = "order_created";

    if (awbRes.ok) {
        const awbData = await awbRes.json();
        console.log("[Shiprocket] AWB assigned response:", awbData);
        if (awbData.response && awbData.response.data) {
            awbCode = awbData.response.data.awb_code || null;
            courierName = awbData.response.data.courier_name || null;
            status = "awb_assigned";
        }
    } else {
        console.error("[Shiprocket] AWB generation failed:", await awbRes.text());
    }

    // Insert shipment record in our db
    const [insertedShipment] = await db.insert(shipments).values({
        orderId: order.id,
        shipmentId: String(shipmentId),
        shiprocketOrderId: String(shiprocketOrderId),
        awbCode: awbCode || "",
        courierName: courierName || "Shiprocket Courier",
        status: status,
        currentStatus: status,
        trackingUrl: awbCode ? `https://shiprocket.co/tracking/${awbCode}` : null,
        attachmentsUrl: attachmentsUrl || null,
    }).returning();

    // If AWB generation was successful, update orders tracking number
    if (awbCode) {
        await db.update(orders)
            .set({
                trackingNumber: awbCode,
                updatedAt: new Date()
            })
            .where(eq(orders.id, order.id));
    }

    return insertedShipment;
}

// ── Track Shipment ────────────────────────────────────────────────────────────

export async function trackShipment(shiprocketOrderId: string) {
    console.log(`[Shiprocket] Tracking order: ${shiprocketOrderId}`);
    const res = await shiprocketFetch(`/courier/track?order_id=${shiprocketOrderId}`, {
        method: "GET",
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Tracking failed: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    console.log("[Shiprocket] Tracking response:", JSON.stringify(data).substring(0, 500));

    // Extract tracking info from the response
    // Shiprocket tracking response structure can vary
    let trackingInfo: any = null;
    let currentStatus = "unknown";
    let estimatedDelivery = "";
    let activities: any[] = [];

    if (data.tracking_data) {
        trackingInfo = data.tracking_data;
        currentStatus = trackingInfo.shipment_status_id 
            ? mapShiprocketStatus(trackingInfo.shipment_status_id)
            : trackingInfo.shipment_status || "unknown";
        estimatedDelivery = trackingInfo.edd || trackingInfo.estimated_date || "";
        activities = trackingInfo.shipment_track_activities || trackingInfo.track_activities || [];
    } else if (data[shiprocketOrderId]) {
        // Some responses wrap data by order ID
        trackingInfo = data[shiprocketOrderId]?.tracking_data || data[shiprocketOrderId];
        currentStatus = trackingInfo?.shipment_status_id 
            ? mapShiprocketStatus(trackingInfo.shipment_status_id)
            : trackingInfo?.shipment_status || "unknown";
        estimatedDelivery = trackingInfo?.edd || trackingInfo?.estimated_date || "";
        activities = trackingInfo?.shipment_track_activities || trackingInfo?.track_activities || [];
    }

    // Update our shipments table
    const shipmentRecords = await db.select().from(shipments)
        .where(eq(shipments.shiprocketOrderId, shiprocketOrderId));

    if (shipmentRecords.length > 0) {
        const updateData: any = {
            currentStatus,
            lastTrackingUpdate: new Date(),
            trackingData: { activities, rawStatus: trackingInfo },
            updatedAt: new Date(),
        };

        if (estimatedDelivery) {
            updateData.estimatedDelivery = estimatedDelivery;
        }

        if (currentStatus === "delivered") {
            updateData.status = "delivered";
            updateData.deliveredDate = new Date();
        } else if (currentStatus === "in_transit" || currentStatus === "out_for_delivery") {
            updateData.status = "in_transit";
        }

        await db.update(shipments)
            .set(updateData)
            .where(eq(shipments.shiprocketOrderId, shiprocketOrderId));
    }

    return {
        currentStatus,
        estimatedDelivery,
        activities,
        rawData: trackingInfo,
    };
}

// ── Cancel Shipment ───────────────────────────────────────────────────────────

export async function cancelShipment(shiprocketOrderIds: number[], reason?: string) {
    console.log(`[Shiprocket] Cancelling orders: ${shiprocketOrderIds.join(", ")}`);

    const res = await shiprocketFetch("/orders/cancel", {
        method: "POST",
        body: JSON.stringify({
            ids: shiprocketOrderIds,
        }),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Cancel failed: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    console.log("[Shiprocket] Cancel response:", data);

    // Update shipments in our DB
    for (const orderId of shiprocketOrderIds) {
        await db.update(shipments)
            .set({
                status: "cancelled",
                currentStatus: "cancelled",
                cancelledAt: new Date(),
                cancelReason: reason || "Cancelled by printer",
                updatedAt: new Date(),
            })
            .where(eq(shipments.shiprocketOrderId, String(orderId)));
    }

    return data;
}

// ── Generate Label ────────────────────────────────────────────────────────────

export async function generateLabel(shipmentId: string) {
    console.log(`[Shiprocket] Generating label for shipment: ${shipmentId}`);

    const res = await shiprocketFetch("/courier/generate/label", {
        method: "POST",
        body: JSON.stringify({
            shipment_id: [parseInt(shipmentId)],
        }),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Label generation failed: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    console.log("[Shiprocket] Label response:", data);

    const labelUrl = data.label_url || data.response?.label_url || null;

    // Update shipments table
    if (labelUrl) {
        await db.update(shipments)
            .set({
                labelUrl,
                updatedAt: new Date(),
            })
            .where(eq(shipments.shipmentId, shipmentId));
    }

    return { labelUrl, rawData: data };
}

// ── Generate Manifest ─────────────────────────────────────────────────────────

export async function generateManifest(shipmentId: string) {
    console.log(`[Shiprocket] Generating manifest for shipment: ${shipmentId}`);

    // Step 1: Generate manifest
    const genRes = await shiprocketFetch("/manifests/generate", {
        method: "POST",
        body: JSON.stringify({
            shipment_id: [parseInt(shipmentId)],
        }),
    });

    if (!genRes.ok) {
        const errText = await genRes.text();
        throw new Error(`Manifest generation failed: ${genRes.status} - ${errText}`);
    }

    const genData = await genRes.json();
    console.log("[Shiprocket] Manifest generate response:", genData);

    // Step 2: Print manifest to get the PDF URL
    const printRes = await shiprocketFetch("/manifests/print", {
        method: "POST",
        body: JSON.stringify({
            order_ids: [parseInt(shipmentId)],
        }),
    });

    let manifestUrl = null;

    if (printRes.ok) {
        const printData = await printRes.json();
        console.log("[Shiprocket] Manifest print response:", printData);
        manifestUrl = printData.manifest_url || printData.response?.manifest_url || null;
    } else {
        console.error("[Shiprocket] Manifest print failed:", await printRes.text());
        // Still continue; the manifest was generated even if we can't get the PDF URL
    }

    // Update shipments table
    if (manifestUrl) {
        await db.update(shipments)
            .set({
                manifestUrl,
                updatedAt: new Date(),
            })
            .where(eq(shipments.shipmentId, shipmentId));
    }

    return { manifestUrl, rawData: genData };
}

// ── Schedule Pickup ───────────────────────────────────────────────────────────

export async function schedulePickup(shipmentId: string, pickupDate?: string, scheduledTimestamp?: Date) {
    console.log(`[Shiprocket] Scheduling pickup for shipment: ${shipmentId} (Date: ${pickupDate || 'default'})`);

    const payload: any = {
        shipment_id: [parseInt(shipmentId)],
    };

    if (pickupDate) {
        payload.pickup_date = pickupDate;
    }

    const res = await shiprocketFetch("/courier/generate/pickup", {
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Schedule pickup failed: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    console.log("[Shiprocket] Schedule pickup response:", data);
    
    const responseData = data.response || data;

    // The status usually moves to pickup_scheduled.
    await db.update(shipments)
        .set({
            status: "pickup_scheduled",
            currentStatus: "pickup_scheduled",
            pickupScheduledDate: scheduledTimestamp || new Date(),
            updatedAt: new Date(),
        })
        .where(eq(shipments.shipmentId, shipmentId));

    return { success: true, rawData: responseData };
}

// ── Helper: Map Shiprocket status IDs to readable statuses ────────────────────

function mapShiprocketStatus(statusId: number | string): string {
    const statusMap: Record<string, string> = {
        "1": "awb_assigned",
        "2": "pickup_scheduled",
        "3": "pickup_queued",
        "4": "pickup_cancelled",
        "5": "out_for_pickup",
        "6": "in_transit",
        "7": "delivered",
        "8": "not_delivered",
        "9": "out_for_delivery",
        "10": "pickup_exception",
        "12": "lost",
        "13": "damaged",
        "14": "shipment_delayed",
        "15": "contact_customer_care",
        "16": "shipment_destroyed",
        "17": "un_delivered",
        "18": "shipment_booked",
        "19": "in_transit",
        "20": "out_for_delivery",
        "21": "undelivered_attempt",
        "22": "pickup_error",
        "23": "rto_initiated",
        "24": "rto_delivered",
        "25": "cancelled",
        "26": "rto_acknowledged",
        "38": "reached_destination_hub",
        "39": "misrouted",
        "40": "rto_in_intransit",
        "41": "custom_cleared",
        "42": "rto_not_delivered",
        "43": "rto_out_for_delivery",
        "44": "handover_to_courier",
        "45": "shipment_stuck",
        "46": "rto_shipment_delay",
        "47": "pickup_rescheduled",
        "48": "ndr_resolution_submitted",
    };
    return statusMap[String(statusId)] || `status_${statusId}`;
}
