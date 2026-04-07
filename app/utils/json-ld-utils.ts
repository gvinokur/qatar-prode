export interface BreadcrumbItem {
  name: string
  url: string
}

/**
 * Builds a schema.org SportsEvent JSON-LD object for a tournament.
 * locations is an optional array of place names (e.g. ["Qatar", "Lusail"]).
 */
export function buildSportsEventJsonLd(name: string, url: string, startDate: Date, locations?: string[]): object {
  const result: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name,
    startDate: startDate.toISOString(),
    url,
  }

  if (locations && locations.length > 0) {
    result.location = locations.map((loc) => ({ '@type': 'Place', name: loc }))
  }

  return result
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
