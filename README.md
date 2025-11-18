# Software Engineering || - group-2

team members:

- s323141 Pochettino Alberto
- s334072 Torrengo Andrea
- s338520 Benevento Mattia
- s338714 Uslu Sebnem
- s339153 Hemmati Fateme

code documentation:

- docs folder
- [database - README_DB](./database/README_DB.md)
- [back-end - README_BE](./back-end/README_BE.md)
- [front-end - README_FE](./front-end/README_FE.md)

## Notes and quick developers tips

### Reset database data

<code> node ../database/resetDatabase.ts </code>

### Default sample users credentials

| Username | Password          | User Type |
| -------- | ----------------- | --------- |
| johndoe  | securePassword123 | citizen   |
| admin    | securePassword123 | admin     |

## Participium — Schematic summary

---

### 1. System goal

- Web application for citizen participation in the management of urban environments.
- Let citizens report local inconveniences/malfunctions to Public Administration (PA).
- Example: Iris platform (Venice).

### 2. Actors / roles

- **Citizen (registered user)**
- **Municipality Organization Office** (preliminary verification / acceptance/rejection)
- **Competent technical offices** (assigned, perform interventions)
- **Municipal operators / technical staff** (work on reports, send messages, update status)
- **Administrators** (view private statistics, manage system)

### 3. Registration / User profile

- Required fields to register: `username`, `first name`, `last name`.
- In user configuration panel: can upload personal photo, set Telegram username, enable/disable email notifications.

### 4. Creating a report

- Mandatory steps/fields:

  - Select a point on the Turin map (OpenStreetMap standard layer).
  - **Title** (required)
  - **Textual description** (required)
  - **Category** (required — choose from predefined list)
  - Attach one or more **photos** (mandatory; up to **3** per report)

- Final option: mark the report **anonymous** (reporter name hidden in public list)

### 5. Problem categories (predefined)

1. Water Supply – Drinking Water
2. Architectural Barriers
3. Sewer System
4. Public Lighting
5. Waste
6. Road Signs and Traffic Lights
7. Roads and Urban Furnishings
8. Public Green Areas and Playgrounds
9. Other

### 6. Report lifecycle / statuses

- **Pending Approval** — initial state after submission; Municipality Organization Office checks and either accepts or rejects.
- **Assigned** — after approval, report routed to competent technical office.
- **In Progress** — intervention scheduled and work started.
- **Suspended** — paused for organizational/technical reasons.
- **Rejected** — not accepted by Organization Office (mandatory explanation required).
- **Resolved** — technical office marks as resolved and closes the report.

**Notes on workflow:**

- Technical office staff can add comments to a report.
- If rejected, Organization Office must provide an explanatory reason.

### 7. Notifications & citizen updates

- At each status change the citizen receives an **in-platform notification**.
- Each platform notification optionally triggers an **email** (unless disabled in user settings).
- Municipal operators can send messages to citizens within the platform; citizens can reply.

### 8. Public presentation & data export

- After approval, accepted reports become public and visible in two ways:

  - **Interactive map** of Turin, geolocated at the reported point.
  - **Summary table** (list) with filtering and sorting by: category, status, period.

- Table data (filtered) can be **downloaded as CSV**.
- In both views, reporter name is shown (or `anonymous`) and the report title; clicking title opens full description with pictures.

### 9. Statistics

- **Public statistics** (visible on site and to unregistered users):

  - Number of reports by category
  - Trends by day/week/month

- **Private statistics** (administrators only) — additionally include:

  - Number of reports by status
  - Number of reports by type (category)
  - Number of reports by type and status
  - Number of reports by reporter
  - Number of reports by reporter and type
  - Number of reports by reporter, type and status
  - Number of reports by the top 1% of reporters, by type
  - Number of reports by the top 5% of reporters, by type

### 10. Telegram Bot Integration

- Citizens who provide a Telegram username can use a Telegram bot to:

  - **Create a new report** via a guided process.
  - **Check status** of their own reports (receive updated list with changes).
  - **Receive real-time push notifications** when report status changes.
  - Get quick assistance: commands for system usage info and useful contacts.

### 11. Misc / Implementation notes

- Map: OpenStreetMap (standard layer) used for geolocation selection.
- Photos: mandatory attachments, max 3 per report.
- Privacy: anonymous option hides reporter name in public listings.
- Traceability: status changes, admin comments, and mandatory rejection explanations enhance transparency and trust.

## Docker

Short instructions to build and run the project with Docker Compose.

- Build and start the services (front-end served on `http://localhost:5173`, back-end on `http://localhost:3001`):

```powershell
docker-compose up --build -d
```

- Stop and remove containers:

```powershell
docker-compose down
```

- Notes:
  - The SQLite database file is persisted by mounting the repository `./database` folder into the back-end container.
  - The front-end build receives `VITE_API_BASE_URL` at build time and is set in `docker-compose.yml` to point to the `back-end` service.
  - If you need to run the back-end locally in dev mode, use the `back-end` scripts (`npm run dev`) and the front-end (`npm run dev`).
