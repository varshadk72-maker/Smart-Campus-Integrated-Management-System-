USE smart_campus_db;

-- Apply after database/activities.sql. These changes preserve existing rows and are safe to rerun.
-- The original activity date is a DATE; conversion preserves it as midnight while supporting datetime-local input.
SET @category_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'campus_activities'
      AND column_name = 'category'
);
SET @category_ddl = IF(
    @category_exists = 0,
    'ALTER TABLE campus_activities ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT ''General''',
    'SELECT 1'
);
PREPARE category_statement FROM @category_ddl;
EXECUTE category_statement;
DEALLOCATE PREPARE category_statement;

ALTER TABLE campus_activities
    MODIFY COLUMN activity_date DATETIME NOT NULL;

-- Keep the existing status/unique/activity foreign-key constraints and registration records intact.
UPDATE activity_registrations
SET status = 'REGISTERED'
WHERE status IS NULL OR status = '';

UPDATE activity_registrations
SET registration_date = CURRENT_TIMESTAMP
WHERE registration_date IS NULL;

ALTER TABLE activity_registrations
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',
    MODIFY COLUMN registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
