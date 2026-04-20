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

    return <div ref={ref} />;
};


export const QrCodePanel = ({ onAddQrCode }: QrCodePanelProps) => {
    const [qrValue, setQrValue] = useState('https://amazoprint.com');
    const [selectedStyle, setSelectedStyle] = useState('default');

    return (
        <div className="p-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="qr-value-input">QR Code Value (URL or Text)</Label>
                <Textarea
                    id="qr-value-input"
                    value={qrValue}
                    onChange={(e) => setQrValue(e.target.value)}
                    placeholder="https://example.com"
                />
            </div>
            <div className="space-y-2">
                <Label>Style</Label>
                <div className="grid grid-cols-3 gap-2">
                    {styles.map(style => (
                        <button
                            key={style.name}
                            className={cn(
                                "h-auto flex-col p-2 gap-1 aspect-square rounded-lg border-2 transition-all",
                                selectedStyle === style.name ? "border-primary bg-primary/10" : "border-transparent bg-muted hover:bg-accent"
                            )}
                            onClick={() => setSelectedStyle(style.name)}
                        >
                            <QrStylePreview options={style.options} size={48} />
                            <span className="text-[10px] font-semibold">{style.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <Button onClick={() => onAddQrCode(qrValue, selectedStyle)} className="w-full">
                <QrCode className="mr-2 h-4 w-4"/>Add QR Code
            </Button>
        </div>
    );
};
