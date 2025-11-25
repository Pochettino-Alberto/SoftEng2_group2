# Front-end structure overview

- Return to the [main README](../README.md).

## Responsive Design

All pages are fully responsive using **Tailwind CSS mobile-first approach**:

- **Mobile** (default - 320px+): Base styles optimized for mobile devices
- **sm:** (640px+): Mobile landscape, small tablets
- **md:** (768px+): Tablets
- **lg:** (1024px+): Desktops and laptops
- **xl:** (1280px+): Large desktops
- **2xl:** (1536px+): Extra large screens

## Components

## Routes - business logic

### Main routes path defines the user type needed, centralizing control using middleweres

| Path                 | Allowed for                |
| -------------------- | -------------------------- |
| **/auth/\***         | everybody                  |
| **/admin/\***        | user_type = `admin`        |
| **/citizen/\***      | user_type = `citizen`      |
| **/municipality/\*** | user_type = `municipality` |

### auth routes

| Method & Path      | Description / Business Logic                      |
| ------------------ | ------------------------------------------------- |
| **/auth/register** | Registers a new citizen user, can switch to login |
| **/auth/login**    | Login page, can switch to register                |

- once logged in the user will be redirected to its own home page based on the type of the user

### admin

| Method & Path | Description / Business Logic                              |
| ------------- | --------------------------------------------------------- |
| **/admin**    | Contains dashboard for the admin with its functionalities |

### citizen

| Method & Path | Description / Business Logic                                |
| ------------- | ----------------------------------------------------------- |
| **/citizen**  | Contains home page for the citizen with its functionalities |

### municipality

| Method & Path     | Description / Business Logic                                                             |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **/municipality** | Contains dashboard for a municipality officer with its functionalities based on the role |
