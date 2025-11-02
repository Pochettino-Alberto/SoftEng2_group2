--------- TABLES DEFAULT VALUE ------------


-- Preload official roles based on the municipality structure
INSERT INTO roles (label, description) VALUES
('Municipal Public Relations Officer', 'Handles citizen communications and report approvals.'),
('Municipal Administrator', 'Oversees system management and user permissions.'),
('Technical Office Staff Member', 'Resolves issues assigned by category.');
