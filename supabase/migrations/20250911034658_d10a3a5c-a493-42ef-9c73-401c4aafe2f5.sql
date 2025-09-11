-- Migrate the recent temporary files to the correct project
-- Files uploaded around 03:40 should belong to "Project Best Project Super Build 5"

-- Move E1-01.dwg and E2-01.dwg to project b8fb02cb-bf03-42b6-8c26-a7793b7cf666
UPDATE files 
SET project_id = 'b8fb02cb-bf03-42b6-8c26-a7793b7cf666',
    storage_path = REPLACE(storage_path, 'temp/3b8d7a4b-e15c-458c-821b-3ed9ddbdb38d/', 'b8fb02cb-bf03-42b6-8c26-a7793b7cf666/')
WHERE id IN ('cac4b7f9-7d51-40d4-af36-57460dfe5270', '4ec6daa6-894d-406c-979f-51123ef54e07');