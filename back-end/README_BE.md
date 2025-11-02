# Back-end structure overview

- Return to the [main README](../README.md).

## Structure

TODO: add here description of folder structure

## Routes - business logic

- for more detail on each route checkout the [postman collection](./postman_collection.json).

### Main routes path defines the user type needed, centralizing control using middleweres

| Path                 | Allowed for                |
| -------------------- | -------------------------- |
| **/auth/\***         | everybody                  |
| **/admin/\***        | user_type = `admin`        |
| **/citizen/\***      | user_type = `citizen`      |
| **/municipality/\*** | user_type = `municipality` |

### auth routes

| Method & Path           | Description / Business Logic                                               |
| ----------------------- | -------------------------------------------------------------------------- |
| **POST /auth/register** | Registers a new citizen user                                               |
| **POST /auth/login**    | Authenticates a user (citizen or municipality user) and issues a JWT token |
| **POST /auth/logout**   | Invalidates user session/token                                             |

### admin routes

| Method & Path                     | Description / Business Logic                           |
| --------------------------------- | ------------------------------------------------------ |
| **GET /admin/search-users**       | Lists users                                            |
| **POST /admin/user**              | Registers a new municipality user                      |
| **DELETE /admin/user**            | Deletes a municipality user account                    |
| **GET /admin/municipality-roles** | Returns a list of Turin municipality technical offices |
| **POST /admin/user/role**         | Assigns a role to a municipality user                  |
| **DELETE /admin/user/role**       | Removes assignment of a role to a municipality user    |

### citizen routes

| Method & Path | Description / Business Logic |
| ------------- | ---------------------------- |
|               |                              |

### municipality routes

| Method & Path | Description / Business Logic |
| ------------- | ---------------------------- |
|               |                              |
