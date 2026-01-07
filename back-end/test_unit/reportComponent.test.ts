import { Report, ReportPhoto, ReportCategory, ReportStatus } from '../src/components/report'
import { Utility } from '../src/utilities'

describe('Report component classes', () => {
  it('ReportStatus contains expected values', () => {
    expect(ReportStatus.PENDING_APPROVAL).toBe('Pending Approval')
    expect(ReportStatus.RESOLVED).toBe('Resolved')
  })

  it('ReportCategory constructor assigns fields', () => {
    const rc = new ReportCategory(5, 'Road', 'road-icon', 'Potholes and road issues')
    expect(rc.id).toBe(5)
    expect(rc.name).toBe('Road')
    expect(rc.icon).toBe('road-icon')
    expect(rc.description).toBe('Potholes and road issues')
  })

  it('ReportPhoto constructor maps url and path correctly', () => {
    const rp = new ReportPhoto(0, 10, 2, 'https://img.example/pic.jpg', '/data/pic.jpg')
    expect(rp.id).toBe(0)
    expect(rp.report_id).toBe(10)
    expect(rp.position).toBe(2)
    expect(rp.photo_public_url).toBe('https://img.example/pic.jpg')
    expect(rp.photo_path).toBe('/data/pic.jpg')
  })

  it('Report constructor sets defaults and uses Utility.now for dates', () => {
    const now = Utility.now()
    const r = new Report(
      0,
      3,
      'Broken streetlight',
      45.0,
      7.0,
      ReportStatus.PENDING_APPROVAL,
      true,
      12,
      undefined,
      undefined,
      34,
      'The light is out',
      'Awaiting parts'
    )

    expect(r.id).toBe(0)
    expect(r.category_id).toBe(3)
    expect(r.title).toBe('Broken streetlight')
    expect(r.latitude).toBe(45.0)
    expect(r.longitude).toBe(7.0)
    expect(r.status).toBe(ReportStatus.PENDING_APPROVAL)
    expect(r.is_public).toBe(true)
    expect(r.reporter_id).toBe(12)
    expect(r.updated_by).toBe(34)
    expect(r.description).toBe('The light is out')
    expect(r.status_reason).toBe('Awaiting parts')
    // createdAt/updatedAt default to Utility.now()
    expect(r.createdAt).toBe(now)
    expect(r.updatedAt).toBe(now)
    // photos is not initialised by constructor
    expect((r as any).photos).toBeUndefined()
  })

  it('Report constructor uses provided dates if passed', () => {
    const created = '2023-01-01'
    const updated = '2023-01-02'
    const r = new Report(
      0, 1, 'Title', 0, 0, ReportStatus.RESOLVED, false,
      undefined, undefined, undefined, undefined,
      undefined, undefined,
      created, updated
    )
    expect(r.createdAt).toBe(created)
    expect(r.updatedAt).toBe(updated)
  })

  it('Report constructor handles minimal arguments', () => {
    const r = new Report(
      0, 1, 'Title', 10, 20, ReportStatus.ASSIGNED
    )
    expect(r.is_public).toBe(false) // default
    expect(r.reporter_id).toBeUndefined()
    expect(r.assigned_from_id).toBeUndefined()
    expect(r.maintainer_id).toBeUndefined()
    expect(r.updated_by).toBeUndefined()
    expect(r.description).toBeUndefined()
    expect(r.status_reason).toBeUndefined()
    expect(r.createdAt).toBeDefined()
    expect(r.updatedAt).toBeDefined()
  })
})
