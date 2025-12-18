import express, { Router } from "express"
import multer from "multer";
import Authenticator from "./auth"
import { query, body, param } from "express-validator"
import { Report, ReportStatus, ReportCategory, ReportPhoto, ReportStatusType, ReportComment } from "../components/report"
import { PaginatedResult } from "../components/common";
import ErrorHandler from "../helper"
import ReportController from "../controllers/reportController"
import { supabaseService } from "../services/supabaseService";
import { SupabaseBucket } from "../services/supabaseService";
import { Utility } from "../utilities";
import { SERVER_CONFIG } from "../config";
import { User } from "../components/user";
import { ReportRejectedWithoutReasonError } from "../errors/reportError";

/**
 * Represents a class that defines the routes for handling users.
 */
class ReportRoutes {
    private router: Router
    private authService: Authenticator
    private errorHandler: ErrorHandler
    private controller: ReportController

    /**
     * Constructs a new instance of the UserRoutes class.
     * @param authenticator The authenticator object used for authentication.
     */
    constructor(authenticator: Authenticator) {
        this.authService = authenticator
        this.router = express.Router()
        this.errorHandler = new ErrorHandler()
        this.controller = new ReportController
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
     */
    initRoutes() {
        const upload = multer({ storage: multer.memoryStorage() });


        /**
         * POST /report/upload
         */
        this.router.post(
            "/upload",
            this.authService.isLoggedIn,
            this.authService.isCitizen,
            upload.array("photos", 3),
            body("title").isString().notEmpty(),
            body("description").notEmpty().isString(),
            body("category_id").toInt().isInt({ min: 1 }),
            body("latitude").toFloat().isFloat(),
            body("longitude").toFloat().isFloat(),
            body("is_public").toBoolean().isBoolean(),
            (req: any, res: any, next: any) => {
                if (req.files != null && ((req.files as any[]).length > 3)) {
                    return res.status(400).json({ error: "You can upload a maximum of 3 photos." });
                }
                if (req.files != null && ((req.files as any[]).length < 1)) {
                    return res.status(400).json({ error: "You must upload at least one photo" });
                }
                next();
            },
            this.errorHandler.validateRequest,
            async (req: any, res: any, next: any) => {
                try {
                    const { title, description, category_id, latitude, longitude, is_public } = req.body;

                    const report = new Report(
                        0,
                        Number(category_id),
                        title,
                        Number.parseFloat(latitude),
                        Number.parseFloat(longitude),
                        ReportStatus.PENDING_APPROVAL,
                        Boolean(is_public),
                        req.user.id,
                        undefined,
                        undefined,
                        undefined,
                        description,
                        undefined,
                        Utility.now(),
                        undefined
                    );

                    const savedReport = await this.controller.saveReport(report);

                    let file_ids: { publicUrl: string, filePath: string }[] = []
                    if ((req.files as any[]).length > 0) {
                        file_ids = await supabaseService.uploadFiles(
                            `${savedReport.category_id}/${savedReport.id}`,
                            req.files as Express.Multer.File[],
                            SupabaseBucket.REPORT_PHOTOS_BUCKET
                        );
                    }
                    let reportPhotos: ReportPhoto[] = [];
                    file_ids.forEach((elm, index) => reportPhotos.push(new ReportPhoto(
                        0, report.id, index + 1, elm.publicUrl, elm.filePath
                    )));
                    savedReport.photos = reportPhotos;
                    if (reportPhotos.length > 0)
                        await this.controller.saveReportPhotos(savedReport);

                    res.status(201).json(savedReport);
                } catch (err) {
                    console.error('REPORT UPLOAD ERROR:', err);
                    next(err);
                }
            }
        );


        this.router.get(
            "/categories",
            express.json({ limit: SERVER_CONFIG.MAX_JSON_SIZE }),
            express.urlencoded({ limit: SERVER_CONFIG.MAX_URL_SIZE, extended: SERVER_CONFIG.USE_QS_LIBRARY_FOR_URL_ENCODING }),
            (req: any, res: any, next: any) => {
                this.controller.getReportCategories()
                    .then((categories: ReportCategory[]) => res.status(200).json(categories))
                    .catch((err: any) => next(err));
            }
        );

        // Anyone is able to get report details
        this.router.get(
            "/report/:id",
            express.json({ limit: SERVER_CONFIG.MAX_JSON_SIZE }),
            express.urlencoded({ limit: SERVER_CONFIG.MAX_URL_SIZE, extended: SERVER_CONFIG.USE_QS_LIBRARY_FOR_URL_ENCODING }),
            //this.authService.isAdminOrMunicipality,
            (req: any, res: any, next: any) => {
                const reportId = Number(req.params.id);
                this.controller.getReportById(reportId)
                    .then((report: Report) => res.status(200).json(report))
                    .catch((err: any) => next(err));
            }
        );

        this.router.patch(
            "/report/:id/status",
            express.json({ limit: SERVER_CONFIG.MAX_JSON_SIZE }),
            express.urlencoded({ limit: SERVER_CONFIG.MAX_URL_SIZE, extended: SERVER_CONFIG.USE_QS_LIBRARY_FOR_URL_ENCODING }),
            this.authService.isAdminOrMunicipality,
            param("id").toInt().isInt({ min: 1 }),
            body("status").isString().isIn([ReportStatus.ASSIGNED, ReportStatus.REJECTED]),
            body("status_reason").optional().isString().trim(),
            body("status_reason").custom((value, { req }) => {
                if (req.body.status === ReportStatus.REJECTED && (!value || value.trim() === '')) {
                    throw new ReportRejectedWithoutReasonError();
                }
                return true;
            }),
            this.errorHandler.validateRequest,
            async (req: any, res: any, next: any) => {
                try {
                    const reportId = Number(req.params.id);
                    const { status, status_reason } = req.body;

                    await this.controller.updateReportStatus(reportId, status as ReportStatusType, status_reason);

                    const updatedReport = await this.controller.getReportById(reportId);

                    res.status(200).json(updatedReport);
                } catch (err) {
                    console.error('REPORT STATUS UPDATE ERROR:', err);
                    next(err);
                }
            }
        );

        /**
         * GET /reports/search-reports
         * Query Parameters:
         * - page_num (optional): The page number for pagination (default: 1).
         * - page_size (optional): The number of reports per page (default: 10).
         * - status (optional): Filter reports by status (e.g., 'Pending Approval', 'Assigned', 'Resolved', 'Rejected').
         * - is_public (optional): Filter reports by their public visibility (true or false).
         * - category_id (optional): Filter reports by category ID.
         * 
         * Returns a paginated list of reports based on the provided filters.
         */
        this.router.get(
            "/search-reports",
            express.json({ limit: SERVER_CONFIG.MAX_JSON_SIZE }),
            express.urlencoded({ limit: SERVER_CONFIG.MAX_URL_SIZE, extended: SERVER_CONFIG.USE_QS_LIBRARY_FOR_URL_ENCODING }),
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

        /**
         * GET /reports/get-map-reports
         * Returns all reports for displaying on a map.
         * Optional body parameter:
         * @param statusArray: An array of report statuses to filter the reports (e.g., ['Assigned', 'In Progress']).
         * @return A list of all reports matching the specified statuses.
         * This endpoint can be called without authentication.
         */
        this.router.get(
            "/get-map-reports",
            body("statusArray").optional().isArray().isIn(Object.values(ReportStatus)),
            express.json({ limit: SERVER_CONFIG.MAX_JSON_SIZE }),
            express.urlencoded({ limit: SERVER_CONFIG.MAX_URL_SIZE, extended: SERVER_CONFIG.USE_QS_LIBRARY_FOR_URL_ENCODING }),
            (req: any, res: any, next: any) => {
                this.controller.getMapReports(
                    req.body.statusArray || null
                )
                    .then((pagReports: Report[]) => res.status(200).json(pagReports))
                    .catch((err: any) => next(err));
            }
        );

        this.router.get(
            "/tos-users",
            express.json({ limit: SERVER_CONFIG.MAX_JSON_SIZE }),
            express.urlencoded({ limit: SERVER_CONFIG.MAX_URL_SIZE, extended: SERVER_CONFIG.USE_QS_LIBRARY_FOR_URL_ENCODING }),
            this.authService.isAdminOrMunicipality,
            query("category_id").toInt().isInt({ min: 1 }),
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => {
                this.controller.getTOSUsersByCategory(Number(req.query.category_id))
                    .then((users: User[]) => res.status(200).json(users))
                    .catch((err: any) => next(err));
            }
        );

        this.router.get(
            "/maintainer-users",
            express.json({ limit: SERVER_CONFIG.MAX_JSON_SIZE }),
            express.urlencoded({ limit: SERVER_CONFIG.MAX_URL_SIZE, extended: SERVER_CONFIG.USE_QS_LIBRARY_FOR_URL_ENCODING }),
            this.authService.hasRoleTechOff,
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => {
                this.controller.getAllMaintainers()
                    .then((users: User[]) => res.status(200).json(users))
                    .catch((err: any) => next(err));
            }
        );

        this.router.patch(
            "/report/:id/assign",
            express.json({ limit: SERVER_CONFIG.MAX_JSON_SIZE }),
            express.urlencoded({ limit: SERVER_CONFIG.MAX_URL_SIZE, extended: SERVER_CONFIG.USE_QS_LIBRARY_FOR_URL_ENCODING }),
            this.authService.isAdminOrMunicipality,
            param("id").toInt().isInt({ min: 1 }),
            body("assigned_to").toInt().isInt({ min: 1 }),
            this.errorHandler.validateRequest,
            async (req: any, res: any, next: any) => {
                try {
                    const reportId = Number(req.params.id);
                    const assignedToId = Number(req.body.assigned_to);
                    const assignedFromId = Number(req.user.id);
                    const updatedReport = await this.controller.assignReportToUser(reportId, assignedToId, assignedFromId);

                    res.status(200).json(updatedReport);
                } catch (err) {
                    console.error('REPORT ASSIGNMENT ERROR:', err);
                    next(err);
                }
            }
        );


        /** GET /reports/assigned-to-techOfficer
         *  Returns all reports assigned to the authenticated technical officer
         * Error codes:
         * 401 -> if the user that calls the api isn't a technical officer
         * 500 -> for other errors
         */
        this.router.get(
            "/assigned-to-techOfficer",
            express.json({ limit: SERVER_CONFIG.MAX_JSON_SIZE }),
            express.urlencoded({ limit: SERVER_CONFIG.MAX_URL_SIZE, extended: SERVER_CONFIG.USE_QS_LIBRARY_FOR_URL_ENCODING }),
            this.authService.hasRoleTechOff,
            (req: any, res: any, next: any) => {
                try {
                    const techOfficerId = req.user.id;
                    // debugging
                    console.log('[GET /reports/assigned-to-techOfficer] user:', req.user);
                    this.controller.getReportsAssignedToTechOfficer(techOfficerId)
                        .then((reports: Report[]) => res.status(200).json(reports))
                        .catch((err: any) => { // debugging
                            console.error('[GET /reports/assigned-to-techOfficer] controller error:', err);
                            next(err);
                        });
                } catch (err) {
                    // debugging
                    console.error('[GET /reports/assigned-to-techOfficer] unexpected error:', err);
                    next(err);
                }
            }
        );

        /** GET /reports/assigned-to-maintainer
         *  Returns all reports assigned to the authenticated maintainer
         * Error codes:
         * 401 -> if the user that calls the api isn't a maintainer
         * 500 -> for other errors
         */
        this.router.get(
            "/assigned-to-maintainer",
            express.json({ limit: SERVER_CONFIG.MAX_JSON_SIZE }),
            express.urlencoded({ limit: SERVER_CONFIG.MAX_URL_SIZE, extended: SERVER_CONFIG.USE_QS_LIBRARY_FOR_URL_ENCODING }),
            this.authService.hasRoleMaintainer,
            (req: any, res: any, next: any) => {
                try {
                    const maintainerId = req.user.id;
                    this.controller.getReportsAssignedToMaintainer(maintainerId)
                        .then((reports: Report[]) => res.status(200).json(reports))
                        .catch((err: any) => {
                            console.error('[GET /reports/assigned-to-maintainer] controller error:', err);
                            next(err);
                        });
                } catch (err) {
                    console.error('[GET /reports/assigned-to-maintainer] unexpected error:', err);
                    next(err);
                }
            }
        );

        /**
         * PATCH /report/:id/assign-maintainer
         * Assigns a report to an external maintainer.
         * - Status remains 'Assigned' (or current status).
         * - maintainer_id is updated.
         * - updated_by is set to the Tech Officer's ID.
         */
        this.router.patch(
            "/report/:id/assign-maintainer",
            express.json({ limit: SERVER_CONFIG.MAX_JSON_SIZE }),
            express.urlencoded({ limit: SERVER_CONFIG.MAX_URL_SIZE, extended: SERVER_CONFIG.USE_QS_LIBRARY_FOR_URL_ENCODING }),
            this.authService.hasRoleTechOff,
            param("id").toInt().isInt({ min: 1 }),
            body("maintainer_id").toInt().isInt({ min: 1 }),
            this.errorHandler.validateRequest,
            async (req: any, res: any, next: any) => {
                try {
                    const reportId = Number(req.params.id);
                    const maintainerId = Number(req.body.maintainer_id);
                    const techOfficerId = Number(req.user.id);

                    const updatedReport = await this.controller.assignReportToMaintainer(
                        reportId,
                        maintainerId,
                        techOfficerId
                    );

                    res.status(200).json(updatedReport);
                } catch (err) {
                    console.error('REPORT MAINTAINER ASSIGNMENT ERROR:', err);
                    next(err);
                }
            }
        );

        /* * * * * * * * * * * * * * * * * * * * * * * * * * *
         *          REPORT COMMENTS ROUTES                   *
         * * * * * * * * * * * * * * * * * * * * * * * * * * */

        /* POST /report/:id/comment
         * Adds a comment to a report.
         * Parameters:
         * - id: Report ID (URL parameter)
         * - comment: Comment text (body parameter)
         */
        this.router.post(
            "/:report_id/comment",
            express.json({ limit: SERVER_CONFIG.MAX_JSON_SIZE }),
            express.urlencoded({ limit: SERVER_CONFIG.MAX_URL_SIZE, extended: SERVER_CONFIG.USE_QS_LIBRARY_FOR_URL_ENCODING }),
            this.authService.isLoggedIn,
            this.authService.isAdminOrMunicipality,
            param("report_id").toInt().isInt({ min: 1 }),
            body("comment").isString().notEmpty(),
            this.errorHandler.validateRequest,
            async (req: any, res: any, next: any) => {
                try {
                    const reportId = Number(req.params.report_id);
                    const commenterId = Number(req.user.id);
                    const { comment } = req.body;
                    const reportComment = new ReportComment(
                        0,
                        reportId,
                        commenterId,
                        comment,
                        Utility.now(),
                        Utility.now()
                    );
                    const savedComment = await this.controller.addCommentToReport(reportComment);
                    res.status(201).json(savedComment);
                } catch (err) {
                    console.error('REPORT COMMENT ERROR:', err);
                    next(err);
                }
            }
        );
    }
}

export { ReportRoutes }