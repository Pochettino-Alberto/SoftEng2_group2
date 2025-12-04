--------- TABLES CREATION ------------

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS report_photos;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS report_categories;
DROP TABLE IF EXISTS role_category_responsibility;

-- ===============================
-- USERS (citizens + municipality users)
-- ===============================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash BLOB NOT NULL,
    salt BLOB NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    user_type TEXT CHECK (user_type IN ('citizen', 'municipality', 'admin')) DEFAULT 'citizen',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- ROLES
-- ===============================
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT UNIQUE NOT NULL,
    description TEXT,
    role_type TEXT CHECK (role_type IN ('publicRelations_officer','technical_officer', 'external_maintainer')) DEFAULT 'technical_officer'
);

-- ===============================
-- USER-ROLE ASSIGNMENTS
-- ===============================
CREATE TABLE user_roles (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);


-- ===============================
-- ROLE-CATEGORY RESPONSIBILITY
-- Links TOS roles to the categories they are responsible for.
-- ===============================
CREATE TABLE role_category_responsibility (
    role_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (role_id, category_id),
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES report_categories (id) ON DELETE CASCADE
);


-- ===============================
-- REPORT_CATEGORIES
-- ===============================
CREATE TABLE report_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT,
    active INTEGER NOT NULL CHECK (active IN (0,1)) DEFAULT 1
);


-- ===============================
-- REPORTS
-- ===============================
CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    reporter_id INTEGER,
    -- The user who assigned the report (Must have Public Relations Officer role)
    assigned_from_id INTEGER,
    -- The external maintainer assigned to the report (Must have External Maintainer role)
    maintainer_id INTEGER,
    updated_by INTEGER,
    -- The user currently assigned to handle the report (Must have Technical Officer role)
    assigned_to INTEGER,

    title TEXT NOT NULL,
    description TEXT,
    is_public INTEGER NOT NULL CHECK (is_public IN (0,1)) DEFAULT 0,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    status TEXT NOT NULL,
    status_reason TEXT,

    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES report_categories(id),
    FOREIGN KEY (reporter_id) REFERENCES users (id),
    FOREIGN KEY (assigned_from_id) REFERENCES users (id),
    FOREIGN KEY (maintainer_id) REFERENCES users (id),
    FOREIGN KEY (updated_by) REFERENCES users (id),
    FOREIGN KEY (assigned_to) REFERENCES users (id)
);

-- ===============================
-- REPORT_PHOTOS
-- ===============================

CREATE TABLE report_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    position INTEGER NOT NULL, -- 1,2,3 (maximum 3 photos per PDF spec)
    photo_path TEXT NOT NULL, -- relative path inside the supabase bucket
    photo_public_url TEXT NOT NULL, -- public URL of the photo
    FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE
);
