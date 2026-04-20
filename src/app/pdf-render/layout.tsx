export default function PdfRenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Print Preview</title>
        <style>{`body { margin: 0; }`}</style>
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
