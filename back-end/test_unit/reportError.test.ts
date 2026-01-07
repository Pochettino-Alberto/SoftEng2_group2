import { ReportNotFoundError, ReportRejectedWithoutReasonError } from "../src/errors/reportError"

describe('Report errors', () => {
    it('ReportNotFoundError has correct customCode and message', () => {
        const error = new ReportNotFoundError()
        expect(error.customCode).toBe(404)
        expect(error.customMessage).toBe("The report does not exist")
        expect(error.message).toBe("The report does not exist")
    })

    it('ReportRejectedWithoutReasonError has correct customCode and message', () => {
        const error = new ReportRejectedWithoutReasonError()
        expect(error.customCode).toBe(400)
        expect(error.customMessage).toBe("Status reason is required when rejecting a report")
    })
})
