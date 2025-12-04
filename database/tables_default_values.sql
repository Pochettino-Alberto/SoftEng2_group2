--------- TABLES DEFAULT VALUE ------------

-- query to get hex pass and salt
-- SELECT username, HEX(password_hash) AS password_hash_hex, HEX(salt) AS salt_hex FROM users;

-- Preload users demo (common password is "YOOO_demo_!")
INSERT INTO users (username, password_hash, salt, first_name, last_name, email, user_type) VALUES
('demo_citizen', X'CD05B6EDC7987452B2FCF8EB1BA8D1E7', X'79B2563A82D62246A8CA03A446D99C0D', 'demo_citizen', 'demo_citizen', 'demo_citizen@email.com', 'citizen'),
('demo_Municipal_Public_Relations_Officer', X'7964CD02657C2AA9F86A430C232588FD', X'7CEC5CA3B53F68CB773DB3B04A5E0893', 'demo_Municipal_Public_Relations_Officer', 'demo_Municipal_Public_Relations_Officer', 'demo_Municipal_Public_Relations_Officer@email.com', 'municipality'),
('demo_Municipal_Administrator', X'E687DD698738A9AC48BE9B302E38B333', X'9209978A831E2979A53F451FC308F18D', 'demo_Municipal_Administrator', 'demo_Municipal_Administrator', 'demo_Municipal_Administrator@email.com', 'municipality'),
('demo_Municipal_Infrastructure_Technician', X'35120D53B9694096C1CC4D517CB14E72', X'529AD17EAF5D334B962196C6D1430E7B', 'demo_Municipal_Infrastructure_Technician', 'demo_Municipal_Infrastructure_Technician', 'demo_Municipal_Infrastructure_Technician@email.com', 'municipality'),
('demo_Municipal_Green_Areas_Technician', X'0E260C036344A5B9DCD882908790BAE5', X'1D0AB9C26CF4C33B03C5E173642BE4B3', 'demo_Municipal_Green_Areas_Technician', 'demo_Municipal_Green_Areas_Technician', 'demo_Municipal_Green_Areas_Technician@email.com', 'municipality'),
('demo_Municipal_Environment_Quality_Technician', X'55466A2730F19447AF53797063E94A55', X'130B08512A3844E886070075BFC25D57', 'demo_Municipal_Environment_Quality_Technician', 'demo_Municipal_Environment_Quality_Technician', 'demo_Municipal_Environment_Quality_Technician@email.com', 'municipality'),
('demo_Municipal_Buildings_Maintenance_Technician', X'8B951DB72C0C25E56EAFC2318D632F05', X'B76864E55578FAFF411E47CA9F18F832', 'demo_Municipal_Buildings_Maintenance_Technician', 'demo_Municipal_Buildings_Maintenance_Technician', 'demo_Municipal_Buildings_Maintenance_Technician@email.com', 'municipality'),
('demo_Municipal_Roads_Maintainer', X'874463E4DFA0794F31ED3E8F9565EA4F', X'DF5386D0C8F2A67FD035121C9C48221E', 'demo_Municipal_Roads_Maintainer', 'demo_Municipal_Roads_Maintainer', 'demo_Municipal_Roads_Maintainer@email.com', 'municipality'),
('demo_Municipal_Parks_Maintainer', X'72CE9E56ADC77C017D80CC062236278F', X'7405AEFBDE188B45330ED3B02C71CD1A', 'demo_Municipal_Parks_Maintainer', 'demo_Municipal_Parks_Maintainer', 'demo_Municipal_Parks_Maintainer@email.com', 'municipality'),
('demo_Municipal_Water-sewer_Maintainer', X'92042E26CEFCF2F3A011B8DCB6FF8374', X'CE006AA045E421E559032DAF7D3421D4', 'demo_Municipal_Water-sewer_Maintainer', 'demo_Municipal_Water-sewer_Maintainer', 'demo_Municipal_Water-sewer_Maintainer@email.com', 'municipality'),
('demo_Municipal_Internal_Spaces_Maintainer', X'121BA5E3FE0EC4C854CF6C3620EF247E', X'2BD06A9DA373CF3CD7062874EFE16A39', 'demo_Municipal_Internal_Spaces_Maintainer', 'demo_Municipal_Internal_Spaces_Maintainer', 'demo_Municipal_Internal_Spaces_Maintainer@email.com', 'municipality');

-- Additional users mario.rossi, franco, luigi and francesco have password "password"
INSERT INTO users (username, password_hash, salt, first_name, last_name, email, user_type) VALUES
('admin', X'80B4DC9201E01C955303467C88656756', X'27CE6E026F80F09999A6E573EC723E7F', 'admin', 'admin', 'admin.admin@email.com', 'admin'),
('johndoe', X'DC3339912A9BE643D12156772C853619', X'69A67927073D4FC1B3FACDFB2637CE45', 'John', 'Doe', 'John.Doe@email.com', 'citizen'),
('mario.rossi', X'3FE3DBE7D09FA0BC5ED806DD2BD99E80', X'4BEEDD8F75D7DCC14405056669EC8AAE', 'Mario', 'Rossi', 'mario.rossi@example.com', 'municipality'),
('franco', X'3B08F0E2AEF927CB9E5DFE1D9DA6DD0C', X'395957E7DE1342138365EEA06FB56A6B', 'Franco', 'Bianchi', 'franco@example.com', 'municipality'),
('luigi', X'6845DDC9E7559B47150BBE45224F369A', X'25F6DBEEE80373AA5DD238BA711256E1', 'Luigi', 'Verdi', 'luigi@example.com', 'municipality'),
('francesco', X'AF4E1B6AF36A16477325E81925D18F69', X'BBB71A4C10345FC6F74D2E8512BE053B', 'Francesco', 'Banfi', 'francesco.banfi@example.com', 'municipality');

