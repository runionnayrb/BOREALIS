-- ================================================
-- VERIFICATION QUERIES
-- Run these in the Database SQL Runner to check your import
-- ================================================

-- Check Scenes count
SELECT 'Scenes' as table_name, COUNT(*) as count FROM scenes;

-- Check Acts count  
SELECT 'Acts' as table_name, COUNT(*) as count FROM acts;

-- Check Departments count
SELECT 'Departments' as table_name, COUNT(*) as count FROM departments;

-- Check Locations count
SELECT 'Locations' as table_name, COUNT(*) as count FROM locations;

-- Check Artists count
SELECT 'Artists' as table_name, COUNT(*) as count FROM artists;

-- Check Technicians count
SELECT 'Technicians' as table_name, COUNT(*) as count FROM technicians;

-- View all scenes (sample)
SELECT id, name FROM scenes ORDER BY sort_order LIMIT 5;
