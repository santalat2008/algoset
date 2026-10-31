import uuid
from datetime import timedelta
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        AUTHOR = "author", "Author"
        ADMIN = "admin", "Admin"
        SUPERADMIN = "superadmin", "Superadmin"

    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20, choices=Role.choices, default=Role.STUDENT
    )
    is_email_verified = models.BooleanField(default=False)
    verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    rating = models.IntegerField(default=1200)
    max_rating = models.IntegerField(default=1200)
    xp = models.PositiveIntegerField(default=0)
    streak_days = models.PositiveIntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)
    preferred_language = models.CharField(max_length=5, default="uz")

    @property
    def level(self) -> int:
        return (self.xp // 500) + 1

    @property
    def level_name(self) -> str:
        return f"Level {self.level} Python Learner"

    @property
    def level_progress_percent(self) -> int:
        return int(((self.xp % 500) / 500.0) * 100)

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = self.Role.SUPERADMIN
        super().save(*args, **kwargs)


class VisibilityStatus(models.TextChoices):
    PRIVATE = "private", "Private"
    PENDING = "pending", "Pending Public Approval"
    PUBLIC = "public", "Public"
    REJECTED = "rejected", "Rejected"


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class TopicCategory(models.Model):
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, default="code")
    group = models.CharField(max_length=50, default="Python")
    title_uz = models.CharField(max_length=150)
    title_en = models.CharField(max_length=150)
    description_uz = models.TextField()
    description_en = models.TextField()
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title_en


class Topic(models.Model):
    category = models.ForeignKey(
        TopicCategory, on_delete=models.CASCADE, related_name="topics"
    )
    slug = models.SlugField(unique=True)
    title_uz = models.CharField(max_length=200)
    title_en = models.CharField(max_length=200)
    description_uz = models.TextField(blank=True, default="")
    description_en = models.TextField(blank=True, default="")
    content_uz = models.TextField(blank=True, default="")
    content_en = models.TextField(blank=True, default="")
    visibility = models.CharField(
        max_length=20,
        choices=VisibilityStatus.choices,
        default=VisibilityStatus.PUBLIC,
    )
    related_problems = models.ManyToManyField("Problem", related_name="topics", blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="topics_created"
    )
    order = models.PositiveIntegerField(default=0)
    source_url = models.URLField(max_length=500, blank=True, default="")
    is_imported = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title_en


class UserTopicProgress(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="topic_progress"
    )
    topic = models.ForeignKey(
        Topic, on_delete=models.CASCADE, related_name="user_progress"
    )
    is_completed = models.BooleanField(default=True)
    completed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "topic")


class Lesson(models.Model):
    topic = models.ForeignKey(
        Topic, on_delete=models.CASCADE, related_name="lessons"
    )
    slug = models.SlugField(unique=True)
    title_uz = models.CharField(max_length=200)
    title_en = models.CharField(max_length=200)
    summary_uz = models.TextField(blank=True, default="")
    summary_en = models.TextField(blank=True, default="")
    content_uz = models.TextField(blank=True, default="")
    content_en = models.TextField(blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    visibility = models.CharField(
        max_length=20,
        choices=VisibilityStatus.choices,
        default=VisibilityStatus.PRIVATE,
    )
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="lessons_created"
    )
    related_problems = models.ManyToManyField("Problem", related_name="lessons", blank=True)
    source_url = models.URLField(max_length=500, blank=True, default="")
    source_author = models.CharField(max_length=200, blank=True, default="")
    source_license = models.CharField(max_length=100, blank=True, default="")
    is_imported = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title_en or self.title_uz


class UserLessonProgress(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="lesson_progress"
    )
    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name="user_progress"
    )
    is_completed = models.BooleanField(default=True)
    completed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "lesson")


class Problem(models.Model):
    class Difficulty(models.TextChoices):
        EASY = "Easy", "Easy"
        MEDIUM = "Medium", "Medium"
        HARD = "Hard", "Hard"

    slug = models.SlugField(unique=True)
    title_uz = models.CharField(max_length=200)
    title_en = models.CharField(max_length=200)
    statement_uz = models.TextField()
    statement_en = models.TextField()
    difficulty = models.CharField(
        max_length=15, choices=Difficulty.choices, default=Difficulty.EASY
    )
    tags = models.ManyToManyField(Tag, related_name="problems", blank=True)
    starter_code = models.TextField(
        default="class Solution:\n    def solve(self, inp: str) -> str:\n        return inp.strip()\n"
    )
    sample_test_cases = models.JSONField(default=list)
    hidden_test_cases = models.JSONField(default=list)
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="problems"
    )
    visibility = models.CharField(
        max_length=20,
        choices=VisibilityStatus.choices,
        default=VisibilityStatus.PRIVATE,
    )
    solved_count = models.PositiveIntegerField(default=0)
    submission_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    @property
    def acceptance_rate(self) -> int:
        if self.submission_count == 0:
            return 0
        return int((self.solved_count / self.submission_count) * 100)

    @property
    def latest_version(self):
        return self.versions.first()

    @property
    def published_version(self):
        return self.versions.filter(is_published=True).first()

    def __str__(self):
        return self.title_en