-- Preload official roles based on the municipality structure
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


INSERT INTO report_categories (name, icon, description) VALUES
('Drinking Water', '💧', 'Issues related to public drinking water points, fountains, and water supply.'),
('Architectural Barriers', '♿', 'Obstacles that prevent accessibility for people with disabilities or mobility limitations.'),
('Sewer System', '🚰', 'Problems concerning drainage, sewage, and wastewater systems.'),
('Public Lighting', '🔦', 'Reports about malfunctioning street lights or lighting infrastructure.'),
('Waste', '♻️', 'Issues related to waste collection, recycling, or illegal dumping.'),
('Road Signs & Traffic', '🚦', 'Problems involving traffic signs, signals, or traffic flow.'),
('Roads & Furnishings', '🏙️', 'Damages or issues related to roads, sidewalks, and urban furnishings.'),
('Green Areas & Playgrounds', '🌳', 'Maintenance of green spaces, parks, playgrounds, and public gardens.');

-- ===============================
-- ROLE TO CATEGORY ASSIGNMENTS
-- ===============================
INSERT INTO role_category_responsibility (role_id, category_id)
SELECT R.id, C.id FROM roles R, report_categories C WHERE R.label = 'Infrastructure Technician' AND C.name IN ('Drinking Water', 'Sewer System', 'Public Lighting', 'Road Signs & Traffic', 'Roads & Furnishings');

INSERT INTO role_category_responsibility (role_id, category_id)
SELECT R.id, C.id FROM roles R, report_categories C WHERE R.label = 'Green Areas Technician' AND C.name = 'Green Areas & Playgrounds';

INSERT INTO role_category_responsibility (role_id, category_id)
SELECT R.id, C.id FROM roles R, report_categories C WHERE R.label = 'Environment Quality Technician' AND C.name = 'Waste';

INSERT INTO role_category_responsibility (role_id, category_id)
SELECT R.id, C.id FROM roles R, report_categories C WHERE R.label = 'Municipal Buildings Maintenance Technician' AND C.name = 'Architectural Barriers';


-------------------------------------------------- Assign roles to the municipality users
-- ============================================================
-- ASSIGN ROLES TO DEMO MUNICIPALITY USERS
-- ============================================================

-- demo_Municipal_Public_Relations_Officer → Municipal Public Relations Officer
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'demo_Municipal_Public_Relations_Officer'
  AND r.label = 'Municipal Public Relations Officer';

-- demo_Municipal_Administrator → Municipal Administrator
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'demo_Municipal_Administrator'
  AND r.label = 'Municipal Administrator';

-- demo_Municipal_Infrastructure_Technician → Infrastructure Technician
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'demo_Municipal_Infrastructure_Technician'
  AND r.label = 'Infrastructure Technician';

-- demo_Municipal_Green_Areas_Technician → Green Areas Technician
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'demo_Municipal_Green_Areas_Technician'
  AND r.label = 'Green Areas Technician';

-- demo_Municipal_Environment_Quality_Technician → Environment Quality Technician
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'demo_Municipal_Environment_Quality_Technician'
  AND r.label = 'Environment Quality Technician';

-- demo_Municipal_Buildings_Maintenance_Technician → Municipal Buildings Maintenance Technician
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'demo_Municipal_Buildings_Maintenance_Technician'
  AND r.label = 'Municipal Buildings Maintenance Technician';

-- demo_Municipal_Roads_Maintainer → Roads Maintainer
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'demo_Municipal_Roads_Maintainer'
  AND r.label = 'Roads Maintainer';

-- demo_Municipal_Parks_Maintainer → Parks Maintainer
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'demo_Municipal_Parks_Maintainer'
  AND r.label = 'Parks Maintainer';

-- demo_Municipal_Water-sewer_Maintainer → Water/sewer Maintainer
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'demo_Municipal_Water-sewer_Maintainer'
  AND r.label = 'Water/sewer Maintainer';

-- demo_Municipal_Internal_Spaces_Maintainer → Internal Spaces Maintainer
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'demo_Municipal_Internal_Spaces_Maintainer'
  AND r.label = 'Internal Spaces Maintainer';

-- Admin -> Municipal Administrator
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin'
  AND r.label = 'Municipal Administrator';

-- Mario Rossi -> Public Relations Officer
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'mario.rossi'
  AND r.label = 'Municipal Public Relations Officer';

-- Franco Bianchi -> Infrastructure Technician
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'franco'
  AND r.label = 'Infrastructure Technician';

-- Luigi Verdi -> Green Areas Technician
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'luigi'
  AND r.label = 'Green Areas Technician';

-- Luigi Verdi -> Environment Quality Technician
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'luigi'
  AND r.label = 'Environment Quality Technician';

-- Francesco Banfi -> Municipal Buildings Maintenance Technician
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'francesco'
  AND r.label = 'Municipal Buildings Maintenance Technician';
