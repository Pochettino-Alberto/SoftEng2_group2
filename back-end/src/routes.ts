import express from "express"
import ErrorHandler from "./helper"
import Authenticator from "./routers/auth"
import { UserRoutes } from "./routers/userRoutes"
import { AuthRoutes } from "./routers/authRoutes"
import { ReportRoutes } from "./routers/reportRoutes"

const prefix = ""

/**
 * Initializes the routes for the application.
 * 
 * @remarks
 * This function sets up the routes for the application.
 * It defines the routes for the user, authentication, product, and cart resources.
 * 
 * @param {express.Application} app - The express application instance.
 */
function initRoutes(app: express.Application) {
    /**
     * The authenticator object is used to authenticate users.
     * It is used to protect the routes by requiring users to be logged in.
     * It is also used to protect routes by requiring users to have the correct role.
     * All routes must have the authenticator object in order to work properly.
     */
    const authenticator = new Authenticator(app)
    const userRoutes = new UserRoutes(authenticator)
    const authRoutes = new AuthRoutes(authenticator)
    const reportRoutes = new ReportRoutes(authenticator)
    // Declare new routes here...

    app.use(`${prefix}/users`, userRoutes.getRouter())
    app.use(`${prefix}/auth`, authRoutes.getRouter())
    app.use(`${prefix}/reports`, reportRoutes.getRouter())
    
    ErrorHandler.registerErrorHandler(app)
}

export default initRoutes