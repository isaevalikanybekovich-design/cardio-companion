-- Make the ecg-files bucket public so AI can access images for analysis
UPDATE storage.buckets 
SET public = true 
WHERE id = 'ecg-files';