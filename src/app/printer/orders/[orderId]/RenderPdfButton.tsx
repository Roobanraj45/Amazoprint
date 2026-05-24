'use client';

import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import { resolveImagePath } from "@/lib/utils";

interface RenderPdfButtonProps {
    design: any;
    designUpload: any;
    variant?: "default" | "outline";
    label?: string;
    showDownloadIcon?: boolean;
    className?: string;
}

export function RenderPdfButton({ 
    design, 
    designUpload, 
    variant = "default", 
    label = "View / Render PDF", 
    showDownloadIcon = false,
    className 
}: RenderPdfButtonProps) {
    const handleRender = () => {
        const DPI = 300;
        const MM_TO_PX = DPI / 25.4;

        if (design) {
            try {
                const productForCanvas = {
                    id: design.productSlug, 
                    name: design.name, 
                    description: '', 
                    imageId: '',
                    width: Math.round(Number(design.width) * MM_TO_PX),
                    height: Math.round(Number(design.height) * MM_TO_PX), 
                    type: '',
                };

                const pages = Array.isArray(design.elements) && Array.isArray(design.elements[0])
                    ? (design.elements as any[][]).map((els, i) => ({
                        elements: els,
                        background: (design.background as any[])[i]
                    }))
                    : [{ 
                        elements: design.elements as any[], 
                        background: design.background as any 
                    }];

                const renderData = {
                    pages: pages,
                    product: productForCanvas, 
                    guides: (design.guides as any[]) || [], 
                    bleed: 18, 
                    safetyMargin: 18,
                };
                localStorage.setItem('pdf_render_data', JSON.stringify(renderData));
                window.open('/pdf-render', '_blank');
            } catch (error) {
                console.error('Error rendering PDF layout:', error);
            }
        } else if (designUpload) {
            window.open(resolveImagePath(designUpload.filePath), '_blank');
        }
    };

    return (
        <Button 
            onClick={handleRender}
            variant={variant}
            className={className}
        >
            {showDownloadIcon ? <Download size={15} /> : <Eye size={16} />}
            {label}
        </Button>
    );
}