class ProblemVersion(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        VALIDATING = "validating", "Validating"
        READY_FOR_REVIEW = "ready_for_review", "Ready for Review"
        PUBLISHED = "published", "Published"

    class ExecutionMode(models.TextChoices):
        FUNCTION = "function", "Function-based"
        STANDARD_IO = "standard_io", "Standard I/O"

    class CheckerType(models.TextChoices):
        EXACT = "exact", "Exact Match"
        NORMALIZED = "normalized", "Normalized Whitespace"
        FLOAT_TOLERANCE = "float_tolerance", "Floating Point Tolerance"
        TYPE_AWARE = "type_aware", "Type-Aware (JSON)"
        CUSTOM = "custom", "Custom Python Checker"

    problem = models.ForeignKey(
        Problem, on_delete=models.CASCADE, related_name="versions"
    )
    version_number = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=25, choices=Status.choices, default=Status.DRAFT
    )
    execution_mode = models.CharField(
        max_length=20, choices=ExecutionMode.choices, default=ExecutionMode.FUNCTION
    )
    function_signature = models.JSONField(
        default=dict,
        help_text="e.g. {'name': 'twoSum', 'params': [{'name': 'nums', 'type': 'list[int]'}], 'return_type': 'list[int]'}"
    )
    starter_templates = models.JSONField(
        default=dict,
        help_text="e.g. {'python3': '...', 'cpp': '...', 'java': '...', 'javascript': '...'}"
    )
    statement_uz = models.TextField(blank=True, default="")
    statement_en = models.TextField(blank=True, default="")
    input_description_uz = models.TextField(blank=True, default="")
    output_description_uz = models.TextField(blank=True, default="")
    constraints = models.TextField(blank=True, default="")
    time_limit_ms = models.PositiveIntegerField(default=2000)
    memory_limit_mb = models.PositiveIntegerField(default=256)
    checker_type = models.CharField(
        max_length=25, choices=CheckerType.choices, default=CheckerType.EXACT
    )
    float_tolerance = models.FloatField(default=1e-6)
    custom_checker_code = models.TextField(blank=True, default="")
    reference_solution = models.TextField(blank=True, default="")
    reference_language = models.CharField(max_length=20, default="python3")
    is_published = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="problem_versions_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("problem", "version_number")
        ordering = ["-version_number"]

    def __str__(self):
        return f"{self.problem.slug} v{self.version_number} ({self.status})"


class TestGroup(models.Model):
    version = models.ForeignKey(
        ProblemVersion, on_delete=models.CASCADE, related_name="test_groups"
    )
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)
    weight = models.PositiveIntegerField(default=100)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.name} (v{self.version.version_number})"


class TestCase(models.Model):
    version = models.ForeignKey(
        ProblemVersion, on_delete=models.CASCADE, related_name="test_cases"
    )
    group = models.ForeignKey(
        TestGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name="test_cases"
    )
    input_data = models.TextField()
    expected_output = models.TextField(blank=True, default="")
    is_sample = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    explanation = models.TextField(blank=True, default="")
    time_limit_override_ms = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Case #{self.order} ({'Sample' if self.is_sample else 'Hidden'})"


class ValidationRun(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        PASSED = "passed", "Passed"
        FAILED = "failed", "Failed"

    version = models.ForeignKey(
        ProblemVersion, on_delete=models.CASCADE, related_name="validation_runs"
    )
    initiated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="validations_initiated"
    )
    reference_solution = models.TextField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    total_cases = models.PositiveIntegerField(default=0)
    passed_cases = models.PositiveIntegerField(default=0)
    summary = models.TextField(blank=True, default="")
    starter_code_valid = models.BooleanField(default=True)
    checker_valid = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]


