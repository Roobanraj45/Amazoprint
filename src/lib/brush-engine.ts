export type BrushEngineTip = 'chisel' | 'dry_bristle' | 'rake' | 'charcoal' | 'ink';

export type BristleProfile = {
    dx: number;
    dy: number;
    length: number;
    thickness: number;
    opacity: number;
}[];

/**
 * Generates the "profile" of the brush head based on the brush type and size.
 */
export function buildBrushTip(type: BrushEngineTip, size: number): BristleProfile {
    const bristleTip: BristleProfile = [];
    const density = 80;

    for (let i = 0; i < density; i++) {
        let x = 0, y = 0;
        if (type === 'chisel') {
            // Flat, sharp profile
            x = (Math.random() - 0.5) * size;
            y = (Math.random() - 0.5) * 1.5; // Very thin depth for sharpness
        } else if (type === 'rake') {
            const gap = size / 4;
            x = (Math.round((Math.random() - 0.5) * 4) * gap);
            y = (Math.random() - 0.5) * 2;
        } else if (type === 'charcoal' || type === 'ink') {
            const r = (size / 2) * Math.sqrt(Math.random());
            const th = Math.random() * Math.PI * 2;
            x = Math.cos(th) * r;
            y = Math.sin(th) * r;
        } else { // dry_bristle
            x = (Math.random() - 0.5) * size;
            y = (Math.random() - 0.5) * (size * 0.3);
        }

        bristleTip.push({
            dx: x, dy: y,
            length: Math.random() * 6 + 2,
            thickness: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.4 + 0.1
        });
    }

    return bristleTip;
}

/**
 * Draws a single high-resolution pseudo-pressure line segment between two points.
 * Call this iteratively for every line segment in a user's stroke.
 */
export function renderBristleSegment(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    bristleTip: BristleProfile,
    type: BrushEngineTip,
    color: string,
    flow: number
) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    // PSEUDO-PRESSURE: Moving faster makes the brush thinner/lighter
    const velocity = Math.min(dist / 25, 1);
    const pressure = 1 - (velocity * 0.4);

    // High-resolution interpolation (no dots!)
    for (let i = 0; i < dist; i += 0.8) {
        const cx = x1 + Math.cos(angle) * i;
        const cy = y1 + Math.sin(angle) * i;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        bristleTip.forEach(b => {
            // Paper Texture Grain (skipping random bristles)
            let skip = 0.95;
            if (type === 'charcoal') skip = 0.8;
            if (Math.random() > skip) return;

            ctx.globalAlpha = b.opacity * flow * pressure;
            ctx.fillStyle = color;
            
            // Draw the hair. 
            // By swapping x/y based on rotation, we keep the chisel edge "sharp"
            const xPos = b.dy * pressure;
            const yPos = b.dx * pressure;
            
            ctx.fillRect(xPos, yPos, b.length, b.thickness);
        });
        ctx.restore();
    }
}
