import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import JsonLd from '../json-ld'

describe('JsonLd', () => {
  it('renders a script element with type "application/ld+json"', () => {
    const data = { '@context': 'https://schema.org', '@type': 'SportsEvent', name: 'Test' }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
  })

  it('dangerouslySetInnerHTML contains the JSON-serialized form of data', () => {
    const data = { '@context': 'https://schema.org', '@type': 'SportsEvent', name: 'Copa América 2024' }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script?.innerHTML).toBe(JSON.stringify(data))
  })

  it('handles nested objects correctly', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://lamaquina.app/en' },
      ],
    }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script?.innerHTML).toBe(JSON.stringify(data))
  })
})
