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

-- ===========================
-- REPORT 1 — bad_pavement
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to,
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(7, (SELECT id FROM users WHERE username='johndoe'), (SELECT id FROM users WHERE username='m.rossi'), NULL, NULL, (SELECT id FROM users WHERE username='e.ricci'),
 'Damaged Pavement', 'The sidewalk pavement is cracked and poses a danger to pedestrians.',
 1, 45.070500, 7.689800, 'Assigned', NULL, '2025-12-04', '2025-12-05');

INSERT INTO report_photos
(report_id, position, photo_path, photo_public_url)
VALUES
((SELECT MAX(id) FROM reports), 1,
 '3/1/3d76371bd93a.jpg',
 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/3/1/3d76371bd93a.jpg');

INSERT INTO report_comments (report_id, commenter_id, comment, createdAt, updatedAt)
VALUES ((SELECT MAX(id) FROM reports), 
    (SELECT id FROM users WHERE username='m.rossi'), 
    'Technical team, please evaluate if this requires an external contractor or can be fixed by the internal team.', 
    '2025-12-05 10:00:00', '2025-12-05 10:00:00');

INSERT INTO report_comments (report_id, commenter_id, comment, createdAt, updatedAt)
VALUES ((SELECT MAX(id) FROM reports), 
    (SELECT id FROM users WHERE username='e.ricci'),
    'Site visited. The damage is extensive. Requesting assignment to Roads Maintainer (m.bianchi).', 
    '2025-12-05 14:30:00', '2025-12-05 14:30:00');

-- ===========================
-- REPORT 2 — road_broken
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to,
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(7, (SELECT id FROM users WHERE username='d.costa'), NULL, NULL, NULL, NULL,
 'Road Surface Broken', 'A large section of asphalt is broken, creating a hazardous bump.',
 1, 45.068900, 7.688200, 'Pending Approval', NULL, '2025-12-03', '2025-12-05');

INSERT INTO report_photos
(report_id, position, photo_path, photo_public_url)
VALUES
((SELECT MAX(id) FROM reports), 1,
 '1/6/96a090b9c33f.jpg',
 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/1/6/96a090b9c33f.jpg');


-- ===========================
-- REPORT 3 — scooter_on_bush
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to,
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(8, (SELECT id FROM users WHERE username='m.moretti'), NULL, NULL, NULL, NULL,
 'Scooter Abandoned in Bushes', 'An electric scooter has been thrown into the bushes near the park.',
 1, 45.069300, 7.690500, 'Pending Approval', NULL, '2025-12-05', '2025-12-05');

INSERT INTO report_photos
(report_id, position, photo_path, photo_public_url)
VALUES
((SELECT MAX(id) FROM reports), 1,
 '1/6/f8028028444f.jpg',
 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/1/6/f8028028444f.jpg');


-- ===========================
-- REPORT 4 — traffic_lights_not_working
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to,
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(4, (SELECT id FROM users WHERE username='l.russo'), NULL, NULL, NULL, NULL,
 'Traffic Lights Not Working', 'The traffic signal at the intersection is malfunctioning.',
 1, 45.071000, 7.692000, 'Pending Approval', NULL, '2025-12-01', '2025-12-05');

INSERT INTO report_photos
(report_id, position, photo_path, photo_public_url)
VALUES
((SELECT MAX(id) FROM reports), 1,
 '4/7/60ab5f468a28.jpg',
 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/4/7/60ab5f468a28.jpg');


-- ===========================
-- REPORT 5 — waste_sidewalk
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to,
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(5, (SELECT id FROM users WHERE username='johndoe'), NULL, NULL, NULL, NULL,
 'Waste Left on Sidewalk', 'Garbage bags have been left unattended on the sidewalk.',
 1, 45.067800, 7.686900, 'Pending Approval', NULL, '2025-12-02', '2025-12-05');

INSERT INTO report_photos
(report_id, position, photo_path, photo_public_url)
VALUES
((SELECT MAX(id) FROM reports), 1,
 '4/7/220520f56738.jpg',
 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/4/7/220520f56738.jpg');


-- ===========================
-- REPORT 6 — fountain_not_working
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to, title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(1, (SELECT id FROM users WHERE username='johndoe'), NULL, NULL, NULL, NULL,
 'Fountain Not Working', 'The public drinking fountain (turet) near Piazza Castello is not dispensing water.',
 1, 45.070800, 7.686500, 'Pending Approval', NULL, '2025-12-06', '2025-12-06');

INSERT INTO report_photos
(report_id, position, photo_path, photo_public_url)
VALUES
((SELECT MAX(id) FROM reports), 1, '2/8/5ac7f8360ea7.jpg', 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/2/8/5ac7f8360ea7.jpg');


-- ===========================
-- REPORT 7 — sewer_system_overflowing
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to, title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(3, (SELECT id FROM users WHERE username='d.costa'), NULL, NULL, NULL, NULL,
 'Sewer System Overflowing', 'A manhole near Corso Vittorio Emanuele has overflowed, spilling wastewater onto the street.',
 1, 45.072100, 7.689900, 'Pending Approval', NULL, '2025-12-06', '2025-12-06');

INSERT INTO report_photos
(report_id, position, photo_path, photo_public_url)
VALUES
((SELECT MAX(id) FROM reports), 1, '4/9/994ef438a4e0.jpg', 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/4/9/994ef438a4e0.jpg');


INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to,
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(3, (SELECT id FROM users WHERE username='l.russo'), (SELECT id FROM users WHERE username='m.rossi'), NULL, NULL, (SELECT id FROM users WHERE username='f.bianchi'),
 'Flooded Underpass', 'Heavy rain has caused the drainage to fail in the via Roma underpass.',
 1, 45.062200, 7.678900, 'Assigned', NULL, '2025-12-26', '2025-12-27');

INSERT INTO report_photos (report_id, position, photo_path, photo_public_url)
VALUES ((SELECT MAX(id) FROM reports), 1, '8/1/flood.jpg', 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/8/1/flood.jpg');

INSERT INTO report_comments (report_id, commenter_id, comment, createdAt, updatedAt)
VALUES ((SELECT MAX(id) FROM reports), (SELECT id FROM users WHERE username='f.bianchi'), 
 'Emergency pumps deployed. Checking for structural blockages in the sewer main.', '2025-12-27 09:00:00', '2025-12-27 09:00:00');


-- ===========================
-- REPORT 8 — broken_swing (Green Areas)
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to, 
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(8, (SELECT id FROM users WHERE username='m.moretti'), (SELECT id FROM users WHERE username='m.rossi'), NULL, NULL, (SELECT id FROM users WHERE username='l.verdi'),
 'Broken Swing in Park', 'One of the swings in the kids play area is broken and dangerous.',
 1, 45.075500, 7.691200, 'Assigned', NULL, '2025-12-07', '2025-12-08');

INSERT INTO report_photos (report_id, position, photo_path, photo_public_url)
VALUES ((SELECT MAX(id) FROM reports), 1, '1/6/f8028028444f.jpg', 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/1/6/f8028028444f.jpg');

INSERT INTO report_comments (report_id, commenter_id, comment, createdAt, updatedAt)
VALUES ((SELECT MAX(id) FROM reports), (SELECT id FROM users WHERE username='l.verdi'), 
 'I have inspected the site. We need to order a replacement part from the supplier.', '2025-12-08 09:00:00', '2025-12-08 09:00:00');

-- ===========================
-- REPORT 9 — sidewalk_ramp_blocked (Architectural Barriers)
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to, 
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(2, (SELECT id FROM users WHERE username='l.russo'), (SELECT id FROM users WHERE username='m.rossi'), NULL, NULL, (SELECT id FROM users WHERE username='f.banfi'),
 'Blocked Sidewalk Ramp', 'A large concrete block has been left in front of the wheelchair ramp.',
 1, 45.066500, 7.685000, 'Assigned', NULL, '2025-12-09', '2025-12-09');

INSERT INTO report_photos (report_id, position, photo_path, photo_public_url)
VALUES ((SELECT MAX(id) FROM reports), 1, '3/1/3d76371bd93a.jpg', 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/3/1/3d76371bd93a.jpg');

-- ===========================
-- REPORT 10 — graffiti_monument (Roads & Furnishings)
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to, 
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(7, (SELECT id FROM users WHERE username='d.costa'), (SELECT id FROM users WHERE username='m.rossi'), (SELECT id FROM users WHERE username='p.fontana'), (SELECT id FROM users WHERE username='f.banfi'), (SELECT id FROM users WHERE username='f.banfi'),
 'Graffiti on Bench', 'The historic stone benches have been covered in graffiti.',
 1, 45.070000, 7.687000, 'Resolved', 'Cleaned by internal spaces maintenance team.', '2025-12-10', '2025-12-12');

INSERT INTO report_photos (report_id, position, photo_path, photo_public_url)
VALUES ((SELECT MAX(id) FROM reports), 1, '4/7/60ab5f468a28.jpg', 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/4/7/60ab5f468a28.jpg');

INSERT INTO report_comments (report_id, commenter_id, comment, createdAt, updatedAt)
VALUES ((SELECT MAX(id) FROM reports), (SELECT id FROM users WHERE username='p.fontana'), 
 'Cleaning completed using non-abrasive materials.', '2025-12-12 11:00:00', '2025-12-12 11:00:00');

-- ===========================
-- REPORT 11 — street_light_flickering (Public Lighting)
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to, 
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(4, (SELECT id FROM users WHERE username='johndoe'), (SELECT id FROM users WHERE username='m.rossi'), (SELECT id FROM users WHERE username='s.gallo'), NULL, (SELECT id FROM users WHERE username='f.bianchi'),
 'Flickering Street Light', 'The light at the corner of Via Roma is flickering constantly at night.',
 1, 45.069900, 7.684500, 'In Progress', NULL, '2025-12-11', '2025-12-13');

INSERT INTO report_photos (report_id, position, photo_path, photo_public_url)
VALUES ((SELECT MAX(id) FROM reports), 1, '4/7/60ab5f468a28.jpg', 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/4/7/60ab5f468a28.jpg');

INSERT INTO report_comments (report_id, commenter_id, comment, createdAt, updatedAt)
VALUES ((SELECT MAX(id) FROM reports), (SELECT id FROM users WHERE username='f.bianchi'), 
 'Assigned to external maintainer s.gallo for bulb replacement.', '2025-12-13 15:00:00', '2025-12-13 15:00:00');


 -- ===========================
-- REPORT 12 — resolved_clogged_drain (Sewer System)
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to, 
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(3, (SELECT id FROM users WHERE username='johndoe'), (SELECT id FROM users WHERE username='m.rossi'), (SELECT id FROM users WHERE username='s.gallo'), (SELECT id FROM users WHERE username='f.bianchi'), (SELECT id FROM users WHERE username='f.bianchi'),
 'Clogged Storm Drain', 'The drain at the corner is completely blocked by autumn leaves.',
 1, 45.073500, 7.690100, 'Resolved', 'Drain cleared and inspected for structural damage.', '2025-11-15', '2025-11-18');

INSERT INTO report_photos (report_id, position, photo_path, photo_public_url)
VALUES ((SELECT MAX(id) FROM reports), 1, '4/9/994ef438a4e0.jpg', 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/4/9/994ef438a4e0.jpg');

INSERT INTO report_comments (report_id, commenter_id, comment, createdAt, updatedAt)
VALUES ((SELECT MAX(id) FROM reports), (SELECT id FROM users WHERE username='s.gallo'), 
 'Maintenance completed. Debris removed and flow restored.', '2025-11-18 10:30:00', '2025-11-18 10:30:00');

-- ===========================
-- REPORT 13 — resolved_illegal_flyer (Waste)
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to, 
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(5, (SELECT id FROM users WHERE username='d.costa'), (SELECT id FROM users WHERE username='m.rossi'), NULL, (SELECT id FROM users WHERE username='l.verdi'), (SELECT id FROM users WHERE username='l.verdi'),
 'Illegal Posters on Bridge', 'The bridge railings are covered in illegal advertising flyers.',
 1, 45.065000, 7.695000, 'Resolved', 'Posters removed by the environmental cleaning team.', '2025-11-20', '2025-11-22');

INSERT INTO report_photos (report_id, position, photo_path, photo_public_url)
VALUES ((SELECT MAX(id) FROM reports), 1, '4/7/220520f56738.jpg', 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/4/7/220520f56738.jpg');

-- ===========================
-- REPORT 14 — resolved_bench_repair (Green Areas)
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to, 
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(8, (SELECT id FROM users WHERE username='m.moretti'), (SELECT id FROM users WHERE username='m.rossi'), (SELECT id FROM users WHERE username='l.neri'), (SELECT id FROM users WHERE username='l.verdi'), (SELECT id FROM users WHERE username='l.verdi'),
 'Broken Bench Slats', 'Three wood slats are missing from a park bench.',
 1, 45.071200, 7.693300, 'Resolved', 'Slats replaced with treated cedar wood.', '2025-11-25', '2025-11-28');

INSERT INTO report_photos (report_id, position, photo_path, photo_public_url)
VALUES ((SELECT MAX(id) FROM reports), 1, '1/6/f8028028444f.jpg', 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/1/6/f8028028444f.jpg');

INSERT INTO report_comments (report_id, commenter_id, comment, createdAt, updatedAt)
VALUES ((SELECT MAX(id) FROM reports), (SELECT id FROM users WHERE username='l.verdi'), 
 'Maintainer L. Neri confirmed the fix and applied weather sealant.', '2025-11-28 16:00:00', '2025-11-28 16:00:00');

-- ===========================
-- REPORT 15 — resolved_water_leak (Drinking Water)
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to, 
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(1, (SELECT id FROM users WHERE username='johndoe'), (SELECT id FROM users WHERE username='m.rossi'), (SELECT id FROM users WHERE username='s.gallo'), (SELECT id FROM users WHERE username='e.ricci'), (SELECT id FROM users WHERE username='e.ricci'),
 'Leaking Turet', 'The green fountain is leaking from the base.',
 1, 45.070000, 7.686000, 'Resolved', 'Gasket replaced and base resealed.', '2025-12-01', '2025-12-02');

INSERT INTO report_photos (report_id, position, photo_path, photo_public_url)
VALUES ((SELECT MAX(id) FROM reports), 1, '2/8/5ac7f8360ea7.jpg', 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/2/8/5ac7f8360ea7.jpg');


-- ===========================
-- REPORT 16 — pothole_via_roma (Roads Maintainer)
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to, 
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(7, 
 (SELECT id FROM users WHERE username='johndoe'), 
 (SELECT id FROM users WHERE username='m.rossi'), 
 (SELECT id FROM users WHERE username='m.bianchi'), -- External Maintainer
 (SELECT id FROM users WHERE username='f.bianchi'), 
 (SELECT id FROM users WHERE username='f.bianchi'), -- Internal Tech Officer
 'Deep Pothole', 'A dangerous pothole has opened up in the middle of the cycling lane.',
 1, 45.068000, 7.683000, 'Assigned', NULL, '2025-12-26', '2025-12-27');

INSERT INTO report_photos (report_id, position, photo_path, photo_public_url)
VALUES ((SELECT MAX(id) FROM reports), 1, '1/6/96a090b9c33f.jpg', 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/1/6/96a090b9c33f.jpg');

INSERT INTO report_comments (report_id, commenter_id, comment, createdAt, updatedAt)
VALUES ((SELECT MAX(id) FROM reports), (SELECT id FROM users WHERE username='f.bianchi'), 
 'Assigned to Bianchi for urgent asphalt repair.', '2025-12-27 09:00:00', '2025-12-27 09:00:00');


-- ===========================
-- REPORT 17 — fallen_branch (Parks Maintainer)
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to, 
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(8, 
 (SELECT id FROM users WHERE username='l.russo'), 
 (SELECT id FROM users WHERE username='m.rossi'), 
 (SELECT id FROM users WHERE username='m.bianchi'),
 (SELECT id FROM users WHERE username='l.verdi'), 
 (SELECT id FROM users WHERE username='l.verdi'),
 'Large Fallen Branch', 'A large tree branch is blocking the pedestrian path in the park.',
 1, 45.074000, 7.694000, 'In Progress', NULL, '2025-12-28', '2025-12-28');

INSERT INTO report_photos (report_id, position, photo_path, photo_public_url)
VALUES ((SELECT MAX(id) FROM reports), 1, '1/6/f8028028444f.jpg', 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/1/6/f8028028444f.jpg');

INSERT INTO report_comments (report_id, commenter_id, comment, createdAt, updatedAt)
VALUES ((SELECT MAX(id) FROM reports), (SELECT id FROM users WHERE username='l.verdi'), 
 'Bianchi, please clear the path and check the stability of the remaining tree.', '2025-12-28 14:00:00', '2025-12-28 14:00:00');


-- ===========================
-- REPORT 18 — sidewalk_subsidence (Roads Maintainer)
-- ===========================
INSERT INTO reports
(category_id, reporter_id, assigned_from_id, maintainer_id, updated_by, assigned_to, 
 title, description, is_public, latitude, longitude, status, status_reason, createdAt, updatedAt)
VALUES
(7, 
 (SELECT id FROM users WHERE username='d.costa'), 
 (SELECT id FROM users WHERE username='m.rossi'), 
 (SELECT id FROM users WHERE username='m.bianchi'),
 (SELECT id FROM users WHERE username='e.ricci'), 
 (SELECT id FROM users WHERE username='e.ricci'),
 'Sidewalk Sinking', 'The sidewalk tiles are sinking near the bus stop.',
 1, 45.065500, 7.689000, 'In Progress', NULL, '2025-12-25', '2025-12-27');

INSERT INTO report_photos (report_id, position, photo_path, photo_public_url)
VALUES ((SELECT MAX(id) FROM reports), 1, '3/1/3d76371bd93a.jpg', 'https://rksihjpitwbqsydhlyeb.supabase.co/storage/v1/object/public/reports/3/1/3d76371bd93a.jpg');