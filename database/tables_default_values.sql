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
('Technical Office Staff Member', 'Resolves issues assigned by category.');