class ValidationResult(models.Model):
    run = models.ForeignKey(
        ValidationRun, on_delete=models.CASCADE, related_name="results"
    )
    test_case = models.ForeignKey(
        TestCase, on_delete=models.SET_NULL, null=True, blank=True, related_name="validation_results"
    )
    case_order = models.PositiveIntegerField(default=0)
    is_sample = models.BooleanField(default=False)
    status = models.CharField(max_length=35)
    runtime_ms = models.PositiveIntegerField(default=0)
    actual_output = models.TextField(blank=True, default="")
    expected_output = models.TextField(blank=True, default="")
    error_message = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["case_order", "id"]


class Contest(models.Model):
    class Division(models.TextChoices):
        DIV1 = "Div. 1", "Div. 1"
        DIV2 = "Div. 2", "Div. 2"
        EDUCATIONAL = "Educational", "Educational"

    slug = models.SlugField(unique=True)
    title_uz = models.CharField(max_length=200)
    title_en = models.CharField(max_length=200)
    announcement_uz = models.TextField()
    announcement_en = models.TextField()
    division = models.CharField(
        max_length=20, choices=Division.choices, default=Division.DIV2
    )
    is_rated = models.BooleanField(default=True)
    start_time = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=120)
    rules_uz = models.TextField(blank=True, default="")
    rules_en = models.TextField(blank=True, default="")
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="contests_created"
    )
    problems = models.ManyToManyField(Problem, related_name="contests", blank=True)
    problem_order = models.JSONField(default=list, blank=True)
    visibility = models.CharField(
        max_length=20,
        choices=VisibilityStatus.choices,
        default=VisibilityStatus.PRIVATE,
    )
    ratings_calculated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-start_time"]

    @property
    def end_time(self):
        return self.start_time + timedelta(minutes=self.duration_minutes)

    @property
    def status(self) -> str:
        now = timezone.now()
        if now < self.start_time:
            return "upcoming"
        elif now <= self.end_time:
            return "ongoing"
        return "past"

    def __str__(self):
        return self.title_en


class Submission(models.Model):
    class Status(models.TextChoices):
        ACCEPTED = "Accepted", "Accepted"
        WRONG_ANSWER = "Wrong Answer", "Wrong Answer"
        RUNTIME_ERROR = "Runtime Error", "Runtime Error"
        TIME_LIMIT = "Time Limit Exceeded", "Time Limit Exceeded"

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="submissions"
    )
    problem = models.ForeignKey(
        Problem, on_delete=models.CASCADE, related_name="submissions"
    )
    contest = models.ForeignKey(
        Contest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submissions",
    )
    code = models.TextField()
    language = models.CharField(max_length=20, default="python3")
    status = models.CharField(max_length=30, choices=Status.choices)
    passed_cases = models.PositiveIntegerField(default=0)
    total_cases = models.PositiveIntegerField(default=0)
    runtime_ms = models.PositiveIntegerField(default=0)
    error_output = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class ContestParticipation(models.Model):
    contest = models.ForeignKey(
        Contest, on_delete=models.CASCADE, related_name="participations"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="contest_participations"
    )
    score = models.IntegerField(default=0)
    penalty_minutes = models.IntegerField(default=0)
    rating_before = models.IntegerField(default=1200)
    rating_after = models.IntegerField(default=1200)
    rank = models.PositiveIntegerField(null=True, blank=True)
    solved_problems = models.ManyToManyField(
        Problem, blank=True, related_name="contest_solves"
    )

    class Meta:
        unique_together = ("contest", "user")
        ordering = ["-score", "penalty_minutes"]


class Discussion(models.Model):
    problem = models.ForeignKey(
        Problem, on_delete=models.CASCADE, related_name="discussions"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="discussions"
    )
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class DiscussionComment(models.Model):
    discussion = models.ForeignKey(
        Discussion, on_delete=models.CASCADE, related_name="comments"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="discussion_comments"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class PublicationRequest(models.Model):
    class RequestType(models.TextChoices):
        PROBLEM = "problem", "Problem"
        CONTEST = "contest", "Contest"
        LESSON = "lesson", "Lesson"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending Review"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    request_type = models.CharField(max_length=20, choices=RequestType.choices)
    problem = models.ForeignKey(
        Problem, on_delete=models.CASCADE, null=True, blank=True, related_name="publication_requests"
    )
    contest = models.ForeignKey(
        Contest, on_delete=models.CASCADE, null=True, blank=True, related_name="publication_requests"
    )
    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, null=True, blank=True, related_name="publication_requests"
    )
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="publication_requests")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reviewer = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_publication_requests"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    feedback = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

