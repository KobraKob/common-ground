-- Campus map coordinates are approximate campus-centre pins.
-- Sources are documented in docs/CAMPUS_COORDINATE_SOURCES.md.
ALTER TABLE colleges
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

UPDATE colleges SET latitude = 12.9231, longitude = 77.5004 WHERE slug = 'rvce';
UPDATE colleges SET latitude = 12.93506, longitude = 77.53684 WHERE slug = 'pesu';
UPDATE colleges SET latitude = 12.941336, longitude = 77.565504 WHERE slug = 'bmsce';
UPDATE colleges SET latitude = 12.932998, longitude = 77.606697 WHERE slug = 'christ';
UPDATE colleges SET latitude = 13.029972, longitude = 77.564972 WHERE slug = 'msrit';
UPDATE colleges SET latitude = 12.8447, longitude = 77.6609 WHERE slug = 'iiitb';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ck_colleges_coordinate_pair'
  ) THEN
    ALTER TABLE colleges ADD CONSTRAINT ck_colleges_coordinate_pair
      CHECK (
        (latitude IS NULL AND longitude IS NULL)
        OR (
          latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND latitude BETWEEN -90 AND 90
          AND longitude BETWEEN -180 AND 180
        )
      );
  END IF;
END $$;
