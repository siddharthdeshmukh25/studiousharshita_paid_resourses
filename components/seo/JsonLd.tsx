/**
 * Renders one or more schema.org JSON-LD blocks.
 * Escapes "<" so user content can never break out of the script tag.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const payload = Array.isArray(data) ? data : [data];

  return (
    <>
      {payload.map((entry, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  );
}
