import ReportDAO from '../src/dao/reportDAO'
import { ReportCommentNotFoundError } from '../src/errors/reportError'
import { ReportComment } from '../src/components/report'

describe('ReportDAO', () => {
  let dao: ReportDAO

  beforeEach(() => {
    dao = new ReportDAO()
  })

  describe('ReportDAO Comment Error Branches', () => {
    it('editCommentToReport rejects with ReportCommentNotFoundError when changes is 0', async () => {
      jest.spyOn(dao as any, 'db').mockReturnValue({
        run: function (_sql: any, _params: any, cb: any) {
          cb.call({ changes: 0 }, null)
        }
      })

      const comment = new ReportComment(999, 1, 1, 'text', '2025-01-01', '2025-01-01')

      await expect(dao.editCommentToReport(comment))
          .rejects.toBeInstanceOf(ReportCommentNotFoundError)
    })

    it('deleteCommentToReport rejects when changes is 0', async () => {
      jest.spyOn(dao as any, 'db').mockReturnValue({
        run: function (_sql: any, _params: any, cb: any) {
          cb.call({ changes: 0 }, null)
        }
      })

      await expect(
          dao.deleteCommentToReport({ id: 999, report_id: 1, commenter_id: 1 } as any)
      ).rejects.toBeInstanceOf(ReportCommentNotFoundError)
    })
  })
})
