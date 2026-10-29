USE smart_campus_db;

CREATE TABLE IF NOT EXISTS campus_activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_name VARCHAR(100) NOT NULL,
    description TEXT,
    activity_date DATE NOT NULL,
    location VARCHAR(150),
    capacity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS activity_registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    student_id INT NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'REGISTERED',
    FOREIGN KEY (activity_id)
        REFERENCES campus_activities(activity_id),
    UNIQUE (activity_id, student_id)
);

INSERT INTO campus_activities
(activity_name, description, activity_date, location, capacity)
VALUES
('Java Programming Workshop',
 'Introduction to Java and OOP concepts',
 '2026-11-15',
 'Computer Science Lab',
 50);