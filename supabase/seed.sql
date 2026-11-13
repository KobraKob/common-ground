-- CommonGround Production Reference Seed
-- Bengaluru Launch Cluster (Accredited Colleges Directory)
-- No fake personas, test posts, or mock data.

INSERT INTO colleges (id, name, slug, short_name, city, state, email_domains, is_official_partner, is_active_cluster)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'RV College of Engineering', 'rvce', 'RVCE', 'Bengaluru', 'Karnataka', ARRAY['rvce.edu.in'], FALSE, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'PES University', 'pesu', 'PESU', 'Bengaluru', 'Karnataka', ARRAY['pes.edu'], FALSE, TRUE),
    ('33333333-3333-3333-3333-333333333333', 'BMS College of Engineering', 'bmsce', 'BMSCE', 'Bengaluru', 'Karnataka', ARRAY['bmsce.ac.in'], FALSE, TRUE),
    ('44444444-4444-4444-4444-444444444444', 'Christ University', 'christ', 'CHRIST', 'Bengaluru', 'Karnataka', ARRAY['christuniversity.in'], FALSE, TRUE),
    ('55555555-5555-5555-5555-555555555555', 'MS Ramaiah Institute of Technology', 'msrit', 'MSRIT', 'Bengaluru', 'Karnataka', ARRAY['msrit.edu'], FALSE, TRUE),
    ('66666666-6666-6666-6666-666666666666', 'International Institute of Information Technology Bangalore', 'iiitb', 'IIITB', 'Bengaluru', 'Karnataka', ARRAY['iiitb.ac.in'], FALSE, TRUE)
ON CONFLICT (slug) DO NOTHING;
