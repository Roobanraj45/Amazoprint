'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function TemplateGrid({ templates, product }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredTemplates = templates.filter((template) => {
    return template.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div>
          <Label htmlFor="search-templates" className="sr-only">Search templates</Label>
          <Input
            id="search-templates"
            placeholder="Search templates..."
            className="md:max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <Link
            key={template.id}
            href={`/design/${product.slug}?templateId=${template.id}`}
            className="h-full block group"
            aria-label={`Use ${template.name} template`}
          >
            <Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
              <CardHeader className="p-0 relative aspect-video bg-muted">
                {template.thumbnailUrl && template.thumbnailUrl.trim() ? (
                    <Image
                      src={template.thumbnailUrl.trim()}
                      alt={template.name}
                      fill
                      className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Palette className="h-12 w-12 text-muted-foreground" />
                    </div>
                )}
              </CardHeader>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold">{template.name}</h3>
                <div className="inline-flex items-center gap-1 p-0 mt-4 h-auto text-base text-primary group-hover:underline">
                  Customize
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filteredTemplates.length === 0 && (
          <div className="col-span-full text-center py-16">
            <p className="text-muted-foreground">No templates found matching your criteria.</p>
          </div>
        )}
      </div>
    </>
  );
}
