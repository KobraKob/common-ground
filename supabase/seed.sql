-- CommonGround Seed Data
-- Bengaluru Launch Cluster & Demo Personas

-- 1. Insert Colleges
INSERT INTO colleges (id, name, slug, short_name, city, state, email_domains, is_official_partner, is_active_cluster)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'RV College of Engineering', 'rvce', 'RVCE', 'Bengaluru', 'Karnataka', ARRAY['rvce.edu.in'], FALSE, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'PES University', 'pesu', 'PESU', 'Bengaluru', 'Karnataka', ARRAY['pes.edu'], FALSE, TRUE),
    ('33333333-3333-3333-3333-333333333333', 'BMS College of Engineering', 'bmsce', 'BMSCE', 'Bengaluru', 'Karnataka', ARRAY['bmsce.ac.in'], FALSE, TRUE),
    ('44444444-4444-4444-4444-444444444444', 'Christ University', 'christ', 'CHRIST', 'Bengaluru', 'Karnataka', ARRAY['christuniversity.in'], FALSE, TRUE),
    ('55555555-5555-5555-5555-555555555555', 'MS Ramaiah Institute of Technology', 'msrit', 'MSRIT', 'Bengaluru', 'Karnataka', ARRAY['msrit.edu'], FALSE, TRUE),
    ('66666666-6666-6666-6666-666666666666', 'International Institute of Information Technology Bangalore', 'iiitb', 'IIITB', 'Bengaluru', 'Karnataka', ARRAY['iiitb.ac.in'], FALSE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Users
INSERT INTO users (id, email, platform_role, is_suspended)
VALUES
    ('aaaa0001-0000-0000-0000-000000000001', 'aarav@rvce.edu.in', 'USER', FALSE),
    ('aaaa0002-0000-0000-0000-000000000002', 'diya@pes.edu', 'USER', FALSE),
    ('aaaa0003-0000-0000-0000-000000000003', 'rohan@gmail.com', 'USER', FALSE),
    ('aaaa0004-0000-0000-0000-000000000004', 'mod@commonground.in', 'MODERATOR', FALSE)
ON CONFLICT (email) DO NOTHING;

-- 3. Student Profiles
INSERT INTO student_profiles (user_id, handle, display_name, bio, avatar_url, college_id, verification_stage, course_branch, graduation_year, skills, interests, collaboration_goals, profile_visibility, show_course_year, dm_permission, onboarding_completed)
VALUES
    ('aaaa0001-0000-0000-0000-000000000001', 'aarav_builder', 'Aarav Patel', 'Building distributed systems and robotics. 3rd year CSE @ RVCE.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '11111111-1111-1111-1111-111111111111', 'STAGE_3_INSTITUTIONAL_VERIFIED', 'B.E. Computer Science', 2026, ARRAY['Python', 'Rust', 'Next.js', 'Distributed Systems'], ARRAY['Robotics', 'Hackathons', 'Open Source'], ARRAY['Hackathons', 'Building a startup'], 'PUBLIC', TRUE, 'EVERYONE', TRUE),
    ('aaaa0002-0000-0000-0000-000000000002', 'diya_blr', 'Diya Sharma', 'Design thinker, community manager, and hackathon organizer. PESU EC Campus.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', '22222222-2222-2222-2222-222222222222', 'STAGE_2_COMMUNITY_VALIDATED', 'B.Des Interaction Design', 2025, ARRAY['Figma', 'UI/UX', 'Product Strategy', 'Tailwind'], ARRAY['Design Systems', 'Design Sprint', 'Coffee Meets'], ARRAY['Cross-campus Meetups', 'Side Projects'], 'PUBLIC', TRUE, 'SAME_CAMPUS_OR_COMMUNITY', TRUE),
    ('aaaa0003-0000-0000-0000-000000000003', 'rohan_k', 'Rohan Kumar', '1st year BMSCE CSE. Exploring web development and algorithmic problem solving.', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', '33333333-3333-3333-3333-333333333333', 'STAGE_1_PROVISIONAL', 'B.E. Computer Science', 2028, ARRAY['C++', 'JavaScript', 'HTML/CSS'], ARRAY['DSA', 'Competitive Programming'], ARRAY['Study Groups', 'Hackathons'], 'PUBLIC', TRUE, 'SAME_CAMPUS_OR_COMMUNITY', TRUE),
    ('aaaa0004-0000-0000-0000-000000000004', 'mod_blr', 'CommonGround Mod', 'Bengaluru safety and community moderation team.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', NULL, 'STAGE_3_INSTITUTIONAL_VERIFIED', 'Community Ops', 2024, ARRAY['Moderation', 'Community Health'], ARRAY['Campus Safety'], ARRAY[], 'PUBLIC', FALSE, 'EVERYONE', TRUE)
ON CONFLICT (handle) DO NOTHING;

-- 4. Initial Communities
INSERT INTO communities (id, name, slug, description, community_type, visibility, college_id, is_official_endorsed, invite_code, created_by, member_count)
VALUES
    ('c1110001-0000-0000-0000-000000000001', 'RVCE Campus Hub', 'rvce-campus-hub', 'The student-run primary hub for RV College of Engineering students.', 'CAMPUS_HUB', 'CAMPUS_RESTRICTED', '11111111-1111-1111-1111-111111111111', FALSE, 'RVCEHUB', 'aaaa0001-0000-0000-0000-000000000001', 280),
    ('c2220002-0000-0000-0000-000000000002', 'PESU Ring Road & EC Cohort', 'pesu-cohort', 'Cross-campus student hub for PES University RR and EC branches.', 'CAMPUS_HUB', 'CAMPUS_RESTRICTED', '22222222-2222-2222-2222-222222222222', FALSE, 'PESUHUB', 'aaaa0002-0000-0000-0000-000000000002', 340),
    ('c3330003-0000-0000-0000-000000000003', 'Bengaluru Student Builders', 'blr-student-builders', 'Cross-college collective of developers, indie hackers, and researchers building software in Bengaluru.', 'CROSS_CAMPUS_INTEREST', 'PUBLIC', NULL, FALSE, 'BLRBUILD', 'aaaa0001-0000-0000-0000-000000000001', 520),
    ('c4440004-0000-0000-0000-000000000004', 'BLR Design & UI Collective', 'blr-design-collective', 'Designers from Srishti, PESU, RVCE, NIFT sharing critiques, portfolios, and design tokens.', 'CROSS_CAMPUS_INTEREST', 'PUBLIC', NULL, FALSE, 'BLRDESIGN', 'aaaa0002-0000-0000-0000-000000000002', 210),
    ('c5550005-0000-0000-0000-000000000005', 'Bengaluru Hackathon Finder', 'blr-hackathons', 'Find teammates, share upcoming hackathon details, and prep together.', 'CROSS_CAMPUS_INTEREST', 'PUBLIC', NULL, FALSE, 'HACKBLR', 'aaaa0001-0000-0000-0000-000000000001', 480)
ON CONFLICT (slug) DO NOTHING;

-- 5. Community Memberships
INSERT INTO community_memberships (community_id, user_id, role)
VALUES
    ('c1110001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', 'OWNER'),
    ('c2220002-0000-0000-0000-000000000002', 'aaaa0002-0000-0000-0000-000000000002', 'OWNER'),
    ('c3330003-0000-0000-0000-000000000003', 'aaaa0001-0000-0000-0000-000000000001', 'OWNER'),
    ('c3330003-0000-0000-0000-000000000003', 'aaaa0002-0000-0000-0000-000000000002', 'MODERATOR'),
    ('c3330003-0000-0000-0000-000000000003', 'aaaa0003-0000-0000-0000-000000000003', 'MEMBER')
ON CONFLICT ON CONSTRAINT uq_community_user DO NOTHING;

-- 6. Starter Conversations
INSERT INTO conversations (id, conversation_type, community_id, title, description)
VALUES
    ('conv0001-0000-0000-0000-000000000001', 'ANNOUNCEMENT_CHANNEL', 'c3330003-0000-0000-0000-000000000003', 'Builder Announcements', 'Official announcements for Bengaluru Student Builders'),
    ('conv0002-0000-0000-0000-000000000002', 'GROUP_CHAT', 'c3330003-0000-0000-0000-000000000003', 'Builders General Chat', 'Open discussion, project demos, and technical discussions'),
    ('conv0003-0000-0000-0000-000000000003', 'DIRECT', NULL, 'Aarav & Diya', 'Direct conversation between Aarav and Diya')
ON CONFLICT DO NOTHING;

INSERT INTO conversation_members (conversation_id, user_id, role)
VALUES
    ('conv0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', 'OWNER'),
    ('conv0001-0000-0000-0000-000000000001', 'aaaa0002-0000-0000-0000-000000000002', 'MODERATOR'),
    ('conv0001-0000-0000-0000-000000000001', 'aaaa0003-0000-0000-0000-000000000003', 'MEMBER'),
    ('conv0002-0000-0000-0000-000000000002', 'aaaa0001-0000-0000-0000-000000000001', 'OWNER'),
    ('conv0002-0000-0000-0000-000000000002', 'aaaa0002-0000-0000-0000-000000000002', 'MODERATOR'),
    ('conv0002-0000-0000-0000-000000000002', 'aaaa0003-0000-0000-0000-000000000003', 'MEMBER'),
    ('conv0003-0000-0000-0000-000000000003', 'aaaa0001-0000-0000-0000-000000000001', 'MEMBER'),
    ('conv0003-0000-0000-0000-000000000003', 'aaaa0002-0000-0000-0000-000000000002', 'MEMBER')
ON CONFLICT ON CONSTRAINT uq_conv_member DO NOTHING;

INSERT INTO messages (id, conversation_id, sender_id, body, is_announcement)
VALUES
    ('m0000001-0000-0000-0000-000000000001', 'conv0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', 'Welcome to Bengaluru Student Builders! Demo Day is scheduled for the last Saturday of this month in Koramangala.', TRUE),
    ('m0000002-0000-0000-0000-000000000002', 'conv0002-0000-0000-0000-000000000002', 'aaaa0002-0000-0000-0000-000000000002', 'Hey everyone! Excited to meet founders and builders from PESU and RVCE here.', FALSE),
    ('m0000003-0000-0000-0000-000000000003', 'conv0002-0000-0000-0000-000000000002', 'aaaa0003-0000-0000-0000-000000000003', 'Hey Diya! Looking forward to learning from you all.', FALSE)
ON CONFLICT DO NOTHING;

-- 7. Commons Posts, Q&A & Opportunities
INSERT INTO posts (id, author_id, community_id, college_id, category, title, body, tags, is_cross_campus, upvotes_count)
VALUES
    ('p0000001-0000-0000-0000-000000000001', 'aaaa0003-0000-0000-0000-000000000003', NULL, '33333333-3333-3333-3333-333333333333', 'QUESTION_QA', 'How to prepare for VTU / Autonomous 3rd Sem Data Structures exams effectively?', 'Looking for reliable past notes and important algorithm problems (Trees, Graphs, Sorting). Any seniors who cracked this with high CGPA?', ARRAY['DSA', 'Academics', 'VTU'], TRUE, 24),
    ('p0000002-0000-0000-0000-000000000002', 'aaaa0001-0000-0000-0000-000000000001', 'c3330003-0000-0000-0000-000000000003', NULL, 'DISCUSSION', 'State of Cross-Campus AI Hackathons in Bengaluru 2026', 'Sharing lessons from participating in HackBengaluru and Smart India Hackathon. Focus on domain depth rather than superficial wrapper prototypes.', ARRAY['Hackathons', 'AI', 'BengaluruBuilders'], TRUE, 42),
    ('p0000003-0000-0000-0000-000000000003', 'aaaa0002-0000-0000-0000-000000000002', NULL, NULL, 'OPPORTUNITY', 'Bengaluru Open Source Summer Fellowship 2026', 'Stipend: ₹40,000/month. 12-week fellowship working on civic tech for Bengaluru infrastructure. Open to all students.', ARRAY['Internships', 'OpenSource', 'Bengaluru'], TRUE, 88)
ON CONFLICT DO NOTHING;

-- Add opportunity meta to post 3
UPDATE posts SET opportunity_meta = '{"type": "INTERNSHIP", "deadline": "2026-12-15T23:59:59Z", "verification_label": "VERIFIED", "external_url": "https://bengaluru-fellowship.org"}' WHERE id = 'p0000003-0000-0000-0000-000000000003';

-- Useful Answer for Q&A post
INSERT INTO comments (id, post_id, author_id, body, is_useful_answer, upvotes_count)
VALUES
    ('comm0001-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', 'Focus on AVL tree rotations and Dijkstra graph implementations. I have linked the verified RVCE DSA notes in the Commons Resources vault!', TRUE, 18)
ON CONFLICT DO NOTHING;

UPDATE posts SET accepted_answer_comment_id = 'comm0001-0000-0000-0000-000000000001' WHERE id = 'p0000001-0000-0000-0000-000000000001';

-- 8. Projects
INSERT INTO projects (id, creator_id, college_id, title, pitch, description, stage, skills_needed, open_roles, is_cross_campus_open)
VALUES
    ('proj0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'BMTC Transit Pulse', 'Real-time crowdedness and delay predictor for BMTC buses using crowd-sourced signals.', 'We are building an open-source real-time bus arrival predictor targeting outer ring road routes (Silk Board to Hebbal). Looking for mobile and backend collaborators.', 'PROTOTYPING', ARRAY['React Native', 'FastAPI', 'Time-series ML'], ARRAY['Mobile Developer', 'UI Designer'], TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO project_members (project_id, user_id, role_title, status)
VALUES
    ('proj0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', 'Lead Architect', 'ACCEPTED')
ON CONFLICT ON CONSTRAINT uq_project_member DO NOTHING;

INSERT INTO tasks (project_id, title, status)
VALUES
    ('proj0001-0000-0000-0000-000000000001', 'Implement GPS coordinate ingest API', 'DONE'),
    ('proj0001-0000-0000-0000-000000000001', 'Design Neo-Y2K mobile rider interface', 'IN_PROGRESS'),
    ('proj0001-0000-0000-0000-000000000001', 'Conduct test run on Route 500D (Hebbal to Silk Board)', 'TODO')
ON CONFLICT DO NOTHING;
