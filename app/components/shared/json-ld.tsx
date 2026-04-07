/**
 * Server component that injects JSON-LD structured data into the page.
 * Google reads JSON-LD from both <head> and <body>, so placement in JSX body is valid.
 */
export default function JsonLd({ data }: Readonly<{ data: object }>) {
  return (
    <script
      type="application/ld+json"
      // NOSONAR - data is our own serialized JSON, not user input
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
