const { validationResult } = require("express-validator")
import express from "express"

/**
 * The ErrorHandler class is used to handle errors in the application.
 */
class ErrorHandler {

    /**
     * Validates the request object and returns an error if the request object is not formatted properly, according to the middlewares used when defining the request.
     * @param req - The request object
     * @param res - The response object
     * @param next - The next function
     * @returns Returns the next function if there are no errors or a response with a status code of 422 if there are errors.
     */
    validateRequest(req: any, res: any, next: any) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            let error = "The parameters are not formatted properly\n\n"
            errors.array().forEach((e: any) => {
                error += "- Parameter: **" + e.value + "** - Reason: *" + e.msg + "* - Location: *" + e.location + "*\n\n"
            })
            return res.status(422).json({ error: error })
        }
        return next()
    }

    /**
     * Registers the error handler.
     * @param router - The router object
     */
    static registerErrorHandler(router: express.Application) {
        router.use((err: any, req: any, res: any, next: any) => {
            const statusCode = err.customCode || 500;
            // In test mode include the real error message to help debugging
            const message = err.customMessage || (process.env.NODE_ENV === 'test' && err.message) || "Internal Server Error";
            return res.status(statusCode).json({
                error: message,
                status: statusCode
            });
        })
    }
}

export default ErrorHandler