'use client';

import React, { useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { DesignElement } from "@/lib/types";
import { CMYKColorPicker as ColorPicker } from "./cmyk-color-picker";
import { QrCode, Palette, Image as ImageIcon, Sparkles, Library, X } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import QRCodeStyling from 'qr-code-styling';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AssetLibrary } from "./asset-library";
import { resolveImagePath } from "@/lib/utils";

type QrCodePropertiesPanelProps = {
    element: DesignElement;
    onUpdate: (id: string, newProps: Partial<DesignElement>) => void;
    isAdmin?: boolean;
    onOpenColorPicker: (label: string, color: string, onChange: (color: string) => void) => void;
};

const SectionCard = ({ title, icon, children, ...props }: any) => (
  <div {...props}>
    <div className="flex items-center gap-2 mb-3 text-[11px] font-bold text-foreground">
      <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
        {icon}
      </div>
      {title}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

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

export function QrCodePropertiesPanel({ element, onUpdate, isAdmin, onOpenColorPicker }: QrCodePropertiesPanelProps) {
    const [isAssetLibraryOpen, setIsAssetLibraryOpen] = useState(false);

    const handleUpdate = (props: Partial<DesignElement>) => {
        onUpdate(element.id, props);
    };

    return (
        <div className="space-y-4">
            <div className="bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm space-y-4">
                <SectionCard title="Content & Options" icon={<QrCode size={14}/>}>
                    <div className="space-y-2">
                        <Label htmlFor="qr-value">Value (URL or Text)</Label>
                        <Textarea
                            id="qr-value"
                            value={element.qrValue || ''}
                            onChange={(e) => handleUpdate({ qrValue: e.target.value })}
                            placeholder="https://example.com"
                            className="h-24"
                        />
                    </div>
                        <div className="space-y-2">
                        <Label>Error Correction Level</Label>
                        <Select value={element.qrLevel || 'L'} onValueChange={(v) => handleUpdate({ qrLevel: v as any })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="L">Low (L)</SelectItem>
                                <SelectItem value="M">Medium (M)</SelectItem>
                                <SelectItem value="Q">Quartile (Q)</SelectItem>
                                <SelectItem value="H">High (H)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </SectionCard>
            </div>
                <div className="bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm space-y-4">
                <SectionCard title="Style" icon={<Sparkles size={14}/>}>
                    <div className="grid grid-cols-4 gap-2">
                        {styles.map(style => (
                            <button
                                key={style.name}
                                className={cn(
                                    "h-auto flex-col p-2 gap-1 aspect-square rounded-lg border-2 transition-all",
                                    (element.qrStylePreset === style.name || (!element.qrStylePreset && style.name === 'default')) ? "border-primary bg-primary/10" : "border-transparent bg-muted hover:bg-accent"
                                )}
                                onClick={() => handleUpdate({ qrStylePreset: style.name as any })}
                            >
                                <QrStylePreview options={style.options} size={40} />
                                <span className="text-[10px] font-semibold">{style.label}</span>
                            </button>
                        ))}
                    </div>
                </SectionCard>
            </div>
            <div className="bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm space-y-4">
                <SectionCard title="Styling" icon={<Palette size={14}/>}>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground/70 ml-1">Code color</Label>
                        <Button 
                            variant="outline" 
                            className="h-10 w-full px-3 justify-start rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                            onClick={() => onOpenColorPicker("Code color", element.qrColor || "#000000", (color) => handleUpdate({ qrColor: color }))}
                        >
                            <div className="w-5 h-5 rounded-md border border-white/20 shadow-sm mr-3" style={{ backgroundColor: element.qrColor || "#000000" }} />
                            <span className="text-xs font-mono">{element.qrColor || "#000000"}</span>
                        </Button>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground/70 ml-1">Background color</Label>
                        <Button 
                            variant="outline" 
                            className="h-10 w-full px-3 justify-start rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                            onClick={() => onOpenColorPicker("Background color", element.qrBgColor || "#FFFFFF", (color) => handleUpdate({ qrBgColor: color }))}
                        >
                            <div className="w-5 h-5 rounded-md border border-white/20 shadow-sm mr-3" style={{ backgroundColor: element.qrBgColor || "#FFFFFF" }} />
                            <span className="text-xs font-mono">{element.qrBgColor || "#FFFFFF"}</span>
                        </Button>
                    </div>
                </SectionCard>
            </div>
            <div className="bg-background/60 p-3 rounded-xl border border-border/50 shadow-sm space-y-4">
                    <SectionCard title="Center Icon" icon={<ImageIcon size={14}/>}>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 flex items-center justify-center">
                            {element.qrIconSrc ? (
                                <Image src={resolveImagePath(element.qrIconSrc)} alt="QR Icon" width={64} height={64} className="object-contain rounded-md" />
                            ) : (
                                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <Button variant="outline" size="sm" className="w-full" onClick={() => setIsAssetLibraryOpen(true)}>
                                <Library className="mr-2 h-4 w-4" /> Browse Library
                            </Button>
                            {element.qrIconSrc && (
                                <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={() => handleUpdate({ qrIconSrc: '' })}>
                                    <X className="mr-2 h-4 w-4" /> Remove Icon
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Icon Size</Label>
                            <span>{element.qrIconSize || 20}%</span>
                        </div>
                        <Slider
                            value={[element.qrIconSize || 20]}
                            onValueChange={(v) => handleUpdate({ qrIconSize: v[0] })}
                            min={10}
                            max={30}
                            step={1}
                            disabled={!element.qrIconSrc}
                        />
                    </div>
                </SectionCard>
            </div>

            <Dialog open={isAssetLibraryOpen} onOpenChange={setIsAssetLibraryOpen}>
                <DialogContent className="max-w-4xl h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Image Library</DialogTitle>
                        <DialogDescription>Select an icon for the QR code center.</DialogDescription>
                    </DialogHeader>
                    <AssetLibrary 
                        onImageSelect={(url) => {
                            handleUpdate({ qrIconSrc: url });
                            setIsAssetLibraryOpen(false);
                        }}
                        isAdmin={isAdmin} 
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
