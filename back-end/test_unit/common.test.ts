import { PaginatedResult } from '../src/components/common'

describe('PaginatedResult', () => {
  it('calculates total_pages correctly when total_items divides page_size', () => {
    const items = [1, 2, 3, 4]
    const pr = new PaginatedResult<number>(1, 2, 4, items)
    expect(pr.total_pages).toBe(2)
    expect(pr.items).toBe(items)
  })

  it('calculates total_pages with ceil when remainder exists', () => {
    const items = [1, 2, 3]
    const pr = new PaginatedResult<number>(1, 2, 3, items)
    expect(pr.total_pages).toBe(2)
  })

  it('handles zero total_items', () => {
    const items: number[] = []
    const pr = new PaginatedResult<number>(1, 10, 0, items)
    expect(pr.total_pages).toBe(0)
    expect(pr.total_items).toBe(0)
    expect(pr.items).toEqual([])
  })
})
