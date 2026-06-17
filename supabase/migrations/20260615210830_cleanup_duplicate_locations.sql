-- Clean up duplicate parking locations (keep the newer ones with more complete address)
DELETE FROM parking_locations 
WHERE id NOT IN (
  SELECT DISTINCT ON (name) id FROM parking_locations ORDER BY name, created_at DESC
);