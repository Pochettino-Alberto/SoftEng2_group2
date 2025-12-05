--------- TABLES DEFAULT VALUE ------------

-- query to get insert of users with hex password_hash and salt
-- SELECT printf("('%s', X'%s', X'%s', '%s', '%s', '%s', '%s')", username,HEX(password_hash), HEX(salt), first_name, last_name, email, user_type) AS insert_tuple FROM users;

-- Default users, (common password is "SE2_group2_password!")
INSERT INTO users (username, password_hash, salt, first_name, last_name, email, user_type) VALUES
--ADMINS
('admin', X'FDE90EAD58727133C212385D27093BC9', X'D15E315B6F63B5A2B9D3AC873FA5A1B4', 'admin', 'admin', 'admin.admin@example.com', 'admin'),
--MUNICIPALITY
('m.rossi', X'2BBF514E7D3677C234D4AF243A4415BD', X'471D6B22D49461DF40234504B6E8F563', 'Mario', 'Rossi', 'mario.rossi@example.com', 'municipality'),
('f.bianchi', X'7A9B1764B3C3222FDFF9828212508332', X'DD2CCB390A1303485F2E473BA7FF880C', 'Franco', 'Bianchi', 'franco.bianchi@example.com', 'municipality'),
('l.verdi', X'E1C1F1D21701A96FB5D2F2E691E3A49B', X'28986C3B01FC9D484260B336D3015AA6', 'Luigi', 'Verdi', 'luigi.verdi@example.com', 'municipality'),
('f.banfi', X'F1242688478E4FE6C49C48C51F82FDA2', X'C206913F19FCF40A4660880079D4DCA9', 'Francesco', 'Banfi', 'francesco.banfi@example.com', 'municipality'),
('r.rosso', X'8681E1D8CD906C9FEE4FBD16FCB12DE4', X'43A9E978A4E952F69B21ED3916F6D891', 'Rossana', 'Rosso', 'rossana.rosso@example.com', 'municipality'),
('m.bianchi', X'524FB2C4D65C44DB7DEF1B40515B24AF', X'8090F4586C21302BB27988715095CD53', 'Marco', 'Bianchi', 'marco.bianchi@example.com', 'municipality'),
('g.verdi', X'D0C3013E7EECB25B0584DE8C9B2FFA4B', X'0461167BEB0D604E43BCC21AC5D4BD9E', 'Giulia', 'Verdi', 'giulia.verdi@example.com', 'municipality'),
('l.neri', X'DF6DC73C8DB192D136D25C194848C20B', X'944273738F973C2D7DF34856FB1BA623', 'Luca', 'Neri', 'luca.neri@example.com', 'municipality'),
('s.gallo', X'2ECF7D16183996D90B65FB9EE8B2AD7E', X'82985F18E57E7EDBAF9B027E0A8BA148', 'Sara', 'Gallo', 'sara.gallo@example.com', 'municipality'),
('p.fontana', X'14ACB31915565B4D38DF3E74A8D9F2FF', X'B29FB865DDFAE6279A1B8E38EDCDE431', 'Paolo', 'Fontana', 'paolo.fontana@example.com', 'municipality'),
('e.ricci', X'0BCD4CBBEC17905A68F40DE9F3E0628D', X'20533A5DD3523188DBA57E1112AA8D36', 'Elena', 'Ricci', 'elena.ricci@example.com', 'municipality'),
--CITIZENS
('johndoe', X'47D8EB1C7A403E13F38465689524D094', X'AE119533CA0F9341197264F1FE690331', 'John', 'Doe', 'john.doe@example.com', 'citizen'),
('d.costa', X'200F4B26469602E3775859DFF71E90E5', X'FB2ED4E531B0FC333286973D503AEBEC', 'Davide', 'Costa', 'davide.costa@example.com', 'citizen'),
('m.moretti', X'8C35D93589164E2D839011BA62760098', X'D1E103AB276CE20EC9AAA56AFA642DE4', 'Martina', 'Moretti', 'martina.moretti@example.com', 'citizen'),
('l.russo', X'219B819552E966C94A0C51AABC4A7A2B', X'F93AD001CB7CCD273B767060DCC51D35', 'Ludovico', 'Russo', 'ludovico.russo@example.com', 'citizen');


-- Load official roles based on the municipality structure
INSERT INTO roles (role_type, label, description) VALUES
('publicRelations_officer', 'Municipal Public Relations Officer', 'Handles citizen communications and report approvals.'),
('publicRelations_officer', 'Municipal Administrator', 'Oversees system management and user permissions.'),

('technical_officer', 'Infrastructure Technician', 'Addresses reports related to public infrastructure, including roads, sidewalks, street lighting, traffic signals, and water/sewer networks.'),
('technical_officer', 'Green Areas Technician', 'Manages and resolves reports concerning maintenance, damage, and upkeep of public parks, gardens, trees, and other municipal green spaces.'),
('technical_officer', 'Environment Quality Technician', 'Investigates and resolves environmental compliance reports, such as illegal dumping, air/noise pollution, and public health violations.'),
('technical_officer', 'Municipal Buildings Maintenance Technician', 'Coordinates corrective and preventative maintenance for city-owned facilities, public buildings, and urban furnishings.'),

