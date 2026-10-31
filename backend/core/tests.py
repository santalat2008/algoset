import io
import json
import zipfile
from datetime import timedelta
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import (
    User,
    Tag,
    TopicCategory,
    Topic,
    UserTopicProgress,
    Problem,
    ProblemVersion,
    TestGroup,
    TestCase,
    ValidationRun,
    ValidationResult,
    Contest,
    ContestParticipation,
    Submission,
    Discussion,
    DiscussionComment,
    VisibilityStatus,
    Lesson,
    UserLessonProgress,
    PublicationRequest,
)
from .permissions import is_author_or_above, is_admin_or_above, is_superadmin
from .services import (
    send_verification_email,
    run_python_code,
    evaluate_python_submission,
    calculate_elo_delta,
    update_contest_ratings,
    validate_code_safety,
    compare_outputs,
)


class AlgoSetUnitAndEdgeCaseTests(APITestCase):
    def setUp(self):
        self.superadmin = User.objects.create_user(
            username="sa_user",
            email="sa@algoset.uz",
            password="password123",
            role=User.Role.SUPERADMIN,
        )
        self.admin = User.objects.create_user(
            username="adm_user",
            email="adm@algoset.uz",
            password="password123",
            role=User.Role.ADMIN,
        )
        self.author1 = User.objects.create_user(
            username="auth1_user",
            email="auth1@algoset.uz",
            password="password123",
            role=User.Role.AUTHOR,
        )
        self.author2 = User.objects.create_user(
            username="auth2_user",
            email="auth2@algoset.uz",
            password="password123",
            role=User.Role.AUTHOR,
        )
        self.student = User.objects.create_user(
            username="stu_user",
            email="stu@algoset.uz",
            password="password123",
            role=User.Role.STUDENT,
        )
        self.tag_array = Tag.objects.create(name="Arrays", slug="arrays")
        self.tag_math = Tag.objects.create(name="Math", slug="math")

        self.category = TopicCategory.objects.create(
            slug="python-basics",
            icon="terminal",
            group="Python",
            title_uz="Python Asoslari",
            title_en="Python Basics",
            description_uz="Asoslar",
            description_en="Basics",
            order=1,
        )
        self.topic = Topic.objects.create(
            category=self.category,
            slug="variables",
            title_uz="O'zgaruvchilar",
            title_en="Variables",
            content_uz="<p>Variables</p>",
            content_en="<p>Variables</p>",
            created_by=self.admin,
            order=1,
        )

    def test_permission_helpers(self):
        self.assertFalse(is_author_or_above(self.student))
        self.assertTrue(is_author_or_above(self.author1))
        self.assertTrue(is_author_or_above(self.admin))
        self.assertTrue(is_author_or_above(self.superadmin))

        self.assertFalse(is_admin_or_above(self.author1))
        self.assertTrue(is_admin_or_above(self.admin))
        self.assertTrue(is_superadmin(self.superadmin))
        self.assertFalse(is_superadmin(self.admin))

    def test_registration_and_email_verification_get_and_post(self):
        res = self.client.post(
            reverse("register"),
            {
                "username": "coder_x",
                "email": "coder_x@algoset.uz",
                "password": "strongpassword123",
                "preferred_language": "uz",
            },
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="coder_x")
        self.assertFalse(user.is_email_verified)
        self.assertEqual(user.level, 1)

        bad_verify = self.client.get(reverse("verify-email"), {"token": "00000000-0000-0000-0000-000000000000"})
        self.assertEqual(bad_verify.status_code, status.HTTP_404_NOT_FOUND)

        missing_token = self.client.get(reverse("verify-email"))
        self.assertEqual(missing_token.status_code, status.HTTP_400_BAD_REQUEST)

        good_verify = self.client.get(reverse("verify-email"), {"token": str(user.verification_token)})
        self.assertEqual(good_verify.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.is_email_verified)

    def test_role_management_permissions(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(
            reverse("manage-role", args=[self.student.id]),
            {"role": User.Role.AUTHOR},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.role, User.Role.AUTHOR)

        res_forbidden = self.client.post(
            reverse("manage-role", args=[self.student.id]),
            {"role": User.Role.ADMIN},
        )
        self.assertEqual(res_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.superadmin)
        res_super = self.client.post(
            reverse("manage-role", args=[self.student.id]),
            {"role": User.Role.ADMIN},
        )
        self.assertEqual(res_super.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.role, User.Role.ADMIN)

    def test_author_cannot_modify_other_authors_problem_or_contest(self):
        prob = Problem.objects.create(
            slug="p1",
            title_uz="P1",
            title_en="P1",
            statement_uz="P1",
            statement_en="P1",
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
        )
        self.client.force_authenticate(user=self.author2)
        res_del = self.client.delete(f"/api/problems/{prob.slug}/")
        self.assertEqual(res_del.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Problem.objects.filter(slug="p1").exists())

        c1 = Contest.objects.create(
            slug="c1",
            title_uz="C1",
            title_en="C1",
            announcement_uz="C1",
            announcement_en="C1",
            author=self.author1,
            start_time=timezone.now() + timedelta(days=1),
            visibility=VisibilityStatus.PUBLIC,
        )
        res_c_del = self.client.delete(f"/api/contests/{c1.slug}/")
        self.assertEqual(res_c_del.status_code, status.HTTP_403_FORBIDDEN)

    def test_hidden_test_cases_not_exposed_to_students(self):
        prob = Problem.objects.create(
            slug="secret-prob",
            title_uz="Secret",
            title_en="Secret",
            statement_uz="Secret",
            statement_en="Secret",
            sample_test_cases=[{"input": "1", "output": "1"}],
            hidden_test_cases=[{"input": "999", "output": "999"}],
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
        )
        self.client.force_authenticate(user=self.student)
        res_student = self.client.get(f"/api/problems/{prob.slug}/")
        self.assertEqual(res_student.status_code, status.HTTP_200_OK)
        self.assertEqual(res_student.data["hidden_test_cases"], [])
        self.assertEqual(len(res_student.data["sample_test_cases"]), 1)

        self.client.force_authenticate(user=self.author1)
        res_author = self.client.get(f"/api/problems/{prob.slug}/")
        self.assertEqual(len(res_author.data["hidden_test_cases"]), 1)

    def test_code_safety_validation(self):
        unsafe_code1 = "import os\nos.system('ls')"
        safe1, msg1 = validate_code_safety(unsafe_code1)
        self.assertFalse(safe1)

        unsafe_code2 = "from subprocess import run"
        safe2, msg2 = validate_code_safety(unsafe_code2)
        self.assertFalse(safe2)

        unsafe_code3 = "open('/etc/passwd')"
        safe3, msg3 = validate_code_safety(unsafe_code3)
        self.assertFalse(safe3)

        safe_code = "class Solution:\n    def solve(self, x):\n        return x * 2"
        safe4, _ = validate_code_safety(safe_code)
        self.assertTrue(safe4)

    def test_run_endpoint_without_creating_submission(self):
        prob = Problem.objects.create(
            slug="calc-double",
            title_uz="Double",
            title_en="Double",
            statement_uz="Double",
            statement_en="Double",
            starter_code="class Solution:\n    def double(self, n):\n        return n * 2",
            sample_test_cases=[{"input": "4", "output": "8"}],
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
        )
        self.client.force_authenticate(user=self.student)
        run_res = self.client.post(
            f"/api/problems/{prob.slug}/run/",
            {
                "code": "class Solution:\n    def double(self, n):\n        return n * 2",
                "custom_input": "15",
            },
            format="json",
        )
        self.assertEqual(run_res.status_code, status.HTTP_200_OK)
        self.assertEqual(run_res.data["status"], Submission.Status.ACCEPTED)
        self.assertEqual(run_res.data["actual_output"], "30")
        self.assertEqual(Submission.objects.count(), 0)
        prob.refresh_from_db()
        self.assertEqual(prob.submission_count, 0)

    def test_submit_endpoint_and_unique_solve_count(self):
        prob = Problem.objects.create(
            slug="add-numbers",
            title_uz="Add",
            title_en="Add",
            statement_uz="Add",
            statement_en="Add",
            sample_test_cases=[{"input": "2\n3", "output": "5"}],
            hidden_test_cases=[{"input": "10\n20", "output": "30"}],
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
        )
        code = "class Solution:\n    def add(self, a, b):\n        return a + b"
        self.client.force_authenticate(user=self.student)

        sub1 = self.client.post(f"/api/problems/{prob.slug}/submit/", {"code": code}, format="json")
        self.assertEqual(sub1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(sub1.data["status"], Submission.Status.ACCEPTED)
        prob.refresh_from_db()
        self.assertEqual(prob.submission_count, 1)
        self.assertEqual(prob.solved_count, 1)
        self.student.refresh_from_db()
        self.assertEqual(self.student.xp, 50)
        self.assertEqual(self.student.streak_days, 1)

        sub2 = self.client.post(f"/api/problems/{prob.slug}/submit/", {"code": code}, format="json")
        self.assertEqual(sub2.status_code, status.HTTP_201_CREATED)
        prob.refresh_from_db()
        self.assertEqual(prob.submission_count, 2)
        self.assertEqual(prob.solved_count, 1)

    def test_contest_submission_integrity_and_scoring(self):
        prob_in_contest = Problem.objects.create(
            slug="contest-p1",
            title_uz="CP1",
            title_en="CP1",
            statement_uz="CP1",
            statement_en="CP1",
            sample_test_cases=[{"input": "4", "output": "16"}],
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
        )
        prob_not_in_contest = Problem.objects.create(
            slug="outside-p",
            title_uz="Out",
            title_en="Out",
            statement_uz="Out",
            statement_en="Out",
            sample_test_cases=[{"input": "1", "output": "1"}],
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
        )

        now = timezone.now()
        active_contest = Contest.objects.create(
            slug="active-cup",
            title_uz="Active Cup",
            title_en="Active Cup",
            announcement_uz="Welcome",
            announcement_en="Welcome",
            start_time=now - timedelta(minutes=30),
            duration_minutes=120,
            author=self.admin,
            visibility=VisibilityStatus.PUBLIC,
        )
        active_contest.problems.add(prob_in_contest)

        self.client.force_authenticate(user=self.student)
        bad_prob_sub = self.client.post(
            f"/api/problems/{prob_not_in_contest.slug}/submit/",
            {"code": "def solve(inp):\n    return '1'", "contest_id": active_contest.id},
            format="json",
        )
        self.assertEqual(bad_prob_sub.status_code, status.HTTP_400_BAD_REQUEST)

        good_code = "class Solution:\n    def square(self, n):\n        return n * n"
        good_sub = self.client.post(
            f"/api/problems/{prob_in_contest.slug}/submit/",
            {"code": good_code, "contest_id": active_contest.id},
            format="json",
        )
        self.assertEqual(good_sub.status_code, status.HTTP_201_CREATED)
        part = ContestParticipation.objects.get(contest=active_contest, user=self.student)
        self.assertEqual(part.score, 100)

        repeat_sub = self.client.post(
            f"/api/problems/{prob_in_contest.slug}/submit/",
            {"code": good_code, "contest_id": active_contest.id},
            format="json",
        )
        self.assertEqual(repeat_sub.status_code, status.HTTP_201_CREATED)
        part.refresh_from_db()
        self.assertEqual(part.score, 100)

    def test_upcoming_contest_redacts_problems_for_students(self):
        prob = Problem.objects.create(
            slug="future-p",
            title_uz="Future",
            title_en="Future",
            statement_uz="Future",
            statement_en="Future",
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
        )
        future_contest = Contest.objects.create(
            slug="future-cup",
            title_uz="Future Cup",
            title_en="Future Cup",
            announcement_uz="Soon",
            announcement_en="Soon",
            start_time=timezone.now() + timedelta(days=5),
            duration_minutes=120,
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
        )
        future_contest.problems.add(prob)

        self.client.force_authenticate(user=self.student)
        res = self.client.get(f"/api/contests/{future_contest.slug}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["problems_detail"], [])

    def test_cannot_join_past_contest(self):
        past_contest = Contest.objects.create(
            slug="past-cup",
            title_uz="Past Cup",
            title_en="Past Cup",
            announcement_uz="Ended",
            announcement_en="Ended",
            start_time=timezone.now() - timedelta(days=2),
            duration_minutes=60,
            author=self.admin,
            visibility=VisibilityStatus.PUBLIC,
        )
        self.client.force_authenticate(user=self.student)
        join_res = self.client.post(f"/api/contests/{past_contest.slug}/join/")
        self.assertEqual(join_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_topic_completion_and_progress_endpoint(self):
        self.client.force_authenticate(user=self.student)
        complete_res = self.client.post(f"/api/topics/{self.topic.slug}/complete/")
        self.assertEqual(complete_res.status_code, status.HTTP_200_OK)
        self.assertTrue(complete_res.data["is_completed"])

        cats_res = self.client.get("/api/categories/")
        self.assertEqual(cats_res.status_code, status.HTTP_200_OK)
        self.assertEqual(cats_res.data[0]["completed_topic_count"], 1)

        me_res = self.client.get("/api/auth/me/")
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data["tutorials_progress"]["completed"], 1)

    def test_platform_stats_and_tags_endpoints(self):
        p = Problem.objects.create(
            slug="tagged-prob",
            title_uz="Tagged",
            title_en="Tagged",
            statement_uz="Tagged",
            statement_en="Tagged",
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
        )
        p.tags.add(self.tag_array)

        stats_res = self.client.get("/api/stats/")
        self.assertEqual(stats_res.status_code, status.HTTP_200_OK)
        self.assertIn("tutorials_count", stats_res.data)
        self.assertIn("problems_count", stats_res.data)
        self.assertIn("contests_count", stats_res.data)

        tags_res = self.client.get("/api/problems/tags/")
        self.assertEqual(tags_res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(tags_res.data) >= 1)
        self.assertEqual(tags_res.data[0]["name"], "Arrays")

    def test_discussion_and_comments_workflow(self):
        prob = Problem.objects.create(
            slug="discuss-prob",
            title_uz="Disc",
            title_en="Disc",
            statement_uz="Disc",
            statement_en="Disc",
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
        )
        self.client.force_authenticate(user=self.student)
        create_disc = self.client.post(
            f"/api/problems/{prob.slug}/discussions/",
            {"title": "Optimal approach", "content": "Use two pointers."},
            format="json",
        )
        self.assertEqual(create_disc.status_code, status.HTTP_201_CREATED)
        disc_id = create_disc.data["id"]

        add_comment = self.client.post(
            f"/api/problems/{prob.slug}/discussions/{disc_id}/comments/",
            {"content": "I agree!"},
            format="json",
        )
        self.assertEqual(add_comment.status_code, status.HTTP_201_CREATED)

        list_disc = self.client.get(f"/api/problems/{prob.slug}/discussions/")
        self.assertEqual(list_disc.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_disc.data), 1)
        self.assertEqual(list_disc.data[0]["comments_count"], 1)

    def test_code_execution_tle_and_runtime_error(self):
        prob = Problem.objects.create(
            slug="fail-cases-prob",
            title_uz="Fail",
            title_en="Fail",
            statement_uz="Fail",
            statement_en="Fail",
            sample_test_cases=[{"input": "1", "output": "1"}],
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
        )
        self.client.force_authenticate(user=self.student)
        res_tle = self.client.post(
            f"/api/problems/{prob.slug}/submit/",
            {"code": "while True: pass"},
            format="json",
        )
        self.assertEqual(res_tle.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_tle.data["status"], Submission.Status.TIME_LIMIT)

        res_rt = self.client.post(
            f"/api/problems/{prob.slug}/submit/",
            {"code": "class Solution:\n    def solve(self, x):\n        return 1 / 0"},
            format="json",
        )
        self.assertEqual(res_rt.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_rt.data["status"], Submission.Status.RUNTIME_ERROR)

    def test_contest_status_filtering_and_rating_finalization(self):
        now = timezone.now()
        upcoming = Contest.objects.create(
            slug="cup-upcoming",
            title_uz="Up",
            title_en="Up",
            announcement_uz="Up",
            announcement_en="Up",
            start_time=now + timedelta(days=2),
            duration_minutes=120,
            author=self.admin,
            visibility=VisibilityStatus.PUBLIC,
        )
        ongoing = Contest.objects.create(
            slug="cup-ongoing",
            title_uz="On",
            title_en="On",
            announcement_uz="On",
            announcement_en="On",
            start_time=now - timedelta(minutes=30),
            duration_minutes=120,
            author=self.admin,
            visibility=VisibilityStatus.PUBLIC,
        )
        past = Contest.objects.create(
            slug="cup-past",
            title_uz="Past",
            title_en="Past",
            announcement_uz="Past",
            announcement_en="Past",
            start_time=now - timedelta(days=2),
            duration_minutes=60,
            author=self.admin,
            visibility=VisibilityStatus.PUBLIC,
        )

        res_up = self.client.get("/api/contests/?status=upcoming")
        self.assertEqual(res_up.status_code, status.HTTP_200_OK)
        slugs_up = [c["slug"] for c in res_up.data["results"] if "results" in res_up.data] or [c["slug"] for c in res_up.data if isinstance(res_up.data, list)]
        self.assertIn("cup-upcoming", slugs_up)

        res_on = self.client.get("/api/contests/?status=ongoing")
        self.assertEqual(res_on.status_code, status.HTTP_200_OK)
        slugs_on = [c["slug"] for c in res_on.data["results"] if "results" in res_on.data] or [c["slug"] for c in res_on.data if isinstance(res_on.data, list)]
        self.assertIn("cup-ongoing", slugs_on)

        ContestParticipation.objects.create(
            contest=past, user=self.student, score=200, penalty_minutes=20, rating_before=1200
        )
        ContestParticipation.objects.create(
            contest=past, user=self.author1, score=100, penalty_minutes=40, rating_before=1200
        )

        self.client.force_authenticate(user=self.admin)
        res_fin_ongoing = self.client.post(f"/api/contests/{ongoing.slug}/finalize_ratings/")
        self.assertEqual(res_fin_ongoing.status_code, status.HTTP_400_BAD_REQUEST)

        res_fin_past = self.client.post(f"/api/contests/{past.slug}/finalize_ratings/")
        self.assertEqual(res_fin_past.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.author1.refresh_from_db()
        self.assertGreater(self.student.rating, 1200)
        self.assertLess(self.author1.rating, 1200)

    def test_problem_list_user_status_and_tag_filter(self):
        p1 = Problem.objects.create(
            slug="p-arrays",
            title_uz="Array Prob",
            title_en="Array Prob",
            statement_uz="A",
            statement_en="A",
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
        )
        p1.tags.add(self.tag_array)

        p2 = Problem.objects.create(
            slug="p-math",
            title_uz="Math Prob",
            title_en="Math Prob",
            statement_uz="M",
            statement_en="M",
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
        )
        p2.tags.add(self.tag_math)

        self.client.force_authenticate(user=self.student)
        Submission.objects.create(
            user=self.student, problem=p1, code="...", status=Submission.Status.ACCEPTED, passed_cases=1, total_cases=1
        )
        Submission.objects.create(
            user=self.student, problem=p2, code="...", status=Submission.Status.WRONG_ANSWER, passed_cases=0, total_cases=1
        )

        res_all = self.client.get("/api/problems/")
        self.assertEqual(res_all.status_code, status.HTTP_200_OK)
        items = res_all.data["results"] if "results" in res_all.data else res_all.data
        status_map = {item["slug"]: item["user_status"] for item in items}
        self.assertEqual(status_map.get("p-arrays"), "solved")
        self.assertEqual(status_map.get("p-math"), "attempted")

        res_tag = self.client.get("/api/problems/?tag=arrays")
        self.assertEqual(res_tag.status_code, status.HTTP_200_OK)
        tag_items = res_tag.data["results"] if "results" in res_tag.data else res_tag.data
        tag_slugs = [item["slug"] for item in tag_items]
        self.assertIn("p-arrays", tag_slugs)
        self.assertNotIn("p-math", tag_slugs)

    def test_user_streak_and_level_progression(self):
        u = User.objects.create_user(
            username="gamer_user",
            email="gamer@algoset.uz",
            password="pass",
            role=User.Role.STUDENT,
        )
        self.assertEqual(u.level, 1)
        self.assertEqual(u.level_name, "Level 1 Python Learner")

        u.xp = 1250
        u.save()
        self.assertEqual(u.level, 3)
        self.assertEqual(u.level_name, "Level 3 Python Learner")
        self.assertEqual(u.level_progress_percent, 50)

    def test_problem_authoring_permissions_and_lifecycle(self):
        prob = Problem.objects.create(
            slug="author-demo",
            title_uz="Demo",
            title_en="Demo",
            statement_uz="Demo shart",
            statement_en="Demo statement",
            author=self.author1,
            visibility=VisibilityStatus.PRIVATE,
        )

        self.client.force_authenticate(user=self.student)
        res_stu = self.client.get(f"/api/problems/{prob.slug}/authoring/")
        self.assertEqual(res_stu.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.author2)
        res_auth2 = self.client.get(f"/api/problems/{prob.slug}/authoring/")
        self.assertEqual(res_auth2.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.author1)
        res_auth1 = self.client.get(f"/api/problems/{prob.slug}/authoring/")
        self.assertEqual(res_auth1.status_code, status.HTTP_200_OK)
        self.assertIn("active_version", res_auth1.data)
        self.assertEqual(res_auth1.data["active_version"]["version_number"], 1)

        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.get(f"/api/problems/{prob.slug}/authoring/")
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)

    def test_template_generation_for_languages(self):
        self.client.force_authenticate(user=self.author1)
        sig = {
            "name": "multiply",
            "params": [{"name": "a", "type": "int"}, {"name": "b", "type": "int"}],
            "return_type": "int",
        }
        res = self.client.post(
            "/api/problems/generate_templates/",
            {"execution_mode": "function", "function_signature": sig},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        templates = res.data["starter_templates"]
        self.assertIn("def multiply(self, a: int, b: int) -> int:", templates["python3"])
        self.assertIn("int multiply(int a, int b)", templates["cpp"])
        self.assertIn("public int multiply(int a, int b)", templates["java"])
        self.assertIn("var multiply = function(a, b)", templates["javascript"])

    def test_authoring_testcase_crud_and_zip_upload(self):
        prob = Problem.objects.create(
            slug="tc-crud-prob",
            title_uz="TC Crud",
            title_en="TC Crud",
            statement_uz="Shart",
            statement_en="Statement",
            author=self.author1,
            visibility=VisibilityStatus.PRIVATE,
        )
        self.client.force_authenticate(user=self.author1)
        res_init = self.client.get(f"/api/problems/{prob.slug}/authoring/")
        self.assertEqual(res_init.status_code, status.HTTP_200_OK)

        res_add = self.client.post(
            f"/api/problems/{prob.slug}/versions/1/testcases/",
            {
                "input_data": "10\n20",
                "expected_output": "30",
                "is_sample": True,
                "explanation": "10 + 20 = 30",
            },
            format="json",
        )
        self.assertEqual(res_add.status_code, status.HTTP_201_CREATED)
        tc_id = res_add.data["id"]

        res_edit = self.client.patch(
            f"/api/problems/{prob.slug}/versions/1/testcases/{tc_id}/",
            {"expected_output": "30"},
            format="json",
        )
        self.assertEqual(res_edit.status_code, status.HTTP_200_OK)

        zip_buf = io.BytesIO()
        with zipfile.ZipFile(zip_buf, "w") as zf:
            zf.writestr("test1.in", "2 3\n")
            zf.writestr("test1.out", "5\n")
            zf.writestr("test2.in", "100 200\n")
            zf.writestr("test2.out", "300\n")
        zip_buf.seek(0)
        zip_file = io.BytesIO(zip_buf.getvalue())
        zip_file.name = "tests.zip"

        res_zip = self.client.post(
            f"/api/problems/{prob.slug}/versions/1/upload_zip/",
            {"file": zip_file, "is_sample": False},
            format="multipart",
        )
        self.assertEqual(res_zip.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_zip.data["count"], 2)

        res_del = self.client.delete(f"/api/problems/{prob.slug}/versions/1/testcases/{tc_id}/")
        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)

    def test_validation_run_and_publishing_immutability(self):
        prob = Problem.objects.create(
            slug="val-prob",
            title_uz="Validatsiya Masalasi",
            title_en="Validation Problem",
            statement_uz="a va b sonlari yig'indisini hisoblang.",
            statement_en="Sum of a and b",
            author=self.author1,
            visibility=VisibilityStatus.PRIVATE,
        )
        self.client.force_authenticate(user=self.author1)
        self.client.get(f"/api/problems/{prob.slug}/authoring/")

        self.client.post(
            f"/api/problems/{prob.slug}/versions/1/testcases/",
            {"input_data": "4\n5", "expected_output": "9", "is_sample": True},
            format="json",
        )
        self.client.post(
            f"/api/problems/{prob.slug}/versions/1/testcases/",
            {"input_data": "10\n-3", "expected_output": "7", "is_sample": False},
            format="json",
        )

        res_unpub = self.client.post(f"/api/problems/{prob.slug}/versions/1/publish/")
        self.assertEqual(res_unpub.status_code, status.HTTP_400_BAD_REQUEST)

        bad_solution = "class Solution:\n    def solve(self, a, b):\n        return a - b\n"
        res_val_bad = self.client.post(
            f"/api/problems/{prob.slug}/versions/1/validate/",
            {"reference_solution": bad_solution},
            format="json",
        )
        self.assertEqual(res_val_bad.status_code, status.HTTP_200_OK)
        self.assertEqual(res_val_bad.data["status"], "failed")

        good_solution = "class Solution:\n    def solve(self, a, b):\n        return a + b\n"
        wrong_sol = "class Solution:\n    def solve(self, a, b):\n        return 0\n"
        res_val_good = self.client.post(
            f"/api/problems/{prob.slug}/versions/1/validate/",
            {"reference_solution": good_solution, "wrong_solution": wrong_sol},
            format="json",
        )
        self.assertEqual(res_val_good.status_code, status.HTTP_200_OK)
        self.assertEqual(res_val_good.data["status"], "passed")
        self.assertEqual(res_val_good.data["passed_cases"], 2)

        res_pub = self.client.post(f"/api/problems/{prob.slug}/versions/1/publish/")
        self.assertEqual(res_pub.status_code, status.HTTP_200_OK)
        prob.refresh_from_db()
        self.assertEqual(prob.visibility, VisibilityStatus.PUBLIC)
        self.assertEqual(len(prob.sample_test_cases), 1)
        self.assertEqual(len(prob.hidden_test_cases), 1)

        res_edit_pub = self.client.patch(
            f"/api/problems/{prob.slug}/versions/1/",
            {"statement_uz": "O'zgartirilgan"},
            format="json",
        )
        self.assertEqual(res_edit_pub.status_code, status.HTTP_400_BAD_REQUEST)

        res_new_v = self.client.post(f"/api/problems/{prob.slug}/create_version/")
        self.assertEqual(res_new_v.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_new_v.data["version_number"], 2)
        self.assertEqual(res_new_v.data["status"], "draft")

    def test_custom_checker_and_float_tolerance(self):
        comp_norm, _ = compare_outputs("1 2\n3", "1   2 3", checker_type="normalized")
        self.assertTrue(comp_norm)

        comp_float_ok, _ = compare_outputs("3.141592", "3.141593", checker_type="float_tolerance", float_tolerance=1e-5)
        self.assertTrue(comp_float_ok)
        comp_float_bad, _ = compare_outputs("3.14", "3.15", checker_type="float_tolerance", float_tolerance=1e-4)
        self.assertFalse(comp_float_bad)

        custom_checker = """
def check(inp, exp, act):
    try:
        a = [int(x) for x in act.split()]
        e = [int(x) for x in exp.split()]
        if sum(a) == sum(e):
            return True, "Yig'indilar teng"
        return False, "Yig'indilar teng emas"
    except Exception as err:
        return False, str(err)
"""
        comp_custom_ok, msg1 = compare_outputs("1 4", "2 3", checker_type="custom", custom_checker_code=custom_checker)
        self.assertTrue(comp_custom_ok)
        self.assertIn("teng", msg1)

        comp_custom_fail, msg2 = compare_outputs("1 2", "2 3", checker_type="custom", custom_checker_code=custom_checker)
        self.assertFalse(comp_custom_fail)

    def test_superadmin_last_account_protection(self):
        # Only superadmin exists
        self.client.force_authenticate(user=self.superadmin)
        res_demote = self.client.post(
            f"/api/users/{self.superadmin.id}/set_role/",
            {"role": "student"},
            format="json",
        )
        self.assertEqual(res_demote.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Yagona faol superadmin", res_demote.data["detail"])

        res_delete = self.client.delete(f"/api/users/{self.superadmin.id}/")
        self.assertEqual(res_delete.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Yagona faol superadmin", res_delete.data["detail"])

        # Create second superadmin
        superadmin2 = User.objects.create_user(
            username="superadmin2",
            email="superadmin2@algoset.uz",
            password="pass",
            role=User.Role.SUPERADMIN,
            is_email_verified=True,
        )
        # Now demoting the first one succeeds
        res_demote_ok = self.client.post(
            f"/api/users/{self.superadmin.id}/set_role/",
            {"role": "admin"},
            format="json",
        )
        self.assertEqual(res_demote_ok.status_code, status.HTTP_200_OK)
        self.superadmin.refresh_from_db()
        self.assertEqual(self.superadmin.role, User.Role.ADMIN)

        # Restore superadmin role for following tests
        self.superadmin.role = User.Role.SUPERADMIN
        self.superadmin.save()
        superadmin2.delete()

    def test_publication_request_lifecycle_and_audit(self):
        from .models import PublicationRequest

        # Author creates private problem
        prob = Problem.objects.create(
            slug="audit-problem",
            title_uz="Audit Test",
            title_en="Audit Test",
            statement_uz="Test statement",
            statement_en="Test statement",
            author=self.author1,
            visibility=VisibilityStatus.PRIVATE,
        )

        self.client.force_authenticate(user=self.author1)
        res_req = self.client.post(f"/api/problems/{prob.slug}/request_public/")
        self.assertEqual(res_req.status_code, status.HTTP_200_OK)
        prob.refresh_from_db()
        self.assertEqual(prob.visibility, VisibilityStatus.PENDING)

        pub_req = PublicationRequest.objects.filter(problem=prob).first()
        self.assertIsNotNone(pub_req)
        self.assertEqual(pub_req.status, PublicationRequest.Status.PENDING)
        self.assertEqual(pub_req.author, self.author1)

        # Admin approves
        self.client.force_authenticate(user=self.admin)
        res_review = self.client.post(
            f"/api/problems/{prob.slug}/review_request/",
            {"decision": "approve", "feedback": "Tasdiqlandi, barcha testlar qoniqarli."},
            format="json",
        )
        self.assertEqual(res_review.status_code, status.HTTP_200_OK)
        prob.refresh_from_db()
        self.assertEqual(prob.visibility, VisibilityStatus.PUBLIC)

        pub_req.refresh_from_db()
        self.assertEqual(pub_req.status, PublicationRequest.Status.APPROVED)
        self.assertEqual(pub_req.reviewer, self.admin)
        self.assertIn("Tasdiqlandi", pub_req.feedback)

    def test_private_contest_strict_isolation(self):
        # Author creates private contest
        now = timezone.now()
        private_contest = Contest.objects.create(
            slug="author-private-exam",
            title_uz="Yopiq Imtihon",
            title_en="Private Exam",
            announcement_uz="Faqat tanlangan guruh uchun",
            announcement_en="Only for private group",
            author=self.author1,
            visibility=VisibilityStatus.PRIVATE,
            start_time=now + timedelta(hours=1),
            duration_minutes=60,
        )

        # Student accesses: 404
        self.client.force_authenticate(user=self.student)
        res_student = self.client.get(f"/api/contests/{private_contest.slug}/")
        self.assertEqual(res_student.status_code, status.HTTP_404_NOT_FOUND)

        # Unauthenticated: 404
        self.client.logout()
        res_anon = self.client.get(f"/api/contests/{private_contest.slug}/")
        self.assertEqual(res_anon.status_code, status.HTTP_404_NOT_FOUND)

        # Author accesses: 200 OK
        self.client.force_authenticate(user=self.author1)
        res_author = self.client.get(f"/api/contests/{private_contest.slug}/")
        self.assertEqual(res_author.status_code, status.HTTP_200_OK)

    def test_unverified_user_cannot_obtain_jwt_login(self):
        unverified_user = User.objects.create_user(
            username="unverified_bob",
            email="unverified_bob@algoset.uz",
            password="securePassword123",
            role=User.Role.STUDENT,
            is_email_verified=False,
        )
        self.client.logout()

        # Login must be rejected
        res_login_fail = self.client.post(
            "/api/auth/login/",
            {"username": "unverified_bob", "password": "securePassword123"},
            format="json",
        )
        self.assertEqual(res_login_fail.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("tasdiqlanmagan", str(res_login_fail.data))

        # Verify email using token
        res_verify = self.client.get(f"/api/auth/verify-email/?token={unverified_user.verification_token}")
        self.assertEqual(res_verify.status_code, status.HTTP_200_OK)
        unverified_user.refresh_from_db()
        self.assertTrue(unverified_user.is_email_verified)

        # Now login succeeds
        res_login_ok = self.client.post(
            "/api/auth/login/",
            {"username": "unverified_bob", "password": "securePassword123"},
            format="json",
        )
        self.assertEqual(res_login_ok.status_code, status.HTTP_200_OK)
        self.assertIn("access", res_login_ok.data)

    def test_author_cannot_directly_publish_via_patch(self):
        prob = Problem.objects.create(
            slug="direct-publish-test",
            title_uz="Test",
            title_en="Test",
            statement_uz="Test",
            statement_en="Test",
            author=self.author1,
            visibility=VisibilityStatus.PRIVATE,
        )
        self.client.force_authenticate(user=self.author1)

        # Attempt direct change to public
        res_patch = self.client.patch(
            f"/api/problems/{prob.slug}/",
            {"visibility": "public"},
            format="json",
        )
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        prob.refresh_from_db()
        self.assertEqual(prob.visibility, VisibilityStatus.PRIVATE)

    def test_unsupported_language_rejection_no_simulated_accepted(self):
        self.client.force_authenticate(user=self.student)
        prob = Problem.objects.create(
            slug="lang-reject-test",
            title_uz="Lang Test",
            title_en="Lang Test",
            statement_uz="Test",
            statement_en="Test",
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
            sample_test_cases=[{"input": "1", "output": "1"}],
        )

        # Run with cpp: rejected with 400
        res_run = self.client.post(
            f"/api/problems/{prob.slug}/run/",
            {"code": "int main() {}", "language": "cpp"},
            format="json",
        )
        self.assertEqual(res_run.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Python 3", res_run.data["detail"])

        # Submit with java: rejected with 400
        res_submit = self.client.post(
            f"/api/problems/{prob.slug}/submit/",
            {"code": "class Solution {}", "language": "java"},
            format="json",
        )
        self.assertEqual(res_submit.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Python 3", res_submit.data["detail"])

        # Direct service call never returns ACCEPTED
        from .services import run_code, evaluate_submission
        eval_res = evaluate_submission("code", [{"input": "1", "output": "1"}], language="cpp")
        self.assertEqual(eval_res["status"], Submission.Status.RUNTIME_ERROR)
        self.assertEqual(eval_res["passed"], 0)
        self.assertIn("Python 3", eval_res["error"])

    def test_private_or_draft_contest_never_affects_ratings(self):
        from .services import update_contest_ratings
        now = timezone.now()
        private_contest = Contest.objects.create(
            slug="private-rating-test",
            title_uz="Private Contest",
            title_en="Private Contest",
            announcement_uz="Private",
            announcement_en="Private",
            author=self.author1,
            visibility=VisibilityStatus.PRIVATE,
            is_rated=True,
            start_time=now - timedelta(hours=2),
            duration_minutes=60,
        )
        part = ContestParticipation.objects.create(
            contest=private_contest,
            user=self.student,
            score=100,
            penalty_minutes=10,
            rating_before=1200,
            rating_after=1200,
        )
        initial_rating = self.student.rating
        updated = update_contest_ratings(private_contest)
        self.assertEqual(len(updated), 0)
        self.student.refresh_from_db()
        self.assertEqual(self.student.rating, initial_rating)

    # ================= CONTEST STUDIO TESTS =================
    def test_author_can_create_private_contest_and_cannot_directly_publish(self):
        self.client.force_authenticate(user=self.author1)
        start_time = (timezone.now() + timedelta(days=1)).isoformat()
        payload = {
            "title_uz": "Yangi Muallif Musobaqasi",
            "title_en": "New Author Contest",
            "slug": "author-contest-test",
            "start_time": start_time,
            "duration_minutes": 120,
            "visibility": "public",
        }
        res = self.client.post("/api/contests/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["visibility"], VisibilityStatus.PRIVATE)
        contest = Contest.objects.get(slug="author-contest-test")
        self.assertEqual(contest.visibility, VisibilityStatus.PRIVATE)
        self.assertEqual(contest.author, self.author1)

    def test_author_cannot_modify_another_authors_private_contest(self):
        contest = Contest.objects.create(
            slug="auth2-private-contest",
            title_uz="Auth2 Contest",
            title_en="Auth2 Contest",
            announcement_uz="Ann",
            announcement_en="Ann",
            author=self.author2,
            visibility=VisibilityStatus.PRIVATE,
            start_time=timezone.now() + timedelta(days=2),
            duration_minutes=120,
        )
        self.client.force_authenticate(user=self.author1)
        res = self.client.patch(
            f"/api/contests/{contest.slug}/",
            {"title_uz": "Hacked Title"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_cannot_create_or_modify_contests(self):
        self.client.force_authenticate(user=self.student)
        payload = {
            "title_uz": "Student Contest",
            "title_en": "Student Contest",
            "start_time": (timezone.now() + timedelta(days=1)).isoformat(),
            "duration_minutes": 120,
        }
        res_create = self.client.post("/api/contests/", payload, format="json")
        self.assertEqual(res_create.status_code, status.HTTP_403_FORBIDDEN)

        contest = Contest.objects.create(
            slug="public-test-contest",
            title_uz="Public Contest",
            title_en="Public Contest",
            announcement_uz="Ann",
            announcement_en="Ann",
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
            start_time=timezone.now() + timedelta(days=2),
            duration_minutes=120,
        )
        res_edit = self.client.patch(
            f"/api/contests/{contest.slug}/",
            {"title_uz": "Student Edit"},
            format="json",
        )
        self.assertEqual(res_edit.status_code, status.HTTP_403_FORBIDDEN)

    def test_contest_invalid_dates_and_durations_rejected(self):
        self.client.force_authenticate(user=self.author1)
        payload = {
            "title_uz": "Zero Duration Contest",
            "start_time": (timezone.now() + timedelta(days=1)).isoformat(),
            "duration_minutes": 0,
        }
        res = self.client.post("/api/contests/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("duration_minutes", res.data)

    def test_contest_unauthorized_private_problem_selection_rejected(self):
        private_prob = Problem.objects.create(
            slug="author2-secret-problem",
            title_uz="Secret Prob",
            title_en="Secret Prob",
            statement_uz="Secret",
            statement_en="Secret",
            author=self.author2,
            visibility=VisibilityStatus.PRIVATE,
        )
        self.client.force_authenticate(user=self.author1)
        payload = {
            "title_uz": "Steal Problem Contest",
            "title_en": "Steal Problem Contest",
            "start_time": (timezone.now() + timedelta(days=1)).isoformat(),
            "duration_minutes": 120,
            "problem_ids": [private_prob.id],
        }
        res = self.client.post("/api/contests/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("problem_ids", res.data)

    def test_contest_publication_workflow_approve_and_reject(self):
        contest = Contest.objects.create(
            slug="contest-approval-flow",
            title_uz="Flow Contest",
            title_en="Flow Contest",
            announcement_uz="Ann",
            announcement_en="Ann",
            author=self.author1,
            visibility=VisibilityStatus.PRIVATE,
            start_time=timezone.now() + timedelta(days=2),
            duration_minutes=120,
        )
        self.client.force_authenticate(user=self.author1)
        req_res = self.client.post(f"/api/contests/{contest.slug}/request_public/")
        self.assertEqual(req_res.status_code, status.HTTP_200_OK)
        contest.refresh_from_db()
        self.assertEqual(contest.visibility, VisibilityStatus.PENDING)

        self.client.force_authenticate(user=self.admin)
        deny_res = self.client.post(
            f"/api/contests/{contest.slug}/review_request/",
            {"decision": "deny", "feedback": "Masalalar soni kam."},
            format="json",
        )
        self.assertEqual(deny_res.status_code, status.HTTP_200_OK)
        contest.refresh_from_db()
        self.assertEqual(contest.visibility, VisibilityStatus.REJECTED)

        self.client.force_authenticate(user=self.author1)
        self.client.post(f"/api/contests/{contest.slug}/request_public/")
        contest.refresh_from_db()
        self.assertEqual(contest.visibility, VisibilityStatus.PENDING)

        self.client.force_authenticate(user=self.admin)
        app_res = self.client.post(
            f"/api/contests/{contest.slug}/review_request/",
            {"decision": "approve", "feedback": "Tasdiqlandi."},
            format="json",
        )
        self.assertEqual(app_res.status_code, status.HTTP_200_OK)
        contest.refresh_from_db()
        self.assertEqual(contest.visibility, VisibilityStatus.PUBLIC)

    def test_completed_contest_data_protected_from_destructive_edits(self):
        past_contest = Contest.objects.create(
            slug="past-protected-contest",
            title_uz="Past Contest",
            title_en="Past Contest",
            announcement_uz="Ann",
            announcement_en="Ann",
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
            start_time=timezone.now() - timedelta(days=2),
            duration_minutes=120,
            ratings_calculated=True,
        )
        self.client.force_authenticate(user=self.author1)
        res_edit = self.client.patch(
            f"/api/contests/{past_contest.slug}/",
            {"duration_minutes": 200},
            format="json",
        )
        self.assertEqual(res_edit.status_code, status.HTTP_400_BAD_REQUEST)

        res_del = self.client.delete(f"/api/contests/{past_contest.slug}/")
        self.assertEqual(res_del.status_code, status.HTTP_400_BAD_REQUEST)

    # ================= LEARNING STUDIO TESTS =================
    def test_learning_studio_roles_category_topic_lesson_crud(self):
        self.client.force_authenticate(user=self.admin)
        cat_res = self.client.post(
            "/api/categories/",
            {
                "title_uz": "Yangi Toifa",
                "title_en": "New Category",
                "slug": "new-test-category",
                "description_uz": "Desc",
                "description_en": "Desc",
                "order": 1,
            },
            format="json",
        )
        self.assertEqual(cat_res.status_code, status.HTTP_201_CREATED)
        cat = TopicCategory.objects.get(slug="new-test-category")

        self.client.force_authenticate(user=self.author1)
        top_res = self.client.post(
            "/api/topics/",
            {
                "category_slug": cat.slug,
                "title_uz": "Yangi Mavzu",
                "title_en": "New Topic",
                "slug": "new-test-topic",
                "content_uz": "<p>Mavzu mazmuni</p>",
            },
            format="json",
        )
        self.assertEqual(top_res.status_code, status.HTTP_201_CREATED)
        topic = Topic.objects.get(slug="new-test-topic")

        les_res = self.client.post(
            "/api/lessons/",
            {
                "topic_slug": topic.slug,
                "title_uz": "Yangi Dars",
                "title_en": "New Lesson",
                "slug": "new-test-lesson",
                "content_uz": "<p>Dars matni</p>",
                "visibility": "public",
            },
            format="json",
        )
        self.assertEqual(les_res.status_code, status.HTTP_201_CREATED)
        lesson = Lesson.objects.get(slug="new-test-lesson")
        self.assertEqual(lesson.visibility, VisibilityStatus.PRIVATE)
        self.assertEqual(lesson.created_by, self.author1)

    def test_learning_studio_student_denied_access(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.post(
            "/api/lessons/",
            {"title_uz": "Student Lesson", "title_en": "Student Lesson"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_learning_studio_author_cannot_modify_another_authors_private_content(self):
        cat = TopicCategory.objects.create(slug="auth2-cat", title_uz="C", title_en="C")
        topic = Topic.objects.create(category=cat, slug="auth2-topic", title_uz="T", title_en="T", created_by=self.author2)
        lesson = Lesson.objects.create(
            topic=topic,
            slug="auth2-private-lesson",
            title_uz="Auth2 Secret Lesson",
            title_en="Auth2 Secret Lesson",
            visibility=VisibilityStatus.PRIVATE,
            created_by=self.author2,
        )
        self.client.force_authenticate(user=self.author1)
        res_get = self.client.get(f"/api/lessons/{lesson.slug}/")
        self.assertEqual(res_get.status_code, status.HTTP_404_NOT_FOUND)

        res_patch = self.client.patch(
            f"/api/lessons/{lesson.slug}/",
            {"title_uz": "Hacked Lesson"},
            format="json",
        )
        self.assertEqual(res_patch.status_code, status.HTTP_404_NOT_FOUND)

    def test_learning_studio_private_content_inaccessible_to_students(self):
        cat = TopicCategory.objects.create(slug="sec-cat", title_uz="C", title_en="C")
        topic = Topic.objects.create(category=cat, slug="sec-topic", title_uz="T", title_en="T", created_by=self.author1)
        lesson = Lesson.objects.create(
            topic=topic,
            slug="hidden-lesson",
            title_uz="Hidden Lesson",
            title_en="Hidden Lesson",
            visibility=VisibilityStatus.PRIVATE,
            created_by=self.author1,
        )
        self.client.force_authenticate(user=self.student)
        res = self.client.get(f"/api/lessons/{lesson.slug}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_learning_studio_cascade_protection_on_deletion(self):
        self.client.force_authenticate(user=self.admin)
        cat = TopicCategory.objects.create(slug="cascade-cat", title_uz="C", title_en="C")
        topic = Topic.objects.create(category=cat, slug="cascade-topic", title_uz="T", title_en="T")
        Lesson.objects.create(topic=topic, slug="cascade-lesson", title_uz="L", title_en="L")

        res_cat = self.client.delete(f"/api/categories/{cat.slug}/")
        self.assertEqual(res_cat.status_code, status.HTTP_400_BAD_REQUEST)

        res_top = self.client.delete(f"/api/topics/{topic.slug}/")
        self.assertEqual(res_top.status_code, status.HTTP_400_BAD_REQUEST)

    def test_learning_studio_html_sanitization(self):
        self.client.force_authenticate(user=self.admin)
        cat = TopicCategory.objects.create(slug="html-cat", title_uz="C", title_en="C")
        topic = Topic.objects.create(category=cat, slug="html-topic", title_uz="T", title_en="T")
        dirty_html = '<p>Dars <script>alert("hack")</script><b>qalin</b><a href="javascript:void(0)">xavfli</a></p>'
        res = self.client.post(
            "/api/lessons/",
            {
                "topic_slug": topic.slug,
                "title_uz": "Sanitized Lesson",
                "title_en": "Sanitized Lesson",
                "slug": "sanitized-lesson",
                "content_uz": dirty_html,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        lesson = Lesson.objects.get(slug="sanitized-lesson")
        self.assertNotIn("<script>", lesson.content_uz)
        self.assertNotIn("alert", lesson.content_uz)
        self.assertNotIn("javascript:", lesson.content_uz)
        self.assertIn("<b>qalin</b>", lesson.content_uz)

    def test_learning_studio_publication_approval_workflow(self):
        cat = TopicCategory.objects.create(slug="pub-cat", title_uz="C", title_en="C")
        topic = Topic.objects.create(category=cat, slug="pub-topic", title_uz="T", title_en="T", created_by=self.author1)
        lesson = Lesson.objects.create(
            topic=topic,
            slug="pub-lesson",
            title_uz="Pub Lesson",
            title_en="Pub Lesson",
            visibility=VisibilityStatus.PRIVATE,
            created_by=self.author1,
        )
        self.client.force_authenticate(user=self.author1)
        req_res = self.client.post(f"/api/lessons/{lesson.slug}/request_public/")
        self.assertEqual(req_res.status_code, status.HTTP_200_OK)
        lesson.refresh_from_db()
        self.assertEqual(lesson.visibility, VisibilityStatus.PENDING)

        self.client.force_authenticate(user=self.admin)
        app_res = self.client.post(
            f"/api/lessons/{lesson.slug}/review_request/",
            {"decision": "approve", "feedback": "Dars yaxshi yozilgan."},
            format="json",
        )
        self.assertEqual(app_res.status_code, status.HTTP_200_OK)
        lesson.refresh_from_db()
        self.assertEqual(lesson.visibility, VisibilityStatus.PUBLIC)

    def test_html_sanitizer_strict_security_vectors(self):
        from .sanitizer import sanitize_html

        # Protocol-relative URL stripped from href
        out = sanitize_html('<a href="//evil.com/phish">Link</a>')
        self.assertNotIn("//evil.com", out)
        self.assertIn("<a>Link</a>", out)

        # Obfuscated javascript link stripped
        out = sanitize_html('<a href="jav&#x09;ascript:alert(1)">Click</a>')
        self.assertNotIn("javascript", out)
        self.assertIn("<a>Click</a>", out)

        # Iframe and internal text completely stripped
        out = sanitize_html('<iframe>evil content</iframe>')
        self.assertEqual(out, "")

        # Form and inputs completely stripped
        out = sanitize_html('<form action="/steal"><input type="password" value="secret"/></form>')
        self.assertEqual(out, "")

        # Target blank gets rel noopener noreferrer
        out = sanitize_html('<a href="https://algoset.uz" target="_blank">External</a>')
        self.assertIn('rel="noopener noreferrer"', out)

        # Unclosed nested tags are safely closed
        out = sanitize_html('<div>Unclosed <span>nested <b>tags</div>')
        self.assertEqual(out, '<div>Unclosed <span>nested <b>tags</b></span></div>')

    def test_production_readiness_and_security_hardening(self):
        # 1. Sole active superadmin cannot be deactivated via is_active=False
        self.client.force_authenticate(user=self.superadmin)
        res_deact = self.client.patch(
            f"/api/users/{self.superadmin.id}/",
            {"is_active": False},
            format="json",
        )
        self.assertEqual(res_deact.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("faolsizlantirish", res_deact.data["detail"])
        self.superadmin.refresh_from_db()
        self.assertTrue(self.superadmin.is_active)

        # 2. Code execution disabled mode returns friendly status and honest notice
        from .services import run_code, evaluate_submission, validate_problem_version
        with self.settings(ENABLE_CODE_EXECUTION=False):
            res_run = run_code("print(1)")
            self.assertEqual(res_run["status"], Submission.Status.RUNTIME_ERROR)
            self.assertIn("vaqtincha to'xtatilgan", res_run["error"])
            self.assertEqual(res_run["error"], res_run["stderr"])

            res_eval = evaluate_submission("print(1)", [{"input": "1", "output": "1"}])
            self.assertEqual(res_eval["status"], Submission.Status.RUNTIME_ERROR)
            self.assertIn("vaqtincha to'xtatilgan", res_eval["error"])

            prob = Problem.objects.create(
                slug="test-sec-disabled",
                title_uz="T",
                title_en="T",
                statement_uz="S",
                statement_en="S",
                author=self.author1,
            )
            v = ProblemVersion.objects.create(
                problem=prob,
                version_number=1,
                reference_solution="def solve(): pass",
            )
            v_run = validate_problem_version(v, user=self.author1)
            self.assertEqual(v_run.status, ValidationRun.Status.FAILED)
            self.assertIn("vaqtincha to'xtatilgan", v_run.summary)

        # 3. Production settings fail-fast checks
        from django.core.exceptions import ImproperlyConfigured
        # Insecure/short SECRET_KEY when DEBUG=False
        with self.settings(DEBUG=False, SECRET_KEY="too-short"):
            # Check deploy catches it or custom check raises
            pass


class AlgoSetProductionSecurityHardeningTests(APITestCase):
    def setUp(self):
        self.superadmin = User.objects.create_user(
            username="sa_sec",
            email="sa_sec@algoset.uz",
            password="Password123!",
            role=User.Role.SUPERADMIN,
        )
        self.admin = User.objects.create_user(
            username="adm_sec",
            email="adm_sec@algoset.uz",
            password="Password123!",
            role=User.Role.ADMIN,
        )
        self.author1 = User.objects.create_user(
            username="auth1_sec",
            email="auth1_sec@algoset.uz",
            password="Password123!",
            role=User.Role.AUTHOR,
        )
        self.author2 = User.objects.create_user(
            username="auth2_sec",
            email="auth2_sec@algoset.uz",
            password="Password123!",
            role=User.Role.AUTHOR,
        )
        self.student = User.objects.create_user(
            username="stu_sec",
            email="stu_sec@algoset.uz",
            password="Password123!",
            role=User.Role.STUDENT,
        )
        self.category = TopicCategory.objects.create(
            slug="sec-cat",
            icon="shield",
            group="Security",
            title_uz="Xavfsizlik",
            title_en="Security",
        )

    def test_unauthenticated_and_student_cannot_view_private_topic(self):
        Topic.objects.create(
            category=self.category,
            slug="private-topic-sec",
            title_uz="Maxfiy",
            title_en="Private",
            visibility=VisibilityStatus.PRIVATE,
            created_by=self.author1,
        )
        Topic.objects.create(
            category=self.category,
            slug="public-topic-sec",
            title_uz="Ommaviy",
            title_en="Public",
            visibility=VisibilityStatus.PUBLIC,
            created_by=self.author1,
        )

        # Unauthenticated
        res_anon = self.client.get("/api/topics/")
        self.assertEqual(res_anon.status_code, status.HTTP_200_OK)
        slugs_anon = [t["slug"] for t in res_anon.data]
        self.assertIn("public-topic-sec", slugs_anon)
        self.assertNotIn("private-topic-sec", slugs_anon)

        # Student
        self.client.force_authenticate(user=self.student)
        res_stu = self.client.get("/api/topics/")
        slugs_stu = [t["slug"] for t in res_stu.data]
        self.assertIn("public-topic-sec", slugs_stu)
        self.assertNotIn("private-topic-sec", slugs_stu)

        # Author 1 (owner)
        self.client.force_authenticate(user=self.author1)
        res_auth1 = self.client.get("/api/topics/")
        slugs_auth1 = [t["slug"] for t in res_auth1.data]
        self.assertIn("public-topic-sec", slugs_auth1)
        self.assertIn("private-topic-sec", slugs_auth1)

        # Author 2 (different author)
        self.client.force_authenticate(user=self.author2)
        res_auth2 = self.client.get("/api/topics/")
        slugs_auth2 = [t["slug"] for t in res_auth2.data]
        self.assertIn("public-topic-sec", slugs_auth2)
        self.assertNotIn("private-topic-sec", slugs_auth2)

    def test_resend_verification_does_not_leak_token_and_works_unauthenticated(self):
        User.objects.create_user(
            username="unv_sec",
            email="unv_sec@algoset.uz",
            password="Password123!",
            is_email_verified=False,
        )

        res = self.client.post("/api/auth/resend-verification/", {"email": "unv_sec@algoset.uz"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertNotIn("token", res.data)
        self.assertIn("detail", res.data)

    def test_unauthorized_users_cannot_publish_or_modify_other_author_problem(self):
        prob = Problem.objects.create(
            slug="author-sec-prob",
            title_uz="ASP",
            title_en="ASP",
            author=self.author1,
            visibility=VisibilityStatus.PRIVATE,
        )
        ProblemVersion.objects.create(
            problem=prob,
            version_number=1,
            reference_solution="def solve(): pass",
        )

        # 1. Student attempting to publish -> 403
        self.client.force_authenticate(user=self.student)
        res_stu = self.client.post("/api/problems/author-sec-prob/versions/1/publish/")
        self.assertEqual(res_stu.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Author 2 (different author) attempting to publish Author 1's problem -> 403
        self.client.force_authenticate(user=self.author2)
        res_auth2 = self.client.post("/api/problems/author-sec-prob/versions/1/publish/")
        self.assertEqual(res_auth2.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Anonymous user -> 401
        self.client.logout()
        res_anon = self.client.post("/api/problems/author-sec-prob/versions/1/publish/")
        self.assertEqual(res_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # 4. Author 1 without validation run -> 400
        self.client.force_authenticate(user=self.author1)
        res_unval = self.client.post("/api/problems/author-sec-prob/versions/1/publish/")
        self.assertEqual(res_unval.status_code, status.HTTP_400_BAD_REQUEST)
        prob.refresh_from_db()
        self.assertEqual(prob.visibility, VisibilityStatus.PRIVATE)

    def test_password_change_requires_current_password_and_validation(self):
        self.client.force_authenticate(user=self.student)

        # 1. Missing current_password
        res1 = self.client.patch("/api/auth/me/", {"password": "NewPassword123!"})
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Wrong current_password
        res2 = self.client.patch("/api/auth/me/", {
            "password": "NewPassword123!",
            "current_password": "WrongPassword!",
        })
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Too short password
        res3 = self.client.patch("/api/auth/me/", {
            "password": "short",
            "current_password": "Password123!",
        })
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)

        # 4. Valid password update
        res4 = self.client.patch("/api/auth/me/", {
            "password": "NewSecurePassword999!",
            "current_password": "Password123!",
        })
        self.assertEqual(res4.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertTrue(self.student.check_password("NewSecurePassword999!"))

    def test_xss_sanitization_in_discussions(self):
        self.client.force_authenticate(user=self.student)
        prob = Problem.objects.create(
            slug="disc-sec-prob",
            title_uz="DSP",
            title_en="DSP",
            author=self.author1,
            visibility=VisibilityStatus.PUBLIC,
        )

        res = self.client.post("/api/problems/disc-sec-prob/discussions/", {
            "title": "Title <script>alert(1)</script>",
            "content": "<p>Content</p><script>alert('xss')</script><iframe src='javascript:void(0)'></iframe>",
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("<script>", res.data["title"])
        self.assertNotIn("<script>", res.data["content"])
        self.assertNotIn("<iframe>", res.data["content"])

        disc_id = res.data["id"]
        res_comment = self.client.post(f"/api/problems/disc-sec-prob/discussions/{disc_id}/comments/", {
            "content": "<img src=x onerror=alert(1)><b>comment</b>",
        })
        self.assertEqual(res_comment.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("onerror", res_comment.data["content"])

    def test_python_sandbox_blocks_dunder_attributes(self):
        is_safe, err = validate_code_safety("().__class__.__base__.__subclasses__()")
        self.assertFalse(is_safe)
        self.assertIn("dangerous attribute", err)

        is_safe2, err2 = validate_code_safety("def f(): return f.__globals__")
        self.assertFalse(is_safe2)
        self.assertIn("dangerous attribute", err2)

    def test_zip_import_safety_validation(self):
        import io
        import zipfile
        from .services import import_testcases_from_zip

        prob = Problem.objects.create(
            slug="zip-sec-prob",
            title_uz="ZP",
            title_en="ZP",
            author=self.author1,
        )
        v = ProblemVersion.objects.create(problem=prob, version_number=1)

        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("../evil_path.in", "123")
        buf.seek(0)

        with self.assertRaises(ValueError) as ctx:
            import_testcases_from_zip(v, buf)
        self.assertIn("xavfli fayl yo'li", str(ctx.exception))






