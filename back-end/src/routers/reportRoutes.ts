import express, { Router } from "express"
import multer from "multer";
import Authenticator from "./auth"
import { query, body, param } from "express-validator"
import { Report, ReportPhoto, ReportStatus, ReportCategory } from "../components/report"
import { PaginatedResult } from "../components/common";
import ErrorHandler from "../helper"
import ReportController from "../controllers/reportController"
import PhotoService from "../services/photoService"
import { Utility } from "../utilities";

/**
 * Represents a class that defines the routes for handling users.
 */
class ReportRoutes {
    private router: Router
    private authService: Authenticator
    private errorHandler: ErrorHandler
    private controller: ReportController
    private photoService: PhotoService

    /**
     * Constructs a new instance of the UserRoutes class.
     * @param authenticator The authenticator object used for authentication.
     */
    constructor(authenticator: Authenticator) {
        this.authService = authenticator
        this.router = express.Router()
        this.errorHandler = new ErrorHandler()
        this.controller = new ReportController
        this.photoService = new PhotoService
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
        const upload = multer({ storage: multer.memoryStorage() });


        /**
         * POST /report/upload
         * Create a new report
         * Body params (JSON):
         * - title: string
         * - description: string (optional)
         * - category_id: number
         * - latitude: number
         * - longitude: number
         */
        this.router.post(
            "/upload",
            //this.authService.isLoggedIn,
            //this.authService.isCitizen,    
            upload.array("photos", 3),
            body("title").isString().notEmpty(),
            body("category_id").isInt({ min: 1 }),
            body("latitude").isFloat(),
            body("longitude").isFloat(),
            body("description").optional().isString(),
            // custom file check middleware
            (req: any, res: any, next: any) => {
                if ((req.files as any[]).length > 3) {
                    return res.status(400).json({ error: "You can upload a maximum of 3 photos." });
                }
                next();
            },
            this.errorHandler.validateRequest,
            async (req: any, res: any, next: any) => {
                try {
                    const { title, description, category_id, latitude, longitude, is_public } = req.body;
                    
                    let photos_id: any[] = []
                    if((req.files as any[]).length > 0){
                        photos_id = await this.photoService.uploadFiles(req.files as Express.Multer.File[]);
                    }
                    
                    const report = new Report(
                        0,
                        Number(category_id),
                        title,
                        parseFloat(latitude),
                        parseFloat(longitude),
                        ReportStatus.PENDING_APPROVAL,
                        Boolean(is_public),
                        //req.user.id, // reporter_id
                        1,
                        undefined,
                        description,
                        undefined,
                        Utility.now(),
                        undefined,
                        photos_id
                    );

                    const savedReport = await this.controller.saveReport(report);

                    res.status(201).json(savedReport);
                } catch (err) {
                    next(err);
                }
            }
        );


        // GET /report-categories
        this.router.get(
            "/categories",
            (req: any, res: any, next: any) => {
                this.controller.getReportCategories()
                    .then((categories: ReportCategory[]) => res.status(200).json(categories))
                    .catch((err: any) => next(err));
            }
        );

        this.router.get(
            "/report/:id",
            this.authService.isAdmin,
            (req: any, res: any, next: any) => {
                const reportId = Number(req.params.id);
                this.controller.getReportById(reportId)
                    .then((report: Report) => res.status(200).json(report))
                    .catch((err: any) => next(err));
            }
        );

        this.router.get(
            "/search-reports",
            this.authService.isAdminOrMunicipality,
            query("page_num").optional().isInt({ min: 1 }),
            query("page_size").optional().isInt({ min: 1 }),
            query("status").optional().isIn(Object.values(ReportStatus)).default(null),
            query("is_public").optional().isBoolean().toBoolean(),
            query("category_id").optional().isInt({ min: 1 }),
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => {
                this.controller.searchReports(
                    req.query.page_num || null,
                    req.query.page_size || null,
                    req.query.status || null,
                    req.query.is_public ?? null,
                    req.query.category_id || null
                )
                .then((pagReports: PaginatedResult<Report>) => res.status(200).json(pagReports))
                .catch((err: any) => next(err));
            }
        );

    }
}

export { ReportRoutes }