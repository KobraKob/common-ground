import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.modules.colleges.models import College
from app.modules.identity.models import User, StudentProfile
from app.modules.communities.models import Community, CommunityMembership
from app.modules.messaging.models import Conversation, ConversationMember, Message
from app.modules.commons.models import Post, Comment, Resource
from app.modules.projects.models import Project, ProjectMember, Task


async def run_seed():
    print("[Seed] Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print("[Seed] Seeding Bengaluru College Cluster...")
        colleges_data = [
            ("11111111-1111-1111-1111-111111111111", "RV College of Engineering", "rvce", "RVCE", ["rvce.edu.in"]),
            ("22222222-2222-2222-2222-222222222222", "PES University", "pesu", "PESU", ["pes.edu"]),
            ("33333333-3333-3333-3333-333333333333", "BMS College of Engineering", "bmsce", "BMSCE", ["bmsce.ac.in"]),
            ("44444444-4444-4444-4444-444444444444", "Christ University", "christ", "CHRIST", ["christuniversity.in"]),
            ("55555555-5555-5555-5555-555555555555", "MS Ramaiah Institute of Technology", "msrit", "MSRIT", ["msrit.edu"]),
            ("66666666-6666-6666-6666-666666666666", "International Institute of Information Technology Bangalore", "iiitb", "IIITB", ["iiitb.ac.in"]),
        ]

        for cid, name, slug, short_name, domains in colleges_data:
            existing = await db.execute(select(College).where(College.slug == slug))
            if not existing.scalar_one_or_none():
                db.add(College(
                    id=cid,
                    name=name,
                    slug=slug,
                    short_name=short_name,
                    city="Bengaluru",
                    state="Karnataka",
                    email_domains=domains,
                    is_official_partner=False,
                    is_active_cluster=True,
                ))

        await db.commit()

        print("[Seed] Seeding Demo Personas...")
        users_data = [
            ("aaaa0001-0000-0000-0000-000000000001", "aarav@rvce.edu.in", "USER", "aarav_builder", "Aarav Patel", "11111111-1111-1111-1111-111111111111", "STAGE_3_INSTITUTIONAL_VERIFIED", "B.E. Computer Science", 2026, ["Python", "Rust", "Next.js", "Distributed Systems"], ["Robotics", "Hackathons"], ["Hackathons", "Building a startup"]),
            ("aaaa0002-0000-0000-0000-000000000002", "diya@pes.edu", "USER", "diya_blr", "Diya Sharma", "22222222-2222-2222-2222-222222222222", "STAGE_2_COMMUNITY_VALIDATED", "B.Des Interaction Design", 2025, ["Figma", "UI/UX", "Product Strategy", "Tailwind"], ["Design Systems", "Design Sprint"], ["Cross-campus Meetups", "Side Projects"]),
            ("aaaa0003-0000-0000-0000-000000000003", "rohan@gmail.com", "USER", "rohan_k", "Rohan Kumar", "33333333-3333-3333-3333-333333333333", "STAGE_1_PROVISIONAL", "B.E. Computer Science", 2028, ["C++", "JavaScript", "HTML/CSS"], ["DSA", "Competitive Programming"], ["Study Groups", "Hackathons"]),
            ("aaaa0004-0000-0000-0000-000000000004", "mod@commonground.in", "MODERATOR", "mod_blr", "CommonGround Mod", None, "STAGE_3_INSTITUTIONAL_VERIFIED", "Community Ops", 2024, ["Moderation"], ["Campus Safety"], []),
        ]

        for uid, email, role, handle, dname, col_id, stage, course, yr, skills, interests, goals in users_data:
            existing_u = await db.execute(select(User).where(User.id == uid))
            if not existing_u.scalar_one_or_none():
                db.add(User(id=uid, email=email, platform_role=role))
                db.add(StudentProfile(
                    user_id=uid,
                    handle=handle,
                    display_name=dname,
                    college_id=col_id,
                    verification_stage=stage,
                    course_branch=course,
                    graduation_year=yr,
                    skills=skills,
                    interests=interests,
                    collaboration_goals=goals,
                    onboarding_completed=True,
                ))

        await db.commit()

        print("[Seed] Seeding Starter Communities & Groups...")
        comm_data = [
            ("c1110001-0000-0000-0000-000000000001", "RVCE Campus Hub", "rvce-campus-hub", "The student-run primary hub for RV College of Engineering students.", "CAMPUS_HUB", "CAMPUS_RESTRICTED", "11111111-1111-1111-1111-111111111111", "RVCEHUB", "aaaa0001-0000-0000-0000-000000000001", 280),
            ("c2220002-0000-0000-0000-000000000002", "PESU Ring Road & EC Cohort", "pesu-cohort", "Cross-campus student hub for PES University RR and EC branches.", "CAMPUS_HUB", "CAMPUS_RESTRICTED", "22222222-2222-2222-2222-222222222222", "PESUHUB", "aaaa0002-0000-0000-0000-000000000002", 340),
            ("c3330003-0000-0000-0000-000000000003", "Bengaluru Student Builders", "blr-student-builders", "Cross-college collective of developers, indie hackers, and researchers building software in Bengaluru.", "CROSS_CAMPUS_INTEREST", "PUBLIC", None, "BLRBUILD", "aaaa0001-0000-0000-0000-000000000001", 520),
            ("c4440004-0000-0000-0000-000000000004", "BLR Design & UI Collective", "blr-design-collective", "Designers from Srishti, PESU, RVCE, NIFT sharing critiques, portfolios, and design tokens.", "CROSS_CAMPUS_INTEREST", "PUBLIC", None, "BLRDESIGN", "aaaa0002-0000-0000-0000-000000000002", 210),
            ("c5550005-0000-0000-0000-000000000005", "Bengaluru Hackathon Finder", "blr-hackathons", "Find teammates, share upcoming hackathon details, and prep together.", "CROSS_CAMPUS_INTEREST", "PUBLIC", None, "HACKBLR", "aaaa0001-0000-0000-0000-000000000001", 480),
        ]

        for cid, name, slug, descr, ctype, vis, col_id, code, creator, mcount in comm_data:
            existing_c = await db.execute(select(Community).where(Community.id == cid))
            if not existing_c.scalar_one_or_none():
                db.add(Community(
                    id=cid,
                    name=name,
                    slug=slug,
                    description=descr,
                    community_type=ctype,
                    visibility=vis,
                    college_id=col_id,
                    is_official_endorsed=False,
                    invite_code=code,
                    created_by=creator,
                    member_count=mcount,
                ))
                db.add(CommunityMembership(community_id=cid, user_id=creator, role="OWNER"))

        await db.commit()

        print("[Seed] Seeding Conversations & Messages...")
        conv_id = "conv0001-0000-0000-0000-000000000001"
        existing_conv = await db.execute(select(Conversation).where(Conversation.id == conv_id))
        if not existing_conv.scalar_one_or_none():
            db.add(Conversation(
                id=conv_id,
                conversation_type="ANNOUNCEMENT_CHANNEL",
                community_id="c3330003-0000-0000-0000-000000000003",
                title="Builder Announcements",
            ))
            db.add(ConversationMember(conversation_id=conv_id, user_id="aaaa0001-0000-0000-0000-000000000001", role="OWNER"))
            db.add(Message(
                id="m0000001-0000-0000-0000-000000000001",
                conversation_id=conv_id,
                sender_id="aaaa0001-0000-0000-0000-000000000001",
                body="Welcome to Bengaluru Student Builders! Demo Day is scheduled for the last Saturday of this month in Koramangala.",
                is_announcement=True,
            ))

        chat_id = "conv0002-0000-0000-0000-000000000002"
        existing_chat = await db.execute(select(Conversation).where(Conversation.id == chat_id))
        if not existing_chat.scalar_one_or_none():
            db.add(Conversation(
                id=chat_id,
                conversation_type="GROUP_CHAT",
                community_id="c3330003-0000-0000-0000-000000000003",
                title="Builders General Chat",
            ))
            db.add(ConversationMember(conversation_id=chat_id, user_id="aaaa0001-0000-0000-0000-000000000001", role="OWNER"))
            db.add(ConversationMember(conversation_id=chat_id, user_id="aaaa0002-0000-0000-0000-000000000002", role="MEMBER"))
            db.add(Message(
                id="m0000002-0000-0000-0000-000000000002",
                conversation_id=chat_id,
                sender_id="aaaa0002-0000-0000-0000-000000000002",
                body="Hey everyone! Excited to meet founders and builders from PESU and RVCE here.",
            ))

        print("[Seed] Seeding Commons Q&A and Opportunities...")
        p1_id = "p0000001-0000-0000-0000-000000000001"
        existing_p1 = await db.execute(select(Post).where(Post.id == p1_id))
        if not existing_p1.scalar_one_or_none():
            db.add(Post(
                id=p1_id,
                author_id="aaaa0003-0000-0000-0000-000000000003",
                college_id="33333333-3333-3333-3333-333333333333",
                category="QUESTION_QA",
                title="How to prepare for Autonomous 3rd Sem Data Structures exams effectively?",
                body="Looking for reliable past notes and important algorithm problems (Trees, Graphs, Sorting). Any seniors who cracked this with high CGPA?",
                tags=["DSA", "Academics", "VTU"],
                is_cross_campus=True,
                upvotes_count=24,
            ))
            # Answer
            ans_id = "comm0001-0000-0000-0000-000000000001"
            db.add(Comment(
                id=ans_id,
                post_id=p1_id,
                author_id="aaaa0001-0000-0000-0000-000000000001",
                body="Focus on AVL tree rotations and Dijkstra graph implementations. I have linked the verified RVCE DSA notes in the Commons Resources vault!",
                is_useful_answer=True,
                upvotes_count=18,
            ))

        p3_id = "p0000003-0000-0000-0000-000000000003"
        existing_p3 = await db.execute(select(Post).where(Post.id == p3_id))
        if not existing_p3.scalar_one_or_none():
            db.add(Post(
                id=p3_id,
                author_id="aaaa0002-0000-0000-0000-000000000002",
                category="OPPORTUNITY",
                title="Bengaluru Open Source Summer Fellowship 2026",
                body="Stipend: ₹40,000/month. 12-week fellowship working on civic tech for Bengaluru infrastructure. Open to all students.",
                tags=["Internships", "OpenSource", "Bengaluru"],
                is_cross_campus=True,
                opportunity_meta={
                    "type": "INTERNSHIP",
                    "deadline": "2026-12-15T23:59:59Z",
                    "verification_label": "VERIFIED",
                    "external_url": "https://bengaluru-fellowship.org",
                },
                upvotes_count=88,
            ))

        # Project
        proj_id = "proj0001-0000-0000-0000-000000000001"
        existing_proj = await db.execute(select(Project).where(Project.id == proj_id))
        if not existing_proj.scalar_one_or_none():
            db.add(Project(
                id=proj_id,
                creator_id="aaaa0001-0000-0000-0000-000000000001",
                college_id="11111111-1111-1111-1111-111111111111",
                title="BMTC Transit Pulse",
                pitch="Real-time crowdedness and delay predictor for BMTC buses using crowd-sourced signals.",
                description="We are building an open-source real-time bus arrival predictor targeting outer ring road routes (Silk Board to Hebbal). Looking for mobile and backend collaborators.",
                stage="PROTOTYPING",
                skills_needed=["React Native", "FastAPI", "Time-series ML"],
                open_roles=["Mobile Developer", "UI Designer"],
                is_cross_campus_open=True,
            ))
            db.add(ProjectMember(
                project_id=proj_id,
                user_id="aaaa0001-0000-0000-0000-000000000001",
                role_title="Lead Architect",
                status="ACCEPTED",
            ))
            db.add(Task(project_id=proj_id, title="Implement GPS coordinate ingest API", status="DONE"))
            db.add(Task(project_id=proj_id, title="Design Neo-Y2K mobile rider interface", status="IN_PROGRESS"))
            db.add(Task(project_id=proj_id, title="Conduct test run on Route 500D (Hebbal to Silk Board)", status="TODO"))

        await db.commit()
        print("[Seed] Successfully completed CommonGround seeding!")


if __name__ == "__main__":
    asyncio.run(run_seed())
