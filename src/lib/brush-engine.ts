export type BrushEngineTip = 'chisel' | 'dry_bristle' | 'rake' | 'charcoal' | 'ink' | 'spray' | 'airbrush' | 'soft_round' | 'hard_round' | 'glow' | 'eraser';

export type BristleProfile = {
    dx: number;
    dy: number;
    length: number;
    thickness: number;
    opacity: number;
}[];

// High-performance dab cache
const dabCache: Record<string, HTMLCanvasElement> = {};

function getSoftDab(color: string): HTMLCanvasElement {
    if (dabCache[color]) return dabCache[color];

    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, color);
    grad.addColorStop(0.5, color); // Keep center dense
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    dabCache[color] = canvas;
    return canvas;
}

/**
 * Generates the "profile" of the brush head based on the brush type and size.
 */
export function buildBrushTip(type: BrushEngineTip, size: number): BristleProfile {
    const bristleTip: BristleProfile = [];
    const isRadial = ['airbrush', 'soft_round', 'hard_round', 'glow', 'eraser'].includes(type);
    if (isRadial) {
        return [{
            dx: 0, dy: 0, 
            length: size, 
            thickness: size, 
            opacity: 1 
        }];
    }

    const density = type === 'spray' ? 120 : 80;

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
        } else if (type === 'charcoal' || type === 'ink' || type === 'spray') {
            // Spray uses a linear distribution which naturally clusters more at the center than sqrt(random)
            const r = type === 'spray' 
                ? (size / 2) * Math.random() 
                : (size / 2) * Math.sqrt(Math.random());
            const th = Math.random() * Math.PI * 2;
            x = Math.cos(th) * r;
            y = Math.sin(th) * r;
        } else { // dry_bristle
            x = (Math.random() - 0.5) * size;
            y = (Math.random() - 0.5) * (size * 0.3);
        }

        bristleTip.push({
            dx: x, dy: y,
            length: type === 'spray' ? Math.random() * (size / 3) + 10 : Math.random() * 6 + 2,
            thickness: type === 'spray' ? Math.random() * (size / 3) + 10 : Math.random() * 2 + 0.5,
            opacity: type === 'spray' 
                ? Math.pow(1 - (Math.hypot(x, y) / (size / 2)), 3) * 0.15 // Cubic falloff for softer edges
                : Math.random() * 0.4 + 0.1
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
    flow: number,
    softness: number = 0.8
) {
    const isRadial = ['airbrush', 'soft_round', 'hard_round', 'glow', 'eraser'].includes(type);

    const dist = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    // PSEUDO-PRESSURE: Moving faster makes the brush thinner/lighter
    const velocity = Math.min(dist / 25, 1);
    const pressure = 1 - (velocity * 0.4);

    // High-resolution interpolation (no dots!)
    const step = type === 'spray' ? 4 : 0.8;
    for (let i = 0; i < dist; i += step) {
        const cx = x1 + Math.cos(angle) * i;
        const cy = y1 + Math.sin(angle) * i;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        bristleTip.forEach(b => {
            // Radial brushes don't use the bristle profile loop the same way
            // But we can use the loop if we want multiple "spray" dabs.
            // However, the user's example is a single shaped dab per coordinate.
            // For now, if it's radial, we'll draw one dab per interpolation point.
            if (isRadial) return;

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
            
            if (type === 'spray') {
                const dab = getSoftDab(color);
                const dabSize = b.thickness;
                ctx.drawImage(dab, xPos - dabSize/2, yPos - dabSize/2, dabSize, dabSize);
            } else {
                ctx.fillRect(xPos, yPos, b.length, b.thickness);
            }
        });

        if (isRadial) {
            const size = bristleTip[0]?.thickness || 50; // Use first bristle size as base
            const radius = (size / 2) * pressure;

            ctx.globalCompositeOperation = "source-over";
            if (type === 'eraser') {
                ctx.globalCompositeOperation = "destination-out";
            }

            if (type === 'hard_round') {
                ctx.globalAlpha = flow * pressure;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
            } else {
                if (type === 'glow') {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 25 * pressure;
                }

                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
                const rgba = hexToRgba(color, flow * pressure);

                if (type === 'airbrush') {
                    gradient.addColorStop(0, rgba);
                    gradient.addColorStop(softness, hexToRgba(color, flow * 0.5 * pressure));
                    gradient.addColorStop(1, hexToRgba(color, 0));
                } else if (type === 'eraser') {
                    gradient.addColorStop(0, `rgba(0,0,0,${0.3 * flow * pressure})`);
                    gradient.addColorStop(1, "rgba(0,0,0,0)");
                } else { // soft_round or glow
                    gradient.addColorStop(0, rgba);
                    gradient.addColorStop(1, hexToRgba(color, 0));
                }

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
        ctx.restore();
    }
}

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
