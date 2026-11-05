"""
AlgoSet Management Command — clean_seed_data
Safely cleans development seed data from the production database while strictly
preserving real user accounts, their submissions, real problems, and system integrity.

Safety features:
- Dry-run mode by default (--dry-run)
- Explicit confirmation required (--confirm)
- Whitelisting of legitimate production user accounts and user submissions
- Dependency-aware deletion order (foreign keys resolved safely)
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from core.models import (
    User,
    Submission,
    Contest,
    ContestParticipation,
    Lesson,
    Topic,
    UserTopicProgress,
    UserLessonProgress,
    Problem,
)


class Command(BaseCommand):
    help = "Safely removes demo/seed users, fake contests, and test submissions from the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Simulate the cleanup without deleting any records (Default behavior if --confirm is omitted).",
        )
        parser.add_argument(
            "--confirm",
            action="store_true",
            default=False,
            help="Explicit confirmation required to execute destructive database deletions.",
        )

    def handle(self, *args, **options):
        confirm = options.get("confirm", False)
        dry_run = options.get("dry_run", False) or not confirm

        self.stdout.write(self.style.MIGRATE_HEADING("=== AlgoSet Ishlab Chiqarish Bazasini Tozalash ==="))
        if dry_run:
            self.stdout.write(self.style.WARNING("REJIM: Dry-run / Simulyatsiya (Bazada hech narsa o'chirilmaydi)"))
        else:
            self.stdout.write(self.style.NOTICE("REJIM: Haqiqiy tozalash tasdiqlandi (--confirm faollashtirilgan)"))

        # 1. Identify Demo Users to Remove
        demo_usernames = ["student", "author"]
        demo_users = User.objects.filter(username__in=demo_usernames)

        # 2. Identify Protected Real Users (Whitelisted)
        real_users = User.objects.exclude(username__in=["superadmin", "admin", "student", "author"])
        protected_user_ids = set(real_users.values_list("id", flat=True))

        self.stdout.write("\n--- 1. FOYDALANUVCHILAR TAHLILI ---")
        self.stdout.write(f"Muhofaza qilinadigan real foydalanuvchilar: {real_users.count()} ta")
        for u in real_users:
            self.stdout.write(self.style.SUCCESS(f"  [SAQLANADI] ID={u.id}, username='{u.username}', email='{u.email}'"))

        self.stdout.write(f"\nO'chirishga mo'ljallangan demo foydalanuvchilar: {demo_users.count()} ta")
        for du in demo_users:
            self.stdout.write(self.style.ERROR(f"  [O'CHIRILADI] ID={du.id}, username='{du.username}', email='{du.email}'"))

        # 3. Identify Seed Submissions
        demo_user_ids = list(demo_users.values_list("id", flat=True))
        demo_submissions = Submission.objects.filter(user_id__in=demo_user_ids)
        real_submissions = Submission.objects.filter(user_id__in=protected_user_ids)

        self.stdout.write("\n--- 2. YECHIMLAR (SUBMISSIONS) TAHLILI ---")
        self.stdout.write(f"Real foydalanuvchilar yechimlari: {real_submissions.count()} ta (SAQLANADI)")
        for rs in real_submissions:
            self.stdout.write(self.style.SUCCESS(
                f"  [SAQLANADI] ID={rs.id}, Foydalanuvchi='{rs.user.username}', Masala='{rs.problem.slug}', Holat='{rs.status}'"
            ))

        self.stdout.write(f"Demo foydalanuvchilar yechimlari: {demo_submissions.count()} ta (O'CHIRILADI)")
        for ds in demo_submissions:
            self.stdout.write(self.style.ERROR(
                f"  [O'CHIRILADI] ID={ds.id}, Foydalanuvchi='{ds.user.username}', Masala='{ds.problem.slug}'"
            ))

        # 4. Identify Seed Contests & Participations
        seed_contest_slugs = [
            "weekly-python-contest-12",
            "monthly-algorithm-challenge",
            "beginner-contest",
        ]
        demo_contests = Contest.objects.filter(slug__in=seed_contest_slugs)
        demo_participations = ContestParticipation.objects.filter(contest__in=demo_contests)

        self.stdout.write("\n--- 3. MUSOBAQALAR (CONTESTS) TAHLILI ---")
        self.stdout.write(f"O'chiriladigan test musobaqalari: {demo_contests.count()} ta")
        for dc in demo_contests:
            self.stdout.write(self.style.ERROR(f"  [O'CHIRILADI] Musobaqa: '{dc.slug}' ({dc.title_uz})"))
        self.stdout.write(f"O'chiriladigan test ishtiroklari: {demo_participations.count()} ta")

        # 5. Identify Stub / Draft Placeholder Lessons
        stub_lesson_slugs = [
            "draft-advanced-memory-profiling",
            "intro-to-variables",
            "fast-io-techniques",
            "loops-and-comprehensions",
        ]
        stub_lessons = Lesson.objects.filter(slug__in=stub_lesson_slugs, is_imported=False)

        self.stdout.write("\n--- 4. ESKI DARSLIKLAR TAHLILI ---")
        self.stdout.write(f"O'chiriladigan/yangilanadigan eski qoralama darslar: {stub_lessons.count()} ta")
        for sl in stub_lessons:
            self.stdout.write(self.style.NOTICE(f"  [TOZALANADI] Dars: '{sl.slug}' ({sl.title_uz})"))

        # 6. Reassign Problem Authorship (if problems author was demo user 'author')
        admin_user = User.objects.filter(role__in=[User.Role.ADMIN, User.Role.SUPERADMIN]).order_by("id").first()
        author_problems = Problem.objects.filter(author__in=demo_users)
        self.stdout.write(f"\nMuallifligi Adminga o'tkaziladigan masalalar soni: {author_problems.count()} ta")

        # 7. Execution Logic
        if not confirm:
            self.stdout.write(self.style.WARNING(
                "\n[DIQQAT] --confirm parametri berilmagan. Hech qanday ma'lumot o'chirilmadi.\n"
                "Tozalashni haqiqatda bajarish uchun quyidagi buyruqni ishga tushiring:\n"
                "  python manage.py clean_seed_data --confirm"
            ))
            return

        with transaction.atomic():
            # A. Reassign problem authorship to admin so problem records are not orphaned
            if admin_user:
                for prob in author_problems:
                    prob.author = admin_user
                    prob.save(update_fields=["author"])

            # B. Delete demo contest participations
            deleted_parts_count = demo_participations.count()
            demo_participations.delete()

            # C. Delete demo contests
            deleted_contests_count = demo_contests.count()
            demo_contests.delete()

            # D. Delete demo submissions
            deleted_subs_count = demo_submissions.count()
            demo_submissions.delete()

            # E. Delete demo user progress
            UserTopicProgress.objects.filter(user__in=demo_users).delete()
            UserLessonProgress.objects.filter(user__in=demo_users).delete()

            # F. Delete stub lessons
            deleted_lessons_count = stub_lessons.count()
            stub_lessons.delete()

            # G. Delete demo users
            deleted_users_count = demo_users.count()
            demo_users.delete()

        self.stdout.write(self.style.SUCCESS(
            "\n=== TOZALASH MUVAFFAQIYATLI YAKUNLANDI ===\n"
            f"- O'chirilgan demo foydalanuvchilar: {deleted_users_count} ta\n"
            f"- O'chirilgan demo yechimlar: {deleted_subs_count} ta\n"
            f"- O'chirilgan test musobaqalar: {deleted_contests_count} ta\n"
            f"- O'chirilgan test ishtiroklari: {deleted_parts_count} ta\n"
            f"- Tozalangan qoralama darslar: {deleted_lessons_count} ta\n"
            f"- Saqlangan real foydalanuvchilar: {real_users.count()} ta (`santalat` to'liq saqlandi)\n"
            f"- Saqlangan real yechimlar: {real_submissions.count()} ta"
        ))

