import { describe, it, expect } from 'vitest'
import { buildSportsEventJsonLd, buildBreadcrumbListJsonLd } from '../json-ld-utils'

describe('buildSportsEventJsonLd', () => {
  const startDate = new Date('2024-06-20T18:00:00.000Z')

  it('returns an object with @context "https://schema.org"', () => {
    const result = buildSportsEventJsonLd('Copa América 2024', 'https://lamaquina.app/en/tournaments/copa-america-2024', startDate) as Record<string, unknown>
    expect(result['@context']).toBe('https://schema.org')
  })

  it('returns an object with @type "SportsEvent"', () => {
    const result = buildSportsEventJsonLd('Copa América 2024', 'https://lamaquina.app/en/tournaments/copa-america-2024', startDate) as Record<string, unknown>
    expect(result['@type']).toBe('SportsEvent')
  })

  it('sets name to the provided tournament name', () => {
    const result = buildSportsEventJsonLd('Copa América 2024', 'https://lamaquina.app/en/tournaments/copa-america-2024', startDate) as Record<string, unknown>
    expect(result.name).toBe('Copa América 2024')
  })

  it('converts startDate to a valid ISO 8601 string', () => {
    const result = buildSportsEventJsonLd('Copa América 2024', 'https://lamaquina.app/en/tournaments/copa-america-2024', startDate) as Record<string, unknown>
    expect(result.startDate).toBe('2024-06-20T18:00:00.000Z')
    expect(new Date(result.startDate as string).toISOString()).toBe('2024-06-20T18:00:00.000Z')
  })

  it('sets url to the provided url', () => {
    const url = 'https://lamaquina.app/en/tournaments/copa-america-2024'
    const result = buildSportsEventJsonLd('Copa América 2024', url, startDate) as Record<string, unknown>
    expect(result.url).toBe(url)
  })
})

describe('buildBreadcrumbListJsonLd', () => {
  it('returns an object with @context "https://schema.org"', () => {
    const result = buildBreadcrumbListJsonLd([]) as Record<string, unknown>
    expect(result['@context']).toBe('https://schema.org')
  })

  it('returns an object with @type "BreadcrumbList"', () => {
    const result = buildBreadcrumbListJsonLd([]) as Record<string, unknown>
    expect(result['@type']).toBe('BreadcrumbList')
  })

  it('returns empty itemListElement for empty input array', () => {
    const result = buildBreadcrumbListJsonLd([]) as Record<string, unknown>
    expect(result.itemListElement).toEqual([])
  })

  it('itemListElement has correct length matching input array', () => {
    const items = [
      { name: 'Home', url: 'https://lamaquina.app/en' },
      { name: 'Copa América 2024', url: 'https://lamaquina.app/en/tournaments/copa-america-2024' },
      { name: 'Results', url: 'https://lamaquina.app/en/tournaments/copa-america-2024/results' },
    ]
    const result = buildBreadcrumbListJsonLd(items) as Record<string, unknown>
    const list = result.itemListElement as unknown[]
    expect(list).toHaveLength(3)
  })

  it('positions are 1-indexed sequentially', () => {
    const items = [
      { name: 'Home', url: 'https://lamaquina.app/en' },
      { name: 'Copa América 2024', url: 'https://lamaquina.app/en/tournaments/copa-america-2024' },
      { name: 'Results', url: 'https://lamaquina.app/en/tournaments/copa-america-2024/results' },
    ]
    const result = buildBreadcrumbListJsonLd(items) as Record<string, unknown>
    const list = result.itemListElement as Array<Record<string, unknown>>
    expect(list[0].position).toBe(1)
    expect(list[1].position).toBe(2)
    expect(list[2].position).toBe(3)
  })

  it('each item has correct name and item (url) values', () => {
    const items = [
      { name: 'Home', url: 'https://lamaquina.app/en' },
      { name: 'Copa América 2024', url: 'https://lamaquina.app/en/tournaments/copa-america-2024' },
      { name: 'Results', url: 'https://lamaquina.app/en/tournaments/copa-america-2024/results' },
    ]
    const result = buildBreadcrumbListJsonLd(items) as Record<string, unknown>
    const list = result.itemListElement as Array<Record<string, unknown>>
    expect(list[0].name).toBe('Home')
    expect(list[0].item).toBe('https://lamaquina.app/en')
    expect(list[1].name).toBe('Copa América 2024')
    expect(list[1].item).toBe('https://lamaquina.app/en/tournaments/copa-america-2024')
    expect(list[2].name).toBe('Results')
    expect(list[2].item).toBe('https://lamaquina.app/en/tournaments/copa-america-2024/results')
  })

  it('each list item has @type "ListItem"', () => {
    const items = [{ name: 'Home', url: 'https://lamaquina.app/en' }]
    const result = buildBreadcrumbListJsonLd(items) as Record<string, unknown>
    const list = result.itemListElement as Array<Record<string, unknown>>
    expect(list[0]['@type']).toBe('ListItem')
  })
})
