import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.modules.colleges.models import College


async def init_college_directory():
    """
    Idempotently initialize the accredited Bengaluru colleges cluster directory.
    Zero demo personas, zero fake posts, zero mock data.
    """
    async with AsyncSessionLocal() as db:
        colleges_data = [
            ("11111111-1111-1111-1111-111111111111", "RV College of Engineering", "rvce", "RVCE", ["rvce.edu.in"], 12.9231, 77.5004),
            ("22222222-2222-2222-2222-222222222222", "PES University", "pesu", "PESU", ["pes.edu"], 12.93506, 77.53684),
            ("33333333-3333-3333-3333-333333333333", "BMS College of Engineering", "bmsce", "BMSCE", ["bmsce.ac.in"], 12.941336, 77.565504),
            ("44444444-4444-4444-4444-444444444444", "Christ University", "christ", "CHRIST", ["christuniversity.in"], 12.932998, 77.606697),
            ("55555555-5555-5555-5555-555555555555", "MS Ramaiah Institute of Technology", "msrit", "MSRIT", ["msrit.edu"], 13.029972, 77.564972),
            ("66666666-6666-6666-6666-666666666666", "International Institute of Information Technology Bangalore", "iiitb", "IIITB", ["iiitb.ac.in"], 12.8447, 77.6609),
        ]

        for cid, name, slug, short_name, domains, latitude, longitude in colleges_data:
            existing = await db.execute(select(College).where(College.slug == slug))
            college = existing.scalar_one_or_none()
            if not college:
                college = College(
                    id=cid,
                    name=name,
                    slug=slug,
                    short_name=short_name,
                    city="Bengaluru",
                    state="Karnataka",
                    email_domains=domains,
                    is_official_partner=False,
                    is_active_cluster=True,
                )
                db.add(college)
            college.latitude = latitude
            college.longitude = longitude

        await db.commit()
        print("[College Directory] Bengaluru Launch Cluster initialized successfully.")


# For backwards-compatible imports if referenced
run_seed = init_college_directory

if __name__ == "__main__":
    asyncio.run(init_college_directory())
