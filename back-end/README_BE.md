# Back-end structure overview

- Return to the [main README](../README.md).

## Structure

The server can be launched with <code>nodemon index.ts</code>
<br/> The code structure is the follow

- `/components`: contains the entities used in this project
- `/controllers`: contains the control logic.
- `/dao`: contains the logic for communicating to the Sqlite database.
- `/errors`: in this folder you can create custom error classes (see UserError.ts example)
- `/routers`: contains the routers for the different entities
- `helper.ts`: declares the ErrorHandler used by the whole application for detailed HTTP errors
- `routes.ts`: this module is called by `index.ts`, and defines the routes names for each service
- `utilities.ts`: used for defining some useful static methods

## Routes - business logic

- for more detail on each route checkout the [postman collection](./postman_collection.json).
- ? after a Body parameter means that it is optional (can be null)

### auth routes

| Method & Path           | Body                 | Description / Business Logic                                                 |
| ----------------------- | -------------------- | ---------------------------------------------------------------------------- |
| **POST /auth/login**    | {username, password} | Authenticates a user (citizen / municipality / admin) and issues a JWT token |
| **GET /auth/current**   |                      | Route for retrieving the currently logged in user data                       |
| **DELETE /auth/logout** |                      | Invalidates user session/token                                               |

### user routes

| Method & Path                     | Body                                                             | Description / Business Logic                                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **POST /users/register-citizen**  | {username, name, surname, email, password}                       | Registers a new citizen user (does not require authentication)                                                                                 |
| **POST /users/register-user**     | {username, name, surname, email, password, role}                 | Registers a new user for a given role (requires admin privileges)                                                                              |
| **PATCH /users/edit-me**          | {id, username?, name?, surname?, email?}                         | Updates the profile of the current logged in user                                                                                              |
| **PATCH /users/edit-user**        | {id, username?, name?, surname?, email?, usertype?, rolesArray?} | Updates the profile of a generic user (requires admin privileges). NOTE: rolesArray contains the roles identifiers so it is an Array<Int> type. You must specify all new and old roles! If it's null, no modification to the user roles will be performed. |
| **GET /users/get-roles**          |                                                                  | Return all the roles available on the database (requires admin privileges)                                                                     |
| **GET /users/get-roles/:userId**  |                                                                  | Return all the roles available on the database (requires admin privileges)                                                                     |
| -- the following routes are todo  |                                                                  |                                                                                                                                                |
| **GET /users/search-users**       |                                                                  | Lists users                                                                                                                                    |
| **DELETE /users/user**            |                                                                  | Deletes a municipality user account                                                                                                            |
| **GET /users/municipality-roles** |                                                                  | Returns a list of Turin municipality technical offices                                                                                         |

| **DELETE /users/user/role** | | Removes assignment of a role to a municipality user |
