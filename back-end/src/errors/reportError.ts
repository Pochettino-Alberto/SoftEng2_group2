const REPORT_NOT_FOUND = "The report does not exist"

/**
 * Represents an error that occurs when a report is not found.
 */
class ReportNotFoundError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super(REPORT_NOT_FOUND)
        this.customMessage = REPORT_NOT_FOUND
        this.customCode = 404
    }
}

/**
 * Represents an error that occurs when a report is rejected but the status reason is not provided.
 */
class ReportRejectedWithoutReasonError extends Error {
    customMessage: string
    customCode: number
    constructor() {
        super()
        this.customMessage = "Status reason is required when rejecting a report"
        this.customCode = 400
    }
}

export { ReportNotFoundError, ReportRejectedWithoutReasonError }