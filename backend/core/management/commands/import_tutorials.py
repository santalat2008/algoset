"""
AlgoSet Management Command — import_tutorials
Automated ingestion system for high-quality, 100% Uzbek, Python-only competitive programming tutorials.

Features:
- Idempotent: multiple runs do not create duplicates
- Dry-run mode (--dry-run)
- Quality and Uzbek language validation (--validate-only)
- Automatic category -> topic -> lesson mapping
- Automatic problem linking to existing Problem models
- Source attribution and copyright preservation
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from core.models import (
    TopicCategory,
    Topic,
    Lesson,
    Problem,
    User,
    VisibilityStatus,
)
from core.curriculum_data import CURRICULUM_DATA
from core.content_validator import validate_lesson_content


class Command(BaseCommand):
    help = "Imports structured, 100% Uzbek Python competitive programming tutorials into AlgoSet."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulate the import process without modifying the database.",
        )
        parser.add_argument(
            "--validate-only",
            action="store_true",
            help="Run only the content quality and Uzbek language validator.",
        )
        parser.add_argument(
            "--publish",
            action="store_true",
            help="Publish imported lessons immediately (visibility=PUBLIC). Default is PUBLIC.",
        )
        parser.add_argument(
            "--category",
            type=str,
            default=None,
            help="Import only a specific category by slug (e.g. python-basics).",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        validate_only = options.get("validate_only", False)
        publish = options.get("publish", True)
        category_filter = options.get("category")

        self.stdout.write(self.style.MIGRATE_HEADING("=== AlgoSet O'quv Dasturi Import Tizimi ==="))
        if dry_run:
            self.stdout.write(self.style.WARNING("REJIM: Dry-run (ma'lumotlar bazasiga hech qanday o'zgarish kiritilmaydi)"))

        # 1. Validation pass
        validation_errors = 0
        total_lessons_checked = 0

        for cat_data in CURRICULUM_DATA:
            cat_slug = cat_data["category"]["slug"]
            if category_filter and cat_slug != category_filter:
                continue

            for topic_data in cat_data["topics"]:
                for lesson_data in topic_data.get("lessons", []):
                    total_lessons_checked += 1
                    is_valid, issues = validate_lesson_content(lesson_data)
                    if not is_valid:
                        validation_errors += 1
                        self.stdout.write(self.style.ERROR(
                            f"[XATO] '{lesson_data['slug']}': {', '.join(issues)}"
                        ))

        if validation_errors > 0:
            raise CommandError(
                f"Sifat validatsiyasidan o'tmadi! {total_lessons_checked} ta darsdan {validation_errors} tasida muammo aniqlandi."
            )
        self.stdout.write(self.style.SUCCESS(
            f"[OK] Sifat va o'zbek tili validatsiyasi muvaffaqiyatli yakunlandi ({total_lessons_checked} ta dars tekshirildi)."
        ))

        if validate_only:
            return

        # 2. Database Ingestion
        admin_user = User.objects.filter(role__in=[User.Role.ADMIN, User.Role.SUPERADMIN]).order_by("id").first()
        if not admin_user:
            admin_user = User.objects.first()

        visibility = VisibilityStatus.PUBLIC if publish else VisibilityStatus.PRIVATE

        cats_created, cats_updated = 0, 0
        topics_created, topics_updated = 0, 0
        lessons_created, lessons_updated = 0, 0
        problems_linked = 0

        with transaction.atomic():
            for cat_item in CURRICULUM_DATA:
                cat_info = cat_item["category"]
                cat_slug = cat_info["slug"]
                if category_filter and cat_slug != category_filter:
                    continue

                if not dry_run:
                    cat_obj, created = TopicCategory.objects.update_or_create(
                        slug=cat_slug,
                        defaults={
                            "icon": cat_info["icon"],
                            "group": cat_info["group"],
                            "title_uz": cat_info["title_uz"],
                            "title_en": cat_info["title_en"],
                            "description_uz": cat_info["description_uz"],
                            "description_en": cat_info["description_en"],
                            "order": cat_info["order"],
                            "is_active": True,
                        },
                    )
                    if created:
                        cats_created += 1
                    else:
                        cats_updated += 1
                else:
                    cat_exists = TopicCategory.objects.filter(slug=cat_slug).exists()
                    if cat_exists:
                        cats_updated += 1
                    else:
                        cats_created += 1
                    cat_obj = None

                for topic_info in cat_item["topics"]:
                    t_slug = topic_info["slug"]
                    t_defaults = {
                        "title_uz": topic_info["title_uz"],
                        "title_en": topic_info["title_en"],
                        "description_uz": topic_info["description_uz"],
                        "description_en": topic_info["description_en"],
                        "order": topic_info["order"],
                        "source_url": topic_info.get("source_url", ""),
                        "is_imported": True,
                        "visibility": VisibilityStatus.PUBLIC,
                    }
                    if not dry_run:
                        t_defaults["category"] = cat_obj
                        if admin_user:
                            t_defaults["created_by"] = admin_user
                        topic_obj, t_created = Topic.objects.update_or_create(
                            slug=t_slug,
                            defaults=t_defaults,
                        )
                        if t_created:
                            topics_created += 1
                        else:
                            topics_updated += 1
                    else:
                        t_exists = Topic.objects.filter(slug=t_slug).exists()
                        if t_exists:
                            topics_updated += 1
                        else:
                            topics_created += 1
                        topic_obj = None

                    for lesson_info in topic_info.get("lessons", []):
                        l_slug = lesson_info["slug"]
                        l_defaults = {
                            "title_uz": lesson_info["title_uz"],
                            "title_en": lesson_info["title_en"],
                            "summary_uz": lesson_info["summary_uz"],
                            "summary_en": lesson_info["summary_en"],
                            "content_uz": lesson_info["content_uz"],
                            "content_en": lesson_info.get("content_en", lesson_info["content_uz"]),
                            "order": lesson_info["order"],
                            "visibility": visibility,
                            "source_url": lesson_info.get("source_url", ""),
                            "source_author": lesson_info.get("source_author", ""),
                            "source_license": lesson_info.get("source_license", ""),
                            "is_imported": True,
                        }
                        if not dry_run:
                            l_defaults["topic"] = topic_obj
                            if admin_user:
                                l_defaults["created_by"] = admin_user
                            lesson_obj, l_created = Lesson.objects.update_or_create(
                                slug=l_slug,
                                defaults=l_defaults,
                            )
                            if l_created:
                                lessons_created += 1
                            else:
                                lessons_updated += 1

                            # Link related existing problems
                            prob_slugs = lesson_info.get("related_problem_slugs", [])
                            if prob_slugs:
                                matched_probs = Problem.objects.filter(slug__in=prob_slugs)
                                if matched_probs.exists():
                                    lesson_obj.related_problems.set(matched_probs)
                                    problems_linked += matched_probs.count()
                        else:
                            l_exists = Lesson.objects.filter(slug=l_slug).exists()
                            if l_exists:
                                lessons_updated += 1
                            else:
                                lessons_created += 1
                            prob_slugs = lesson_info.get("related_problem_slugs", [])
                            matched_count = Problem.objects.filter(slug__in=prob_slugs).count()
                            problems_linked += matched_count

            if dry_run:
                transaction.set_rollback(True)

        self.stdout.write(self.style.SUCCESS("\n=== IMPORT HISOBOTI ==="))
        self.stdout.write(f"Kategoriyalar: {cats_created} ta yangi, {cats_updated} ta yangilandi")
        self.stdout.write(f"Mavzular: {topics_created} ta yangi, {topics_updated} ta yangilandi")
        self.stdout.write(f"Darsliklar: {lessons_created} ta yangi, {lessons_updated} ta yangilandi")
        self.stdout.write(f"Bog'langan masalalar: {problems_linked} ta")
        if dry_run:
            self.stdout.write(self.style.WARNING("Simulyatsiya yakunlandi. Hech qanday ma'lumot o'zgarmadi."))
        else:
            self.stdout.write(self.style.SUCCESS("O'quv dasturi muvaffaqiyatli import qilindi!"))
