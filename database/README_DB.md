# Database structure overview

- Return to the [main README](../README.md).

![Database Schema](db_schema.png)

## User & Role Management Database

---

### `users` Table

Stores information about all registered users, including citizens, municipality staff, and administrators.

| Column          | Type                                                                      | Description                                                 |
| --------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `id`            | INTEGER PK AUTOINCREMENT                                                  | Unique identifier for each user                             |
| `username`      | TEXT UNIQUE NOT NULL                                                      | User’s login name                                           |
| `password_hash` | TEXT NOT NULL                                                             | Hashed password of the user                                 |
| `first_name`    | TEXT NOT NULL                                                             | User’s first name                                           |
| `last_name`     | TEXT NOT NULL                                                             | User’s last name                                            |
| `email`         | TEXT NOT NULL                                                             | User’s email address                                        |
| `user_type`     | TEXT CHECK (`'citizen'`, `'municipality'`, `'admin'`) DEFAULT `'citizen'` | Defines the category of user (citizen, municipality, admin) |
| `created_at`    | DATETIME DEFAULT CURRENT_TIMESTAMP                                        | Timestamp indicating when the user was created              |

**Default users added:**

- `admin` (admin)
- Municipality users: `m.rossi`, `f.bianchi`, `l.verdi`, `f.banfi`, `r.rosso`, `m.bianchi`, `g.verdi`, `l.neri`, `s.gallo`, `p.fontana`, `e.ricci`
- Citizens: `johndoe`, `d.costa`, `m.moretti`, `l.russo`

All municipality users share the default password: `"SE2_group2_password!"`.

---

### `roles` Table

Stores available roles that can be assigned to users to define their permissions or access level.

| Column        | Type                     | Description                                    |
| ------------- | ------------------------ | ---------------------------------------------- |
| `id`          | INTEGER PK AUTOINCREMENT | Unique identifier for each role                |
| `type`        | TEXT                     | Type of role assigned                          |
| `label`       | TEXT UNIQUE NOT NULL     | Unique label or name of the role               |
| `description` | TEXT                     | Optional description explaining the role’s use |

**Default roles added:**

- **Public Relations Officers:**

  - Municipal Public Relations Officer
  - Municipal Administrator

- **Technical Officers:**

  - Infrastructure Technician
  - Green Areas Technician
  - Environment Quality Technician
  - Municipal Buildings Maintenance Technician

- **External Maintainers:**
  - Roads Maintainer
  - Parks Maintainer
  - Water/sewer Maintainer
  - Internal Spaces Maintainer

---

### `user_roles` Table

Represents the many-to-many relationship between users and roles. Each record assigns one role to one user.

| Column        | Type                               | Description                                  |
| ------------- | ---------------------------------- | -------------------------------------------- |
| `user_id`     | INTEGER FK → `users(id)`           | Identifier of the user being assigned a role |
| `role_id`     | INTEGER FK → `roles(id)`           | Identifier of the role assigned to the user  |
| `assigned_at` | DATETIME DEFAULT CURRENT_TIMESTAMP | Timestamp when the role was assigned         |

**Primary Key:** (`user_id`, `role_id`)  
**Foreign Keys:**

- `user_id` → `users(id)` ON DELETE CASCADE
- `role_id` → `roles(id)` ON DELETE CASCADE

**Default assignments for municipality users:**

| Username  | Roles                                                                 |
| --------- | --------------------------------------------------------------------- |
| m.rossi   | Municipal Public Relations Officer                                    |
| f.bianchi | Infrastructure Technician                                             |
| l.verdi   | Green Areas Technician, Environment Quality Technician                |
| f.banfi   | Municipal Buildings Maintenance Technician                            |
| e.ricci   | Infrastructure Technician, Municipal Buildings Maintenance Technician |
| m.bianchi | Roads Maintainer, Parks Maintainer                                    |
| l.neri    | Parks Maintainer                                                      |
| s.gallo   | Water/sewer Maintainer, Roads Maintainer                              |
| p.fontana | Internal Spaces Maintainer                                            |

