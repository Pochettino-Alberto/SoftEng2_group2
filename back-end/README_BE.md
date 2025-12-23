# Back-end structure overview

- Return to the [main README](../README.md).

## Tests

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Pochettino-Alberto_SoftEng2_group2&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Pochettino-Alberto_SoftEng2_group2)

## Structure

The server can be launched with <code>nodemon index.ts</code>
<br/> The code structure is the follow

- `/components`: contains the entities used in this project
- `/controllers`: contains the control logic.
- `/dao`: contains the logic for communicating to the Sqlite database.
- `/errors`: in this folder you can create custom error classes (see UserError.ts example)
- `/routers`: contains the routers for the different entities
- `/services`: contains additional services APIs (like Supabase for BLOB storage)
- `helper.ts`: declares the ErrorHandler used by the whole application for detailed HTTP errors
- `routes.ts`: this module is called by `index.ts`, and defines the routes names for each service
- `utilities.ts`: used for defining some useful static methods

## Routes - business logic

### auth routes

| Method & Path           | Body                 | Description / Business Logic                                                 |
| ----------------------- | -------------------- | ---------------------------------------------------------------------------- |
| **POST /auth/login**    | {username, password} | Authenticates a user (citizen / municipality / admin) and issues a JWT token |
| **GET /auth/current**   |                      | Route for retrieving the currently logged in user data                       |
| **DELETE /auth/logout** |                      | Invalidates user session/token                                               |

### user routes

| Method & Path                                  | Body                                                                      | Description / Business Logic                                                                                                                                                                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **POST /users/register-citizen**               | {username, name, surname, email, password}                                | Registers a new citizen user (does not require authentication)                                                                                                                                                                                                      |
| **POST /users/register-user**                  | {username, name, surname, email, password, role}                          | Registers a new user for a given role (requires admin privileges)                                                                                                                                                                                                   |
| **PATCH /users/edit-me**                       | {id, username?, name?, surname?, email?}                                  | Updates the profile of the current logged in user                                                                                                                                                                                                                   |
| **PATCH /users/edit-user**                     | {id, username?, name?, surname?, email?, usertype?, rolesArray?}          | Updates the profile of a generic user (requires admin privileges). <br> NOTE: rolesArray contains the roles identifiers so it is an Array<Int> type. <br>You must specify all new and old roles! If it's null, no modification to the user roles will be performed. |
| **GET /users/get-roles**                       |                                                                           | Return all the roles available on the database (requires admin privileges)                                                                                                                                                                                          |
| **GET /users/get-roles/:userId**               |                                                                           | Return all the roles of a given userId (requires admin privileges)                                                                                                                                                                                                  |
| **GET /users/search-users**                    | `first_name?`, `last_name?`, `email?`, `role?`, `page_num?`, `page_size?` | Retrieve all users that matches the provided query filters (requires admin privileges)                                                                                                                                                                              |
| **POST /users/admin/create-municipality-user** | {username, name, surname, email, password, rolesArray}                    | Registers a new user for a given role (requires admin privileges)                                                                                                                                                                                                   |
| **POST /users/admin/assign-roles**             | {userId, rolesArray}                                                      | Set (replace) roles for an existing user                                                                                                                                                                                                                            |

### report routes

| Method & Path                                   | Query / Body                                                               | Description / Business Logic                                                                                                                                                                                                                                                             |
| ----------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **POST /reports/upload**                        | {title, description, category_id, latitude, longitude, is_public, photos } | Upload a new report with at least one photo (BLOB). Requires to be logged in as a citizen.                                                                                                                                                                                               |
| **GET /reports/categories**                     |                                                                            | Retrieves all the report categories available in the system                                                                                                                                                                                                                              |
| **GET /reports/report/:id**                     | `id` (path param, required)                                                | Retrieves a single report by its ID. Includes evaluated sub-objects (category, reporter, updater, photos)                                                                                                                                                                                |
| **PATCH /reports/report/:id/status**            | `id` { status, status_reason? }                                            | Updates the status of a report (e.g., REJECTED). Requires Admin/Municipality privileges.                                                                                                                                                                                                 |
| **GET /reports/search-reports**                 | `page_num?`, `page_size?`, `status?`, `is_public?`, `category_id?`         | Searches reports with optional filters: status, visibility, category. <br> Results are paginated and ordered by `updatedAt` descending. Requires Admin/Municipality privileges                                                                                                           |
| **GET /reports/get-map-reports**                | {statusArray?}                                                             | Fetches all the reports stored on the database that match one of the statuses contained inside statusArray (if it's empty simply returns all reports). <br> Result is just a regular Report Array, ordered by `updatedAt` descending                                                     |
| **GET /reports/assigned-to-techOfficer**        |                                                                            | Retrieves the list of reports assinged to a specific technical officer. Requires Technical Officer role                                                                                                                                                                                  |
| **GET /reports/tos-users**                      | `category_id` (required)                                                   | Retrieves all municipality users (TOS) responsible for a specific report category. Requires Admin/Municipality privileges.                                                                                                                                                               |
| **PATCH /reports/report/:id/assign**            | `id` { assigned_to }                                                       | Assigns a report to a specific municipality user (Technical Officer). Sets status to 'Assigned'. Requires Admin/Municipality privileges.                                                                                                                                                 |
| **PATCH /reports/report/:id/assign-maintainer** | `id` { maintainer_id }                                                     | Assigns a report to an external maintainer. Requires Technical Officer role.                                                                                                                                                                                                             |
| **GET /reports/maintainer-users**               |                                                                            | Retrieves all users with the 'external_maintainer' role. Requires Technical Officer role.                                                                                                                                                                                                |
| **GET /reports/assigned-to-maintainer**         |                                                                            | Returns all reports assigned to the authenticated external maintainer. Requires Mainteiner role.                                                                                                                                                                                         |
| **GET /reports/:report_id/comments**            |                                                                            | Get all comments for the specified `report_id`                                                                                                                                                                                                                                           |
| **POST /reports/:report_id/comment**            | {comment}                                                                  | Add a new comment to the specified `report_id`                                                                                                                                                                                                                                           |
| **PATCH /reports/:report_id/comment**           | {comment_id, comment}                                                      | Edit an existing comment to the specified `report_id`. If the user tries to update a not owned comment a HTTP 404 error is thrown, as the the corresponding database row {comment_id, report_id, commenter_id} does not exists. The commenter_id is taken from the authentication cookie |
| **DELETE /reports/:report_id/comment**           | {comment_id}                                                      | Delete an existing comment to the specified `report_id`. If the user tries to delete a not owned comment a HTTP 404 error is thrown, as the the corresponding database row {comment_id, report_id, commenter_id} does not exists. The commenter_id is taken from the authentication cookie |

**Notes:**

- Optional body parameters are followed by a `?`
- Optional query parameters are followed by a `?`. If not provided, defaults are applied (`page_num=1`, `page_size=10`, etc.).
- The `search-reports` route is accessible only to Admin or Municipality users.
- Returned report objects include:
  - `category` (ReportCategory object)
  - `reporter` (User object)
  - `updated` (User object who last updated the report)
  - `photos` (array of ReportPhoto objects)
- for more detail on each route checkout the [postman collection](./postman_collection.json).
