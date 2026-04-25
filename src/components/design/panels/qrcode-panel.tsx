
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import QRCodeStyling from 'qr-code-styling';

type QrCodePanelProps = {
    onAddQrCode: (value: string, style: string) => void;
}

const styles = [
    { name: 'default', label: 'Default', options: { dotsOptions: { type: 'squares' }, cornersSquareOptions: { type: 'square' } } },
    { name: 'dots', label: 'Dots', options: { dotsOptions: { type: 'dots' }, cornersSquareOptions: { type: 'dot' }, cornersDotOptions: { type: 'dot' } } },
    { name: 'rounded', label: 'Rounded', options: { dotsOptions: { type: 'rounded' }, cornersSquareOptions: { type: 'extra-rounded' }, cornersDotOptions: { type: 'square' } } },
    { name: 'extra-rounded', label: 'Smooth', options: { dotsOptions: { type: 'extra-rounded' }, cornersSquareOptions: { type: 'square' }, cornersDotOptions: { type: 'square' } } },
    { name: 'classy', label: 'Classy', options: { dotsOptions: { type: 'classy' }, cornersSquareOptions: { type: 'square' }, cornersDotOptions: { type: 'square' } } },
    { name: 'classy-rounded', label: 'Elegant', options: { dotsOptions: { type: 'classy-rounded' }, cornersSquareOptions: { type: 'extra-rounded' }, cornersDotOptions: { type: 'square' } } },
    { name: 'fluid', label: 'Fluid', options: { dotsOptions: { type: 'classy' }, cornersSquareOptions: { type: 'dot' }, cornersDotOptions: { type: 'dot' } } },
    { name: 'grid', label: 'Grid', options: { dotsOptions: { type: 'extra-rounded' }, cornersSquareOptions: { type: 'extra-rounded' }, cornersDotOptions: { type: 'extra-rounded' } } },
];

const QrStylePreview = ({ options, size = 64 }: { options: any, size?: number }) => {
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!ref.current) return;
        
        const qrCode = new QRCodeStyling({
            width: size,
            height: size,
            data: 'preview',
            margin: 0,
            ...options
        });
        
        ref.current.innerHTML = ''; // Clear previous
        qrCode.append(ref.current);
    }, [options, size]);

    return <div ref={ref} className="flex items-center justify-center overflow-hidden rounded" />;
};


export const QrCodePanel = ({ onAddQrCode }: QrCodePanelProps) => {
    const [qrValue, setQrValue] = useState('https://amazoprint.com');
    const [selectedStyle, setSelectedStyle] = useState('default');

    return (
        <div className="p-5 space-y-6">
            <div className="space-y-3">
                <Label htmlFor="qr-value-input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">QR Value (URL or Text)</Label>
                <Textarea
                    id="qr-value-input"
                    value={qrValue}
                    onChange={(e) => setQrValue(e.target.value)}
                    placeholder="https://example.com"
                    className="min-h-[100px] resize-none bg-background border-none shadow-inner"
                />
            </div>
            
            <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Visual Style</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {styles.map(style => (
                        <button
                            key={style.name}
                            className={cn(
                                "flex flex-col items-center justify-center p-3 gap-2 rounded-xl border-2 transition-all group",
                                selectedStyle === style.name 
                                    ? "border-primary bg-primary/5 shadow-sm" 
                                    : "border-transparent bg-background/50 hover:bg-muted"
                            )}
                            onClick={() => setSelectedStyle(style.name)}
                        >
                            <QrStylePreview options={style.options} size={48} />
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-tight",
                                selectedStyle === style.name ? "text-primary" : "text-muted-foreground"
                            )}>{style.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <Button onClick={() => onAddQrCode(qrValue, selectedStyle)} className="w-full h-12 font-black uppercase tracking-[0.1em] text-xs shadow-lg shadow-primary/20">
                <QrCode className="mr-2 h-4 w-4"/> Generate & Add
            </Button>
        </div>
    );
};