---

## Report Management

---

### `report_categories` Table

Defines the categories available for reports (e.g., pothole, noise disturbance, lighting issues).

| Column        | Type                     | Description                                           |
| ------------- | ------------------------ | ----------------------------------------------------- |
| `id`          | INTEGER PK AUTOINCREMENT | Unique identifier for the category                    |
| `name`        | TEXT NOT NULL            | Human-readable category name                          |
| `icon`        | TEXT NOT NULL            | Icon name or path associated with this category       |
| `description` | TEXT                     | Optional description of what this category represents |

**Default categories added:**

- Drinking Water 💧
- Architectural Barriers ♿
- Sewer System 🚰
- Public Lighting 🔦
- Waste ♻️
- Road Signs & Traffic 🚦
- Roads & Furnishings 🏙️
- Green Areas & Playgrounds 🌳

---

### `role_category_responsibility` Table

Links roles to the report categories they are responsible for.

| Column        | Type                                 | Description                          |
| ------------- | ------------------------------------ | ------------------------------------ |
| `role_id`     | INTEGER FK → `roles(id)`             | Role responsible for the category    |
| `category_id` | INTEGER FK → `report_categories(id)` | Category the role is responsible for |

**Default responsibilities assigned:**

- Infrastructure Technician → Drinking Water, Sewer System, Public Lighting, Road Signs & Traffic, Roads & Furnishings
- Green Areas Technician → Green Areas & Playgrounds
- Environment Quality Technician → Waste
- Municipal Buildings Maintenance Technician → Architectural Barriers

---

### `reports` Table

Stores user-submitted reports about issues within the municipality.

| Column             | Type                                   | Description                                                                            |
| ------------------ | -------------------------------------- | -------------------------------------------------------------------------------------- |
| `id`               | INTEGER PK AUTOINCREMENT               | Unique report identifier                                                               |
| `category_id`      | INTEGER FK → `report_categories(id)`   | Category of the reported issue                                                         |
| `reporter_id`      | INTEGER FK → `users(id)`               | User who created the report                                                            |
| `assigned_from_id` | INTEGER FK → `users(id)`               | User who assigned the report (must have Public Relations Officer role)                 |
| `maintainer_id`    | INTEGER FK → `users(id)`               | External maintainer assigned to handle the report (must have External Maintainer role) |
| `updated_by`       | INTEGER FK → `users(id)`               | Last user who updated the report                                                       |
| `title`            | TEXT NOT NULL                          | Title of the report                                                                    |
| `description`      | TEXT                                   | Detailed description of the issue                                                      |
| `is_public`        | INTEGER CHECK (`0` or `1`) DEFAULT `0` | Whether the report is visible publicly                                                 |
| `latitude`         | REAL NOT NULL                          | Latitude where the issue was observed                                                  |
| `longitude`        | REAL NOT NULL                          | Longitude where the issue was observed                                                 |
| `status`           | TEXT NOT NULL                          | Current status (e.g., open, in_progress, resolved)                                     |
| `status_reason`    | TEXT                                   | Optional explanation for the current status                                            |
| `createdAt`        | TEXT NOT NULL                          | Timestamp of report creation                                                           |
| `updatedAt`        | TEXT NOT NULL                          | Timestamp of the last update                                                           |

---

### `report_photos` Table

Stores photos attached to reports.

| Column      | Type                       | Description                                                       |
| ----------- | -------------------------- | ----------------------------------------------------------------- |
| `id`        | INTEGER PK AUTOINCREMENT   | Unique identifier for the photo record                            |
| `report_id` | INTEGER FK → `reports(id)` | Associated report                                                 |
| `photo_id`  | TEXT NOT NULL              | ID used to retrieve the photo (e.g., filename, UUID, storage key) |
| `position`  | INTEGER NOT NULL           | Ordering of photos (1–3 as per PDF export rules)                  |

**Foreign Key Rule:**

- Deleting a report automatically deletes its photos (`ON DELETE CASCADE`)
