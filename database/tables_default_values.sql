--------- TABLES DEFAULT VALUE ------------


-- query to get hex pass and salt
-- SELECT username, HEX(password_hash) AS password_hash_hex, HEX(salt) AS salt_hex FROM users;


-- Preload users

INSERT INTO users (username, password_hash, salt, first_name, last_name, email, user_type) VALUES
('admin', X'80B4DC9201E01C955303467C88656756', X'27CE6E026F80F09999A6E573EC723E7F', 'admin', 'admin', 'admin.admin@email.com', 'admin'),
('johndoe', X'DC3339912A9BE643D12156772C853619', X'69A67927073D4FC1B3FACDFB2637CE45', 'John', 'Doe', 'John.Doe@email.com', 'citizen');


-- Preload official roles based on the municipality structure
INSERT INTO roles (label, description) VALUES
('Municipal Public Relations Officer', 'Handles citizen communications and report approvals.'),
('Municipal Administrator', 'Oversees system management and user permissions.'),
('Infrastructure Technician', 'Addresses reports related to public infrastructure, including roads, sidewalks, street lighting, traffic signals, and water/sewer networks.'),
('Green Areas Technician', 'Manages and resolves reports concerning maintenance, damage, and upkeep of public parks, gardens, trees, and other municipal green spaces.'),
('Environment Quality Technician', 'Investigates and resolves environmental compliance reports, such as illegal dumping, air/noise pollution, and public health violations.'),
('Municipal Buildings Maintenance Technician', 'Performs and coordinates corrective and preventative maintenance for city-owned facilities, public buildings, and urban furnishings.');


INSERT INTO report_categories (name, icon, description) VALUES
('Drinking Water', '💧', 'Issues related to public drinking water points, fountains, and water supply.'),
('Architectural Barriers', '♿', 'Obstacles that prevent accessibility for people with disabilities or mobility limitations.'),
('Sewer System', '🚰', 'Problems concerning drainage, sewage, and wastewater systems.'),
('Public Lighting', '🔦', 'Reports about malfunctioning street lights or lighting infrastructure.'),
('Waste', '♻️', 'Issues related to waste collection, recycling, or illegal dumping.'),
('Road Signs & Traffic', '🚦', 'Problems involving traffic signs, signals, or traffic flow.'),
('Roads & Furnishings', '🏙️', 'Damages or issues related to roads, sidewalks, and urban furnishings.'),
('Green Areas & Playgrounds', '🌳', 'Maintenance of green spaces, parks, playgrounds, and public gardens.');
