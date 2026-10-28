from datetime import timedelta
import os
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.utils.text import slugify
from core.models import (
    User,
    Tag,
    TopicCategory,
    Topic,
    UserTopicProgress,
    Lesson,
    UserLessonProgress,
    Problem,
    Contest,
    ContestParticipation,
    Submission,
    Discussion,
    DiscussionComment,
    VisibilityStatus,
)


class Command(BaseCommand):
    help = "Seeds AlgoSet with users, tags, dynamic categories, topics, skeleton problems, and contests."

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Force re-seed even if data exists")
        parser.add_argument(
            "--allow-insecure-seed",
            action="store_true",
            help="Allow seeding test accounts with default passwords in non-DEBUG environments",
        )

    def handle(self, *args, **options):
        force = options.get("force", False)
        allow_insecure = (
            options.get("allow_insecure_seed", False)
            or os.environ.get("ALLOW_INSECURE_SEED", "").lower() in ("true", "1")
        )

        if not settings.DEBUG and not allow_insecure:
            raise CommandError(
                "XAVFSIZLIK CHEKLOVI: Ishlab chiqarish (Production, DEBUG=False) muhitida standart test foydalanuvchilarini yaratish bloklangan! "
                "Faqat lokal rivojlantirishda (DEBUG=True) yoki --allow-insecure-seed bayrog'i bilan bajarish mumkin."
            )

        default_pwd = os.environ.get("SEED_DEFAULT_PASSWORD", "algoset123")

        if TopicCategory.objects.exists() and not force:
            self.stdout.write(self.style.SUCCESS("AlgoSet database already seeded. Cleaning starter codes..."))
            for p in Problem.objects.all():
                if "pass" not in p.starter_code and ":" in p.starter_code:
                    lines = p.starter_code.strip().splitlines()
                    sig_lines = [l for l in lines if l.strip().startswith("class") or l.strip().startswith("def")]
                    if sig_lines:
                        p.starter_code = "\n".join(sig_lines) + "\n        pass\n"
                        p.save()
            return

        TopicCategory.objects.all().delete()
        Lesson.objects.all().delete()
        Problem.objects.all().delete()
        Contest.objects.all().delete()

        superadmin, _ = User.objects.get_or_create(
            username="superadmin",
            defaults={
                "email": "superadmin@algoset.uz",
                "role": User.Role.SUPERADMIN,
                "is_email_verified": True,
                "rating": 2100,
                "xp": 3500,
            },
        )
        superadmin.set_password(os.environ.get("SEED_SUPERADMIN_PASSWORD", default_pwd))
        superadmin.role = User.Role.SUPERADMIN
        superadmin.is_email_verified = True
        superadmin.save()

        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@algoset.uz",
                "role": User.Role.ADMIN,
                "is_email_verified": True,
                "rating": 1850,
                "xp": 2400,
            },
        )
        admin_user.set_password(os.environ.get("SEED_ADMIN_PASSWORD", default_pwd))
        admin_user.role = User.Role.ADMIN
        admin_user.is_email_verified = True
        admin_user.save()

        author_user, _ = User.objects.get_or_create(
            username="author",
            defaults={
                "email": "author@algoset.uz",
                "role": User.Role.AUTHOR,
                "is_email_verified": True,
                "rating": 1650,
                "xp": 1800,
            },
        )
        author_user.set_password(os.environ.get("SEED_AUTHOR_PASSWORD", default_pwd))
        author_user.role = User.Role.AUTHOR
        author_user.is_email_verified = True
        author_user.save()

        student_user, _ = User.objects.get_or_create(
            username="student",
            defaults={
                "email": "student@algoset.uz",
                "role": User.Role.STUDENT,
                "is_email_verified": True,
                "rating": 1420,
                "xp": 1340,
                "streak_days": 7,
                "last_active_date": timezone.localdate(),
            },
        )
        student_user.set_password(os.environ.get("SEED_STUDENT_PASSWORD", default_pwd))
        student_user.role = User.Role.STUDENT
        student_user.is_email_verified = True
        student_user.save()

        tag_names = [
            "Arrays", "Strings", "Linked List", "Stack & Queue", "Tree",
            "Graph", "DP", "Greedy", "Binary Search", "Two Pointers",
            "Hash Table", "Math", "Sliding Window", "Sorting", "Others"
        ]
        tag_map = {}
        for idx, tname in enumerate(tag_names, start=1):
            tag_obj, _ = Tag.objects.get_or_create(
                slug=slugify(tname),
                defaults={"name": tname, "order": idx}
            )
            tag_map[tname] = tag_obj

        categories_data = [
            {
                "slug": "python-basics",
                "icon": "terminal",
                "group": "Python",
                "title_uz": "Python Asoslari",
                "title_en": "Python Basics",
                "description_uz": "O'zgaruvchilar, ma'lumot turlari, tezkor I/O, sikllar, shart operatorlari va funksiyalar.",
                "description_en": "Variables, data types, input/output, loops, conditions, functions, modules.",
                "topics": [
                    {
                        "slug": "variables-and-data-types",
                        "title_uz": "O'zgaruvchilar, Ma'lumot turlari va Tezkor Kiritish-Chiqarish",
                        "title_en": "Variables, Data Types & Fast I/O",
                        "content_uz": "<p>Python dinamik tiplashga ega til. Musobaqalarda katta hajmdagi ma'lumotlarni tez o'qish uchun <code>sys.stdin.readline</code> dan foydalanish zarur.</p>",
                        "content_en": "<p>Python is dynamically typed. Use <code>sys.stdin.readline</code> for fast input parsing in competitive programming.</p>",
                    },
                    {
                        "slug": "control-flow-and-loops",
                        "title_uz": "Shart operatorlari, Sikllar va Ro'yxat generatorlari",
                        "title_en": "Loops and Conditionals",
                        "content_uz": "<p>for va while sikllari, enumerate, zip hamda list comprehensions yordamida kodni optimallashtirish.</p>",
                        "content_en": "<p>For and while loops control execution flow with list comprehensions.</p>",
                    },
                ],
            },
            {
                "slug": "python-classes",
                "icon": "box",
                "group": "Python OOP",
                "title_uz": "Python OOP va Klasslar",
                "title_en": "Python Classes",
                "description_uz": "OOP tamoyillari, obyektlar, konstruktorlar, merosxo'rlik va dunder metodlar.",
                "description_en": "OOP concepts, classes, objects, constructors, inheritance, polymorphism.",
                "topics": [
                    {
                        "slug": "oop-fundamentals",
                        "title_uz": "Klasslar, Obyektlar va Dunder Metodlar",
                        "title_en": "Classes, Objects & Dunder Methods",
                        "content_uz": "<p>Prioritetli navbat (heapq) va solishtirishlar uchun <code>__lt__</code> metodini moslashtirish.</p>",
                        "content_en": "<p>Customize comparisons with <code>__lt__</code> for priority queues.</p>",
                    }
                ],
            },
            {
                "slug": "python-dsa",
                "icon": "share-2",
                "group": "Ma'lumotlar Tuzilmalari",
                "title_uz": "Ma'lumotlar Tuzilmalari",
                "title_en": "Python DSA",
                "description_uz": "Massivlar, navbatlar (deque), bog'langan ro'yxatlar, daraxtlar va xesh-jadvallar.",
                "description_en": "Arrays, stacks, queues, linked lists, trees, graphs, heaps, hash tables.",
                "topics": [
                    {
                        "slug": "arrays-and-hash-tables",
                        "title_uz": "Massivlar, Deque va Xesh-jadvallar (Hash Tables)",
                        "title_en": "Arrays, Deques & Hash Tables",
                        "content_uz": "<p>Lug'at (dict) va to'plam (set) orqali O(1) o'rtacha vaqtda qidirish imkoniyati.</p>",
                        "content_en": "<p>Dictionary lookups in Python run in O(1) average time complexity.</p>",
                    }
                ],
            },
            {
                "slug": "algorithms",
                "icon": "cpu",
                "group": "Algoritmlar",
                "title_uz": "Algoritmlar",
                "title_en": "Algorithms",
                "description_uz": "Saralash, ikkilik qidiruv, ikki ko'rsatkich, ochko'z algoritmlar va dinamik dasturlash.",
                "description_en": "Sorting, binary search, two pointers, sliding window, greedy, DP, graph algos.",
                "topics": [
                    {
                        "slug": "binary-search-and-two-pointers",
                        "title_uz": "Ikkilik qidiruv (Binary Search) va Ikki ko'rsatkich uslubi",
                        "title_en": "Binary Search & Two Pointers",
                        "content_uz": "<p>Tartiblangan massivda O(log N) vaqtda qidirish hamda ikki ko'rsatkich yordamida O(N) yechimlar.</p>",
                        "content_en": "<p>Search over a sorted space in O(log N) time with two pointers.</p>",
                    },
                    {
                        "slug": "dynamic-programming-basics",
                        "title_uz": "Dinamik Dasturlash Asoslari (DP)",
                        "title_en": "Dynamic Programming Basics",
                        "content_uz": "<p>Memoization va Tabulation usullari orqali eksponensial masalalarni ko'phadli vaqtda yechish.</p>",
                        "content_en": "<p>Dynamic programming with memoization and tabulation patterns.</p>",
                    }
                ],
            },
            {
                "slug": "advanced-python",
                "icon": "sparkles",
                "group": "Murakkab Mavzular",
                "title_uz": "Murakkab Mavzular",
                "title_en": "Advanced Python",
                "description_uz": "Iteratorlar, generatorlar, dekoratorlar, xotira boshqaruvi va asinxron dasturlash.",
                "description_en": "Iterators, generators, decorators, memory management and asyncio.",
                "topics": [
                    {
                        "slug": "iterators-and-generators",
                        "title_uz": "Iteratorlar va Generatorlar (yield)",
                        "title_en": "Iterators & Generators",
                        "content_uz": "<p>Generatorlar (yield) orqali katta oqimli ma'lumotlarni xotirada tejab qayta ishlash.</p>",
                        "content_en": "<p>Stream large datasets with minimal memory footprint using generator functions.</p>",
                    }
                ],
            },
        ]

        created_topics = []
        for idx, cat_item in enumerate(categories_data, start=1):
            cat = TopicCategory.objects.create(
                slug=cat_item["slug"],
                icon=cat_item["icon"],
                group=cat_item["group"],
                title_uz=cat_item["title_uz"],
                title_en=cat_item["title_en"],
                description_uz=cat_item["description_uz"],
                description_en=cat_item["description_en"],
                order=idx,
            )
            for tidx, top_item in enumerate(cat_item["topics"], start=1):
                t = Topic.objects.create(
                    category=cat,
                    slug=top_item["slug"],
                    title_uz=top_item["title_uz"],
                    title_en=top_item["title_en"],
                    content_uz=top_item["content_uz"],
                    content_en=top_item["content_en"],
                    created_by=admin_user,
                    order=tidx,
                )
                created_topics.append(t)

        if created_topics:
            UserTopicProgress.objects.create(
                user=student_user, topic=created_topics[0], is_completed=True
            )

        problems_data = [
            {
                "slug": "two-sum",
                "title_uz": "Two Sum (Ikkita son yig'indisi)",
                "title_en": "Two Sum",
                "difficulty": Problem.Difficulty.EASY,
                "tags": ["Arrays", "Hash Table"],
                "statement": "<p>Butun sonlardan iborat <code>nums</code> massivi va <code>target</code> butun soni berilgan. Yig'indisi <code>target</code> ga teng bo'lgan ikkita sonning indekslarini massiv ko'rinishida qaytaring.</p><p>Har doim aniq <strong>bitta to'g'ri yechim</strong> mavjud deb hisoblashingiz mumkin. Bitta elementdan ikki marta foydalanish taqiqlanadi.</p>",
                "starter_code": "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        pass\n",
                "sample": [{"input": "[2, 7, 11, 15]\n9", "output": "[0, 1]"}],
                "hidden": [{"input": "[3, 2, 4]\n6", "output": "[1, 2]"}],
                "solved": 1200,
                "subs": 1225,
            },
            {
                "slug": "reverse-integer",
                "title_uz": "Butun sonni teskari qilish",
                "title_en": "Reverse Integer",
                "difficulty": Problem.Difficulty.EASY,
                "tags": ["Math", "Strings"],
                "statement": "<p>Berilgan 32-bitli ishorali <code>x</code> butun sonining raqamlarini teskari tartibda qaytaring.</p>",
                "starter_code": "class Solution:\n    def reverse(self, x: int) -> int:\n        pass\n",
                "sample": [{"input": "123", "output": "321"}],
                "hidden": [{"input": "-450", "output": "-54"}],
                "solved": 980,
                "subs": 1065,
            },
            {
                "slug": "longest-substring-without-repeating-characters",
                "title_uz": "Eng uzun takrorlanmas qism-satr",
                "title_en": "Longest Substring Without Repeating Characters",
                "difficulty": Problem.Difficulty.MEDIUM,
                "tags": ["Strings", "Sliding Window"],
                "statement": "<p>Berilgan <code>s</code> satridan takrorlanuvchi belgilari bo'lmagan eng uzun qism-satrning uzunligini toping.</p>",
                "starter_code": "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass\n",
                "sample": [{"input": "\"abcabcbb\"", "output": "3"}],
                "hidden": [{"input": "\"pwwkew\"", "output": "3"}],
                "solved": 762,
                "subs": 880,
            },
            {
                "slug": "merge-intervals",
                "title_uz": "Intervallarni birlashtirish",
                "title_en": "Merge Intervals",
                "difficulty": Problem.Difficulty.MEDIUM,
                "tags": ["Arrays", "Sorting"],
                "statement": "<p>Oraliqlar (intervallar) massivi berilgan. Kesishuvchi barcha oraliqlarni birlashtirib, hosil bo'lgan oraliqlar sonini qaytaring.</p>",
                "starter_code": "class Solution:\n    def merge(self, intervals: list[list[int]]) -> int:\n        pass\n",
                "sample": [{"input": "[[1, 3], [2, 6], [8, 10], [15, 18]]", "output": "3"}],
                "hidden": [{"input": "[[1, 4], [4, 5]]", "output": "1"}],
                "solved": 403,
                "subs": 497,
            },
            {
                "slug": "binary-search",
                "title_uz": "Ikkilik qidiruv (Binary Search)",
                "title_en": "Binary Search",
                "difficulty": Problem.Difficulty.EASY,
                "tags": ["Binary Search", "Arrays"],
                "statement": "<p>O'sish tartibida saralangan <code>nums</code> massivi va <code>target</code> butun soni berilgan. Agar target massivda mavjud bo'lsa uning indeksini, aks holda -1 qaytaring. Vaqt murakkabligi O(log N) bo'lishi shart.</p>",
                "starter_code": "class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        pass\n",
                "sample": [{"input": "[-1, 0, 3, 5, 9, 12]\n9", "output": "4"}],
                "hidden": [{"input": "[-1, 0, 3, 5, 9, 12]\n2", "output": "-1"}],
                "solved": 621,
                "subs": 660,
            },
            {
                "slug": "maximum-subarray",
                "title_uz": "Maksimal qism-massiv yig'indisi",
                "title_en": "Maximum Subarray",
                "difficulty": Problem.Difficulty.MEDIUM,
                "tags": ["Arrays", "DP"],
                "statement": "<p>Butun sonlardan iborat <code>nums</code> massivi berilgan. Eng katta yig'indiga ega bo'lgan uzluksiz qism-massivni toping va uning yig'indisini qaytaring (Kadane algoritmi).</p>",
                "starter_code": "class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        pass\n",
                "sample": [{"input": "[-2, 1, -3, 4, -1, 2, 1, -5, 4]", "output": "6"}],
                "hidden": [{"input": "[5, 4, -1, 7, 8]", "output": "23"}],
                "solved": 512,
                "subs": 580,
            },
        ]

        created_problems = []
        for p in problems_data:
            prob = Problem.objects.create(
                slug=p["slug"],
                title_uz=p["title_uz"],
                title_en=p["title_en"],
                statement_uz=p["statement"],
                statement_en=p["statement"],
                difficulty=p["difficulty"],
                starter_code=p["starter_code"],
                sample_test_cases=p["sample"],
                hidden_test_cases=p["hidden"],
                author=author_user,
                visibility=VisibilityStatus.PUBLIC,
                solved_count=p["solved"],
                submission_count=p["subs"],
            )
            for tname in p["tags"]:
                if tname in tag_map:
                    prob.tags.add(tag_map[tname])
            created_problems.append(prob)

        # Create Sample Lessons under Topics
        if created_topics and created_problems:
            t1 = created_topics[0]
            l1 = Lesson.objects.create(
                topic=t1,
                slug="intro-to-variables",
                title_uz="Python o'zgaruvchilari va asosiy ma'lumot turlari",
                title_en="Variables and Primitive Data Types in Python",
                summary_uz="O'zgaruvchilar, dinamik tiplash, int, float, str, bool turlari.",
                summary_en="Variables, dynamic typing, primitive types in Python.",
                content_uz="<p>Python tilida o'zgaruvchilar avtomatik tarzda e'lon qilinadi.</p><pre><code>x = 42\ny = 'AlgoSet'</code></pre>",
                content_en="<p>Variables in Python are dynamically typed.</p><pre><code>x = 42\ny = 'AlgoSet'</code></pre>",
                order=1,
                visibility=VisibilityStatus.PUBLIC,
                created_by=admin_user,
            )
            l1.related_problems.set([created_problems[0]])

            l2 = Lesson.objects.create(
                topic=t1,
                slug="fast-io-techniques",
                title_uz="Tezkor kiritish va chiqarish (Fast I/O)",
                title_en="Fast I/O Techniques for Competitive Programming",
                summary_uz="sys.stdin.readline orqali TLE xatoligining oldini olish.",
                summary_en="Prevent Time Limit Exceeded using sys.stdin.readline.",
                content_uz="<p>Musobaqalarda 100,000+ qatorli testlarni o'qish uchun <code>sys.stdin.readline</code> dan foydalaning.</p>",
                content_en="<p>Use <code>sys.stdin.readline</code> for fast input parsing in competitive programming.</p>",
                order=2,
                visibility=VisibilityStatus.PUBLIC,
                created_by=admin_user,
            )

            if len(created_topics) > 1:
                t2 = created_topics[1]
                l3 = Lesson.objects.create(
                    topic=t2,
                    slug="loops-and-comprehensions",
                    title_uz="Sikllar va List Comprehensions",
                    title_en="Loops and List Comprehensions",
                    summary_uz="For va while sikllari hamda ixcham ro'yxat generatorlari.",
                    summary_en="For/while loops and list comprehension syntax.",
                    content_uz="<p>Ro'yxat generatorlari kodni yanada ixcham va tez qiladi.</p><pre><code>evens = [x for x in range(10) if x % 2 == 0]</code></pre>",
                    content_en="<p>List comprehensions make code clean and performant.</p><pre><code>evens = [x for x in range(10) if x % 2 == 0]</code></pre>",
                    order=1,
                    visibility=VisibilityStatus.PUBLIC,
                    created_by=author_user,
                )
                l3.related_problems.set([created_problems[1]])

            # Private draft lesson
            Lesson.objects.create(
                topic=t1,
                slug="draft-advanced-memory-profiling",
                title_uz="Xotira profilaktikasi va optimallashtirish (Qoralama)",
                title_en="Advanced Memory Profiling (Draft)",
                summary_uz="Muallif tomonidan tayyorlanayotgan xususiy dars.",
                summary_en="Private draft lesson being prepared by author.",
                content_uz="<p>Ushbu dars hozirda tahrirlanmoqda.</p>",
                content_en="<p>This lesson is currently a private draft.</p>",
                order=3,
                visibility=VisibilityStatus.PRIVATE,
                created_by=author_user,
            )

        now = timezone.now()
        upcoming_contest = Contest.objects.create(
            slug="weekly-python-contest-12",
            title_uz="Haftalik Python Musobaqasi #12",
            title_en="Weekly Python Contest #12",
            announcement_uz="O'zbekiston dasturchilari o'rtasidagi haftalik reytingli musobaqa.",
            announcement_en="Weekly algorithmic competition for Python programmers.",
            rules_uz="1. Barcha yechimlar avtomatik tizim tomonidan tekshiriladi.\n2. Boshqa ishtirokchilar bilan kod almashish taqiqlanadi.",
            rules_en="1. All submissions are automatically evaluated.\n2. Sharing code with others is strictly prohibited.",
            division=Contest.Division.DIV2,
            is_rated=True,
            start_time=now + timedelta(days=2),
            duration_minutes=120,
            author=author_user,
            visibility=VisibilityStatus.PUBLIC,
            ratings_calculated=False,
            problem_order=[
                {"problem_id": created_problems[i].id, "order": i + 1, "points": 100 * (i + 1)}
                for i in range(min(4, len(created_problems)))
            ],
        )
        upcoming_contest.problems.set(created_problems[:4])

        ongoing_contest = Contest.objects.create(
            slug="monthly-algorithm-challenge",
            title_uz="Oylik Algoritmlar Chempionati",
            title_en="Monthly Algorithm Challenge",
            announcement_uz="Div 1 qatnashchilari uchun oylik qizg'in musobaqa.",
            announcement_en="Monthly challenge for advanced algorithmists.",
            rules_uz="1. ICPC qoidalari asosida ballar hisoblanadi.\n2. Jarima vaqti: har bir rad etilgan urinish uchun 20 daqiqa.",
            rules_en="1. Scored according to standard ICPC rules.\n2. 20 minutes penalty per rejected submission.",
            division=Contest.Division.DIV1,
            is_rated=True,
            start_time=now - timedelta(minutes=30),
            duration_minutes=180,
            author=admin_user,
            visibility=VisibilityStatus.PUBLIC,
            ratings_calculated=False,
            problem_order=[
                {"problem_id": created_problems[i].id, "order": i - 1, "points": 150 * (i - 1)}
                for i in range(2, min(6, len(created_problems)))
            ],
        )
        ongoing_contest.problems.set(created_problems[2:6])

        past_contest = Contest.objects.create(
            slug="beginner-contest",
            title_uz="Boshlang'ich Dasturchilar Musobaqasi",
            title_en="Beginner Contest",
            announcement_uz="Algoritmlarga endi qadam qo'ygan talabalar uchun sinov musobaqasi.",
            announcement_en="Educational contest for beginner problem solvers.",
            rules_uz="1. Reyting hisoblanmaydi.\n2. Har bir masala uchun yechimlar tahlili mavjud.",
            rules_en="1. Unrated educational contest.\n2. Editorial available after contest.",
            division=Contest.Division.EDUCATIONAL,
            is_rated=False,
            start_time=now - timedelta(days=3),
            duration_minutes=120,
            author=author_user,
            visibility=VisibilityStatus.PUBLIC,
            ratings_calculated=True,
            problem_order=[
                {"problem_id": created_problems[i].id, "order": i + 1, "points": 100}
                for i in range(min(3, len(created_problems)))
            ],
        )
        past_contest.problems.set(created_problems[:3])

        p1 = ContestParticipation.objects.create(
            contest=past_contest,
            user=student_user,
            score=300,
            penalty_minutes=45,
            rating_before=1400,
            rating_after=1420,
            rank=1,
        )
        p1.solved_problems.set(created_problems[:3])

        p2 = ContestParticipation.objects.create(
            contest=past_contest,
            user=author_user,
            score=200,
            penalty_minutes=30,
            rating_before=1650,
            rating_after=1650,
            rank=2,
        )
        p2.solved_problems.set(created_problems[:2])

        self.stdout.write(self.style.SUCCESS("AlgoSet database re-seeded successfully with clean skeleton starter codes and dynamic categories!"))
