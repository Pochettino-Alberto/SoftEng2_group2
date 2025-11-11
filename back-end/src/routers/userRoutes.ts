import express, { Router } from "express"
import Authenticator from "./auth"
import { body, param } from "express-validator"
import { UserType, User } from "../components/user"
import ErrorHandler from "../helper"
import UserController from "../controllers/userController"

/**
 * Represents a class that defines the routes for handling users.
 */
class UserRoutes {
    private router: Router
    private authService: Authenticator
    private errorHandler: ErrorHandler
    private controller: UserController

    /**
     * Constructs a new instance of the UserRoutes class.
     * @param authenticator The authenticator object used for authentication.
     */
    constructor(authenticator: Authenticator) {
        this.authService = authenticator
        this.router = express.Router()
        this.errorHandler = new ErrorHandler()
        this.controller = new UserController()
        this.initRoutes()
    }

    /**
     * Get the router instance.
     * @returns The router instance.
     */
    getRouter(): Router {
        return this.router
    }

    /**
     * Initializes the routes for the user router.
     * 
     * @remarks
     * This method sets up the HTTP routes for creating, retrieving, updating, and deleting user data.
     * It can (and should!) apply authentication, authorization, and validation middlewares to protect the routes.
     */
    initRoutes() {

        /**
         * Route for creating a new user for a given role.
         * It does not require authentication.
         * It requires the following body parameters:
         * - username: string. It cannot be empty and it must be unique (an existing username cannot be used to create a new user)
         * - name: string. It cannot be empty.
         * - surname: string. It cannot be empty.
         * - password: string. It cannot be empty.
         * It returns a 200 status code.
         */
        this.router.post(
            "/register-citizen",
            body('username').isString().notEmpty(),
            body('name').isString().notEmpty(),
            body('surname').isString().notEmpty(),
            body('email').isString().notEmpty(),
            body('password').isString().notEmpty(),
            /*body('username').custom(async (username) => {
                const userExists = await this.controller.usernameAlreadyInUse(username);
                if(userExists) throw new UserAlreadyExistsError();
            }),*/
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => this.controller.createUser(req.body.username, req.body.name, req.body.surname, req.body.email, req.body.password, UserType.CITIZEN)
                .then((user: User) => res.status(201).json(user))
                .catch((err) => {
                    next(err)
                })
        )

        /**
         * Admin privileges required
         * Route for creating a new user for a given role.
         * It requires the following body parameters:
         * - username: string. It cannot be empty and it must be unique (an existing username cannot be used to create a new user)
         * - name: string. It cannot be empty.
         * - surname: string. It cannot be empty.
         * - password: string. It cannot be empty.
         * - role: string (one of "Manager", "Customer", "Admin")
         * It returns a 200 status code.
         */
        this.router.post(
            "/register-user",
            this.authService.isAdmin,
            body('username').isString().notEmpty(),
            body('name').isString().notEmpty(),
            body('surname').isString().notEmpty(),
            body('email').isString().notEmpty(),
            body('password').isString().notEmpty(),
            body('role').isIn(Object.values(UserType)),
            /*body('username').custom(async (username) => {
                const userExists = await this.controller.usernameAlreadyInUse(username);
                if(userExists) throw new UserAlreadyExistsError();
            }),*/
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => this.controller.createUser(req.body.username, req.body.name, req.body.surname, req.body.email, req.body.password, req.body.role)
                .then((user: User) => res.status(201).json(user))
                .catch((err) => {
                    next(err)
                })
        )

        /**
         * Route for updating the information of a user.
         * It requires the user to be an admin.
         * It expects the username of the user to edit in the request parameters: Admin users can edit other non-Admin users.
         * It requires the following body parameters:
         * - id: string. It cannot be empty.
         * - username: string. It cannot be empty.
         * - name: string. It cannot be empty.
         * - surname: string. It cannot be empty.
         * - email: string. It cannot be empty.
         * - usertype: string [citizen | municipality | admin]. It cannot be empty.
         * It returns the updated user.
         */
        this.router.patch(
            "/edit-user",
            this.authService.isAdmin,
            body('id').isInt().notEmpty(),
            body('username').optional({nullable: true}).isString(),
            body('name').optional({nullable: true}).isString(),
            body('surname').optional({nullable: true}).isString(),
            body('email').optional({nullable: true}).isString(),
            body('usertype').optional({nullable: true}).isString(),
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => this.controller.updateUserInfo(req.user, req.body.id, req.body.username, req.body.name, req.body.surname, req.body.email, req.body.usertype)
                .then((user: any) => res.status(200).json(user))
                .catch((err: any) => next(err))
        )

        /**
         * Route for updating the information of the current logged in user.
         * It requires the following body parameters:
         * - id: string. It cannot be empty.
         * - username: string. It can be empty.
         * - name: string. It can be empty.
         * - surname: string. It can be empty.
         * - email: string. It can be empty.
         * It returns the updated user.
         */
        this.router.patch(
            "/edit-me",
            this.authService.isLoggedIn,
            body('id').isInt().notEmpty(),
            body('username').optional({nullable: true}).isString(),
            body('name').optional({nullable: true}).isString(),
            body('surname').optional({nullable: true}).isString(),
            body('email').optional({nullable: true}).isString(),
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => this.controller.updateUserInfo(req.user, req.body.id, req.body.username, req.body.name, req.body.surname, req.body.email, null)
                .then((user: any) => res.status(200).json(user))
                .catch((err: any) => next(err))
        )





        // To be checked for next tasks //


        /**
         * Route for retrieving all users.
         * It requires the user to be logged in and to be an admin.
         * It returns an array of users.
         */
        /*this.router.get(
            "/",
            this.authService.isAdmin,
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => this.controller.getUsers()
                .then((users: any) => res.status(200).json(users))
                .catch((err) => next(err))
        )*/

        /**
         * Route for retrieving all users of a specific role.
         * It requires the user to be logged in and to be an admin.
         * It expects the role of the users in the request parameters: the role must be one of ("Manager", "Customer", "Admin").
         * It returns an array of users.
         */
        /*this.router.get(
            "/roles/:role",
            this.authService.isAdmin,
            param('role').isIn(Object.values(Role)),
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => this.controller.getUsersByRole(req.params.role)
                .then((users: any) => res.status(200).json(users))
                .catch((err) => next(err))
        )*/

        /**
         * Route for retrieving a user by its username.
         * It requires the user to be authenticated: users with an Admin role can retrieve data of any user, users with a different role can only retrieve their own data.
         * It expects the username of the user in the request parameters: the username must represent an existing user.
         * It returns the user.
         */
        /*this.router.get(
            "/:username",
            this.authService.isLoggedIn,
            param('username').isString().notEmpty(),
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => this.controller.getUserByUsername(req.user, req.params.username)
                .then((user: any) => res.status(200).json(user))
                .catch((err) => next(err))
        )*/

        /**
         * Route for deleting a user.
         * It requires the user to be authenticated: users with an Admin role can delete the data of any user (except other Admins), users with a different role can only delete their own data.
         * It expects the username of the user in the request parameters: the username must represent an existing user.
         * It returns a 200 status code.
         */
        /*this.router.delete(
            "/:username",
            this.authService.isLoggedIn,
            param('username').isString().notEmpty(),
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => this.controller.deleteUser(req.user, req.params.username)
                .then(() => res.status(200).end())
                .catch((err: any) => next(err))
        )*/

        /**
         * Route for deleting all users.
         * It requires the user to be logged in and to be an admin.
         * It returns a 200 status code.
         */
        /*this.router.delete(
            "/",
            this.authService.isAdmin,
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => this.controller.deleteAll()
                .then(() => res.status(200).end())
                .catch((err: any) => next(err))
        )*/
    }
}

export { UserRoutes }