USE smart_campus_db;

-- Optional idempotent sample row. Existing campus activity records are left unchanged.
INSERT INTO campus_activities
    (activity_name, category, description, activity_date, location, capacity)
SELECT
    'Java Programming Workshop', 'Workshop', 'Introduction to Java and OOP concepts',
    '2026-11-15 10:00:00', 'Computer Science Lab', 50
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM campus_activities WHERE activity_name = 'Java Programming Workshop'
);
