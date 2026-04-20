'use server';
/**
 * @fileOverview A flow to remove the background from an image.
 */
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const RemoveBackgroundInputSchema = z.object({
    imageUrl: z.string().describe("The URL or data URI of the image to process."),
});
export type RemoveBackgroundInput = z.infer<typeof RemoveBackgroundInputSchema>;

const RemoveBackgroundOutputSchema = z.object({
    imageUrl: z.string().describe("The data URI of the image with the background removed."),
});
export type RemoveBackgroundOutput = z.infer<typeof RemoveBackgroundOutputSchema>;

async function imageUrlToDataUri(url: string): Promise<string> {
    if (url.startsWith('data:')) {
        return url;
    }
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    if (!contentType || !response.ok) {
        throw new Error(`Failed to fetch image from ${url}. Status: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
}

export const removeBackgroundFlow = ai.defineFlow(
    {
        name: 'removeBackgroundFlow',
        inputSchema: RemoveBackgroundInputSchema,
        outputSchema: RemoveBackgroundOutputSchema,
    },
    async (input) => {
        const dataUri = await imageUrlToDataUri(input.imageUrl);

        const { media } = await ai.generate({
            model: googleAI.model('gemini-2.5-flash-image'),
            prompt: [
                { media: { url: dataUri } },
                { text: 'Remove the background from this image. The main subject should be preserved. The output must be a PNG with a transparent background.' },
            ],
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });

        if (!media?.url) {
            throw new Error('Background removal failed: no image returned.');
        }

        return { imageUrl: media.url };
    }
);

export async function removeBackground(input: RemoveBackgroundInput): Promise<RemoveBackgroundOutput> {
    return removeBackgroundFlow(input);
}