('external_maintainer', 'Roads Maintainer', 'Responsible for carrying out maintenance and repairs on public roads, streets, and sidewalks as directed by the municipality.'),
('external_maintainer', 'Parks Maintainer', 'Performs upkeep, cleaning, and minor repairs in public parks, gardens, and green spaces.'),
('external_maintainer', 'Water/sewer Maintainer', 'Handles maintenance, inspections, and repairs of water supply and sewage systems in the municipality.'),
('external_maintainer', 'Internal Spaces Maintainer', 'Maintains and services internal public spaces, municipal offices, and community buildings under the guidance of the municipality.');

-- Load default report categories
INSERT INTO report_categories (name, icon, description) VALUES
('Drinking Water', '💧', 'Issues related to public drinking water points, fountains, and water supply.'),
('Architectural Barriers', '♿', 'Obstacles that prevent accessibility for people with disabilities or mobility limitations.'),
('Sewer System', '🚰', 'Problems concerning drainage, sewage, and wastewater systems.'),
('Public Lighting', '🔦', 'Reports about malfunctioning street lights or lighting infrastructure.'),
('Waste', '♻️', 'Issues related to waste collection, recycling, or illegal dumping.'),
('Road Signs & Traffic', '🚦', 'Problems involving traffic signs, signals, or traffic flow.'),
('Roads & Furnishings', '🏙️', 'Damages or issues related to roads, sidewalks, and urban furnishings.'),
('Green Areas & Playgrounds', '🌳', 'Maintenance of green spaces, parks, playgrounds, and public gardens.');

-- Assign report responsability to municipal roles 
INSERT INTO role_category_responsibility (role_id, category_id)
SELECT R.id, C.id FROM roles R, report_categories C WHERE R.label = 'Infrastructure Technician' AND C.name IN ('Drinking Water', 'Sewer System', 'Public Lighting', 'Road Signs & Traffic', 'Roads & Furnishings');

INSERT INTO role_category_responsibility (role_id, category_id)
SELECT R.id, C.id FROM roles R, report_categories C WHERE R.label = 'Green Areas Technician' AND C.name = 'Green Areas & Playgrounds';

INSERT INTO role_category_responsibility (role_id, category_id)
SELECT R.id, C.id FROM roles R, report_categories C WHERE R.label = 'Environment Quality Technician' AND C.name = 'Waste';

INSERT INTO role_category_responsibility (role_id, category_id)
SELECT R.id, C.id FROM roles R, report_categories C WHERE R.label = 'Municipal Buildings Maintenance Technician' AND C.name = 'Architectural Barriers';


-- Assign roles to the municipality users
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.label IN (
    'Municipal Public Relations Officer'
)
WHERE u.username = 'm.rossi';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.label IN (
    'Infrastructure Technician',
    'Municipal Buildings Maintenance Technician'
)
WHERE u.username = 'f.bianchi';


INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.label IN (
    'Green Areas Technician',
    'Environment Quality Technician'
)
WHERE u.username = 'l.verdi';


INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.label IN (
    'Municipal Buildings Maintenance Technician'
)
WHERE u.username = 'f.banfi';


INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.label IN (
    'Infrastructure Technician',
    'Municipal Buildings Maintenance Technician'
)
WHERE u.username = 'e.ricci';


INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.label IN (
    'Roads Maintainer',
    'Parks Maintainer'
)
WHERE u.username = 'm.bianchi';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.label IN (
    'Parks Maintainer'
)
WHERE u.username = 'l.neri';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.label IN (
    'Water/sewer Maintainer',
    'Roads Maintainer'
)
WHERE u.username = 's.gallo';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.label IN (
    'Internal Spaces Maintainer'
)
WHERE u.username = 'p.fontana';


-- Load reports 
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to, title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(1, (SELECT id FROM users where username='johndoe'), NULL, NULL, NULL, NULL, 'Drinking Fountain Broken', 'The public drinking fountain near Central Park is not working.', 1, 45.070123, 7.689456, 'Pending Approval', NULL, '2025-12-04', '2025-12-05'),
(2, (SELECT id FROM users where username='johndoe'), NULL, NULL, NULL, NULL, 'Ramp Blocked', 'The ramp at Main Library entrance is blocked by construction materials.', 1, 45.066789, 7.685432, 'Pending Approval', NULL, '2025-12-03', '2025-12-05'),
(4, (SELECT id FROM users where username='d.costa'), NULL, NULL, NULL, NULL, 'Street Light Out', 'Several street lights along Elm Street are not functioning.', 1, 45.068234, 7.687890, 'Pending Approval', NULL, '2025-12-02', '2025-12-05'),
(5, (SELECT id FROM users where username='m.moretti'), NULL, NULL, NULL, NULL, 'Illegal Dumping', 'Someone dumped trash in the park near the river.', 1, 45.069876, 7.690123, 'Pending Approval', NULL, '2025-12-05', '2025-12-05'),
(8, (SELECT id FROM users where username='l.russo'), NULL, NULL, NULL, NULL, 'Playground Broken', 'Swing set is damaged in Riverside Park.', 1, 45.071234, 7.692345, 'Pending Approval', NULL, '2025-12-01', '2025-12-05');


INSERT INTO report_photos
(report_id, "position", photo_path, photo_public_url)
VALUES(1, 1, '3/1/3d76371bd93a.jpg', 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/3/1/3d76371bd93a.jpg');