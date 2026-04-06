export interface BreadcrumbItem {
  name: string
  url: string
}

/**
 * Builds a schema.org SportsEvent JSON-LD object for a tournament.
 */
export function buildSportsEventJsonLd(name: string, url: string, startDate: Date): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name,
    startDate: startDate.toISOString(),
    url,
  }
}

/**
 * Builds a schema.org BreadcrumbList JSON-LD object from an array of breadcrumb items.
 */
export function buildBreadcrumbListJsonLd(items: BreadcrumbItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
