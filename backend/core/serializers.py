from django.utils.text import slugify
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    User,
    Tag,
    TopicCategory,
    Topic,
    UserTopicProgress,
    Lesson,
    UserLessonProgress,
    Problem,
    ProblemVersion,
    TestGroup,
    TestCase,
    ValidationRun,
    ValidationResult,
    Contest,
    Submission,
    ContestParticipation,
    Discussion,
    DiscussionComment,
    VisibilityStatus,
    PublicationRequest,
)
from .permissions import is_admin_or_above
from .sanitizer import sanitize_html


class UserSerializer(serializers.ModelSerializer):
    level = serializers.IntegerField(read_only=True)
    level_name = serializers.CharField(read_only=True)
    level_progress_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_email_verified",
            "rating",
            "max_rating",
            "streak_days",
            "xp",
            "level",
            "level_name",
            "level_progress_percent",
            "preferred_language",
        ]
        read_only_fields = [
            "role",
            "is_email_verified",
            "rating",
            "max_rating",
            "streak_days",
            "xp",
            "level",
            "level_name",
            "level_progress_percent",
        ]


class AlgoSetTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_email_verified:
            raise serializers.ValidationError(
                {"detail": "Email manzili tasdiqlanmagan. Iltimos, emailingizga yuborilgan tasdiqlash xabarini tekshiring."}
            )
        return data



class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        max_length=150,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="Ushbu foydalanuvchi nomi allaqachon band. Boshqa nom tanlang.",
            )
        ],
        error_messages={
            "blank": "Foydalanuvchi nomi (username) kiritilishi shart.",
        },
    )
    email = serializers.EmailField(
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="Ushbu email manzili allaqachon ro'yxatdan o'tgan. Tizimga kiring yoki boshqa email kiriting.",
            )
        ],
        error_messages={
            "blank": "Email manzili kiritilishi shart.",
            "invalid": "Haqiqiy email manzilini kiriting.",
        },
    )
    password = serializers.CharField(
        write_only=True,
        min_length=6,
        error_messages={
            "min_length": "Parol uzunligi kamida 6 ta belgidan iborat bo'lishi kerak.",
            "blank": "Parol maydoni bo'sh bo'lmasligi kerak.",
        },
    )

    class Meta:
        model = User
        fields = ["username", "email", "password", "preferred_language"]

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"].strip(),
            email=validated_data["email"].strip().lower(),
            password=validated_data["password"],
            preferred_language=validated_data.get("preferred_language", "uz"),
            role=User.Role.STUDENT,
            is_email_verified=False,
        )


class TagSerializer(serializers.ModelSerializer):
    problem_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = ["id", "name", "slug", "order", "problem_count"]


class TagListField(serializers.Field):
    def to_representation(self, value):
        return [tag.name for tag in value.all()]

    def to_internal_value(self, data):
        if not isinstance(data, list):
            raise serializers.ValidationError("Tags must be a list of strings.")
        tags = []
        for tag_item in data:
            if not isinstance(tag_item, str) or not tag_item.strip():
                continue
            name = tag_item.strip()
            slug = slugify(name) or name.lower().replace(" ", "-")
            tag_obj, _ = Tag.objects.get_or_create(name=name, defaults={"slug": slug})
            tags.append(tag_obj)
        return tags


class TopicSerializer(serializers.ModelSerializer):
    category_slug = serializers.SlugRelatedField(
        source="category",
        slug_field="slug",
        queryset=TopicCategory.objects.all(),
        required=False,
    )
    category_title = serializers.CharField(source="category.title_uz", read_only=True)
    is_completed = serializers.SerializerMethodField()
    lessons_count = serializers.IntegerField(source="lessons.count", read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = Topic
        fields = [
            "id",
            "category",
            "category_slug",
            "category_title",
            "slug",
            "title_uz",
            "title_en",
            "description_uz",
            "description_en",
            "content_uz",
            "content_en",
            "visibility",
            "order",
            "source_url",
            "is_imported",
            "lessons_count",
            "created_by",
            "created_by_username",
            "created_at",
            "is_completed",
        ]
        read_only_fields = ["created_by"]
        extra_kwargs = {
            "category": {"required": False},
            "slug": {"required": False, "allow_blank": True},
            "title_en": {"required": False, "allow_blank": True},
            "description_uz": {"required": False, "allow_blank": True},
            "description_en": {"required": False, "allow_blank": True},
            "content_uz": {"required": False, "allow_blank": True},
            "content_en": {"required": False, "allow_blank": True},
            "visibility": {"required": False},
        }

    def validate(self, attrs):
        if "category" not in attrs and not self.instance:
            first_cat = TopicCategory.objects.first()
            if first_cat:
                attrs["category"] = first_cat

        title_uz = attrs.get("title_uz") or (self.instance.title_uz if self.instance else "")
        title_en = attrs.get("title_en") or (self.instance.title_en if self.instance else "")
        if not title_uz and not title_en:
            raise serializers.ValidationError({"title_uz": "Darslik sarlavhasi kiritilishi shart."})
        if not title_uz:
            attrs["title_uz"] = title_en
        if not title_en:
            attrs["title_en"] = title_uz

        content_uz = attrs.get("content_uz") or (self.instance.content_uz if self.instance else "")
        content_en = attrs.get("content_en") or (self.instance.content_en if self.instance else "")
        if content_uz:
            attrs["content_uz"] = sanitize_html(content_uz)
        else:
            attrs["content_uz"] = content_en or "Dars mazmuni."
        if content_en:
            attrs["content_en"] = sanitize_html(content_en)
        else:
            attrs["content_en"] = attrs["content_uz"]

        slug = attrs.get("slug")
        if not slug and not self.instance:
            base_slug = slugify(attrs.get("title_en") or attrs.get("title_uz") or "topic")
            if not base_slug:
                import uuid
                base_slug = f"topic-{uuid.uuid4().hex[:6]}"
            slug = base_slug
            counter = 1
            while Topic.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            attrs["slug"] = slug
        elif slug:
            existing = Topic.objects.filter(slug=slug)
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            if existing.exists():
                raise serializers.ValidationError({"slug": f"'{slug}' nomli mavzu URL allaqachon mavjud."})

        return attrs

    def get_is_completed(self, obj) -> bool:
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return UserTopicProgress.objects.filter(
                user=request.user, topic=obj, is_completed=True
            ).exists()
        return False


class TopicCategorySerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)
    topic_count = serializers.IntegerField(source="topics.count", read_only=True)
    completed_topic_count = serializers.SerializerMethodField()

    class Meta:
        model = TopicCategory
        fields = [
            "id",
            "slug",
            "icon",
            "group",
            "title_uz",
            "title_en",
            "description_uz",
            "description_en",
            "order",
            "is_active",
            "topic_count",
            "completed_topic_count",
            "topics",
        ]
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
            "title_en": {"required": False, "allow_blank": True},
            "description_en": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        title_uz = attrs.get("title_uz") or (self.instance.title_uz if self.instance else "")
        title_en = attrs.get("title_en") or (self.instance.title_en if self.instance else "")
        if not title_uz and not title_en:
            raise serializers.ValidationError({"title_uz": "Toifa nomi kiritilishi shart."})
        if not title_uz:
            attrs["title_uz"] = title_en
        if not title_en:
            attrs["title_en"] = title_uz

        desc_uz = attrs.get("description_uz") or (self.instance.description_uz if self.instance else "")
        desc_en = attrs.get("description_en") or (self.instance.description_en if self.instance else "")
        if not desc_uz:
            attrs["description_uz"] = desc_en or "Toifa tavsifi."
        if not desc_en:
            attrs["description_en"] = attrs["description_uz"]

        slug = attrs.get("slug")
        if not slug and not self.instance:
            base_slug = slugify(attrs.get("title_en") or attrs.get("title_uz") or "category")
            if not base_slug:
                import uuid
                base_slug = f"cat-{uuid.uuid4().hex[:6]}"
            slug = base_slug
            counter = 1
            while TopicCategory.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            attrs["slug"] = slug
        elif slug:
            existing = TopicCategory.objects.filter(slug=slug)
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            if existing.exists():
                raise serializers.ValidationError({"slug": f"'{slug}' nomli toifa URL allaqachon mavjud."})

        return attrs

    def get_completed_topic_count(self, obj) -> int:
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return UserTopicProgress.objects.filter(
                user=request.user, topic__category=obj, is_completed=True
            ).count()
        return 0


class ProblemListSerializer(serializers.ModelSerializer):
    tags = serializers.SlugRelatedField(
        many=True, slug_field="name", queryset=Tag.objects.all(), required=False
    )
    acceptance_rate = serializers.IntegerField(read_only=True)
    user_status = serializers.SerializerMethodField()

    class Meta:
        model = Problem
        fields = [
            "id",
            "slug",
            "title_uz",
            "title_en",
            "difficulty",
            "tags",
            "visibility",
            "solved_count",
            "submission_count",
            "acceptance_rate",
            "user_status",
            "created_at",
        ]

    def get_user_status(self, obj) -> str:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return "unsolved"
        submissions = Submission.objects.filter(user=request.user, problem=obj)
        if submissions.filter(status=Submission.Status.ACCEPTED).exists():
            return "solved"
        if submissions.exists():
            return "attempted"
        return "unsolved"


class ProblemDetailSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    tags = serializers.SlugRelatedField(
        many=True, slug_field="name", queryset=Tag.objects.all(), required=False
    )
    acceptance_rate = serializers.IntegerField(read_only=True)
    user_status = serializers.SerializerMethodField()
    hidden_test_cases = serializers.SerializerMethodField()

    class Meta:
        model = Problem
        fields = [
            "id",
            "slug",
            "title_uz",
            "title_en",
            "statement_uz",
            "statement_en",
            "difficulty",
            "tags",
            "starter_code",
            "sample_test_cases",
            "hidden_test_cases",
            "author",
            "author_username",
            "visibility",
            "solved_count",
            "submission_count",
            "acceptance_rate",
            "user_status",
            "created_at",
        ]
        read_only_fields = [
            "author",
            "visibility",
            "solved_count",
            "submission_count",
        ]

    def get_user_status(self, obj) -> str:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return "unsolved"
        submissions = Submission.objects.filter(user=request.user, problem=obj)
        if submissions.filter(status=Submission.Status.ACCEPTED).exists():
            return "solved"
        if submissions.exists():
            return "attempted"
        return "unsolved"

    def get_hidden_test_cases(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            if request.user.role in [User.Role.ADMIN, User.Role.SUPERADMIN] or obj.author == request.user:
                return obj.hidden_test_cases
        return []


class LessonSerializer(serializers.ModelSerializer):
    topic_slug = serializers.SlugRelatedField(
        source="topic",
        slug_field="slug",
        queryset=Topic.objects.all(),
        required=False,
    )
    topic_title = serializers.CharField(source="topic.title_uz", read_only=True)
    category_slug = serializers.CharField(source="topic.category.slug", read_only=True)
    category_title = serializers.CharField(source="topic.category.title_uz", read_only=True)
    author_username = serializers.CharField(source="created_by.username", read_only=True)
    is_completed = serializers.SerializerMethodField()
    related_problem_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=Problem.objects.all(),
        source="related_problems",
        required=False,
    )
    related_problems_detail = ProblemListSerializer(source="related_problems", many=True, read_only=True)

    class Meta:
        model = Lesson
        fields = [
            "id",
            "topic",
            "topic_slug",
            "topic_title",
            "category_slug",
            "category_title",
            "slug",
            "title_uz",
            "title_en",
            "summary_uz",
            "summary_en",
            "content_uz",
            "content_en",
            "order",
            "visibility",
            "source_url",
            "source_author",
            "source_license",
            "is_imported",
            "created_by",
            "author_username",
            "related_problem_ids",
            "related_problems_detail",
            "is_completed",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_by", "visibility"]
        extra_kwargs = {
            "topic": {"required": False},
            "slug": {"required": False, "allow_blank": True},
            "title_en": {"required": False, "allow_blank": True},
            "summary_uz": {"required": False, "allow_blank": True},
            "summary_en": {"required": False, "allow_blank": True},
            "content_uz": {"required": False, "allow_blank": True},
            "content_en": {"required": False, "allow_blank": True},
            "visibility": {"required": False},
        }

    def validate(self, attrs):
        if "topic" not in attrs and not self.instance:
            first_topic = Topic.objects.first()
            if first_topic:
                attrs["topic"] = first_topic
            else:
                raise serializers.ValidationError({"topic": "Mavzu mavjud emas. Avval mavzu yarating."})

        title_uz = attrs.get("title_uz") or (self.instance.title_uz if self.instance else "")
        title_en = attrs.get("title_en") or (self.instance.title_en if self.instance else "")
        if not title_uz and not title_en:
            raise serializers.ValidationError({"title_uz": "Dars nomi kiritilishi shart."})
        if not title_uz:
            attrs["title_uz"] = title_en
        if not title_en:
            attrs["title_en"] = title_uz

        content_uz = attrs.get("content_uz") or (self.instance.content_uz if self.instance else "")
        content_en = attrs.get("content_en") or (self.instance.content_en if self.instance else "")
        if content_uz:
            attrs["content_uz"] = sanitize_html(content_uz)
        else:
            attrs["content_uz"] = content_en or "Dars mazmuni."
        if content_en:
            attrs["content_en"] = sanitize_html(content_en)
        else:
            attrs["content_en"] = attrs["content_uz"]

        slug = attrs.get("slug")
        if not slug and not self.instance:
            base_slug = slugify(attrs.get("title_en") or attrs.get("title_uz") or "lesson")
            if not base_slug:
                import uuid
                base_slug = f"lesson-{uuid.uuid4().hex[:6]}"
            slug = base_slug
            counter = 1
            while Lesson.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            attrs["slug"] = slug
        elif slug:
            existing = Lesson.objects.filter(slug=slug)
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            if existing.exists():
                raise serializers.ValidationError({"slug": f"'{slug}' nomli dars URL allaqachon mavjud."})

        request = self.context.get("request")
        if request and not is_admin_or_above(request.user):
            attrs.pop("visibility", None)

        return attrs

    def get_is_completed(self, obj) -> bool:
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return UserLessonProgress.objects.filter(
                user=request.user, lesson=obj, is_completed=True
            ).exists()
        return False


class TestCaseSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source="group.name", read_only=True)

    class Meta:
        model = TestCase
        fields = [
            "id",
            "version",
            "group",
            "group_name",
            "input_data",
            "expected_output",
            "is_sample",
            "order",
            "explanation",
            "time_limit_override_ms",
            "created_at",
        ]
        read_only_fields = ["version", "created_at"]


class TestGroupSerializer(serializers.ModelSerializer):
    test_case_count = serializers.IntegerField(source="test_cases.count", read_only=True)

    class Meta:
        model = TestGroup
        fields = [
            "id",
            "version",
            "name",
            "order",
            "weight",
            "test_case_count",
        ]
        read_only_fields = ["version"]


class ValidationResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValidationResult
        fields = [
            "id",
            "test_case",
            "case_order",
            "is_sample",
            "status",
            "runtime_ms",
            "actual_output",
            "expected_output",
            "error_message",
        ]


class ValidationRunSerializer(serializers.ModelSerializer):
    initiated_by_username = serializers.CharField(source="initiated_by.username", read_only=True)
    results = ValidationResultSerializer(many=True, read_only=True)

    class Meta:
        model = ValidationRun
        fields = [
            "id",
            "version",
            "initiated_by",
            "initiated_by_username",
            "reference_solution",
            "status",
            "total_cases",
            "passed_cases",
            "summary",
            "starter_code_valid",
            "checker_valid",
            "created_at",
            "completed_at",
            "results",
        ]
        read_only_fields = [
            "version",
            "initiated_by",
            "status",
            "total_cases",
            "passed_cases",
            "summary",
            "starter_code_valid",
            "checker_valid",
            "created_at",
            "completed_at",
        ]


class ProblemVersionSerializer(serializers.ModelSerializer):
    test_cases = TestCaseSerializer(many=True, read_only=True)
    test_groups = TestGroupSerializer(many=True, read_only=True)
    latest_validation = serializers.SerializerMethodField()
    problem_slug = serializers.CharField(source="problem.slug", read_only=True)
    problem_title_uz = serializers.CharField(source="problem.title_uz", read_only=True)
    problem_title_en = serializers.CharField(source="problem.title_en", read_only=True)

    class Meta:
        model = ProblemVersion
        fields = [
            "id",
            "problem",
            "problem_slug",
            "problem_title_uz",
            "problem_title_en",
            "version_number",
            "status",
            "execution_mode",
            "function_signature",
            "starter_templates",
            "statement_uz",
            "statement_en",
            "input_description_uz",
            "output_description_uz",
            "constraints",
            "time_limit_ms",
            "memory_limit_mb",
            "checker_type",
            "float_tolerance",
            "custom_checker_code",
            "reference_solution",
            "reference_language",
            "is_published",
            "created_by",
            "created_at",
            "updated_at",
            "test_cases",
            "test_groups",
            "latest_validation",
        ]
        read_only_fields = [
            "problem",
            "version_number",
            "status",
            "is_published",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def get_latest_validation(self, obj):
        latest = obj.validation_runs.first()
        if latest:
            return ValidationRunSerializer(latest).data
        return None

    def validate(self, attrs):
        for field in ["statement_uz", "statement_en", "input_description_uz", "output_description_uz", "constraints"]:
            if field in attrs and attrs[field]:
                attrs[field] = sanitize_html(attrs[field])
        return attrs


class ProblemAuthoringDetailSerializer(serializers.ModelSerializer):
    tags = TagListField(required=False)
    versions = ProblemVersionSerializer(many=True, read_only=True)
    active_version = serializers.SerializerMethodField()
    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Problem
        fields = [
            "id",
            "slug",
            "title_uz",
            "title_en",
            "difficulty",
            "tags",
            "visibility",
            "author",
            "author_username",
            "created_at",
            "versions",
            "active_version",
        ]

    def get_active_version(self, obj):
        v = obj.versions.filter(is_published=False).first() or obj.versions.first()
        if v:
            return ProblemVersionSerializer(v).data
        return None


class ProblemAdminSerializer(serializers.ModelSerializer):
    tags = TagListField(required=False)

    class Meta:
        model = Problem
        fields = "__all__"
        read_only_fields = ["author", "solved_count", "submission_count"]
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
            "title_en": {"required": False, "allow_blank": True},
            "title_uz": {"required": False, "allow_blank": True},
            "statement_en": {"required": False, "allow_blank": True},
            "statement_uz": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        title_uz = attrs.get("title_uz") or (self.instance.title_uz if self.instance else "")
        title_en = attrs.get("title_en") or (self.instance.title_en if self.instance else "")

        if not title_uz and not title_en:
            raise serializers.ValidationError({"title_uz": "Masala nomi kiritilishi shart."})

        if not title_uz:
            attrs["title_uz"] = title_en
        if not title_en:
            attrs["title_en"] = title_uz

        statement_uz = attrs.get("statement_uz") or (self.instance.statement_uz if self.instance else "")
        statement_en = attrs.get("statement_en") or (self.instance.statement_en if self.instance else "")

        if not statement_uz and not statement_en:
            raise serializers.ValidationError({"statement_uz": "Masala sharti kiritilishi shart."})

        if not statement_uz:
            attrs["statement_uz"] = statement_en
        if not statement_en:
            attrs["statement_en"] = statement_uz

        slug = attrs.get("slug")
        if not slug and not self.instance:
            base_slug = slugify(attrs.get("title_en") or attrs.get("title_uz") or "problem")
            if not base_slug:
                import uuid
                base_slug = f"prob-{uuid.uuid4().hex[:6]}"
            slug = base_slug
            counter = 1
            while Problem.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            attrs["slug"] = slug
        elif slug:
            existing = Problem.objects.filter(slug=slug)
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            if existing.exists():
                raise serializers.ValidationError({"slug": f"'{slug}' nomli URL (slug) allaqachon mavjud. Boshqa nom tanlang."})

        request = self.context.get("request")
        if "visibility" in attrs:
            if not request or not request.user.is_authenticated or request.user.role not in [User.Role.ADMIN, User.Role.SUPERADMIN]:
                if self.instance and self.instance.visibility != attrs["visibility"]:
                    attrs.pop("visibility")

        return attrs

    def create(self, validated_data):
        tags = validated_data.pop("tags", None)
        sample_cases = validated_data.get("sample_test_cases", [])
        hidden_cases = validated_data.get("hidden_test_cases", [])
        instance = super().create(validated_data)
        if tags is not None:
            instance.tags.set(tags)

        from .services import generate_starter_templates
        default_sig = {
            "name": "solve",
            "params": [{"name": "inp", "type": "str"}],
            "return_type": "str"
        }
        templates = generate_starter_templates("function", default_sig)
        if instance.starter_code:
            templates["python3"] = instance.starter_code

        v = ProblemVersion.objects.create(
            problem=instance,
            version_number=1,
            status=ProblemVersion.Status.DRAFT,
            execution_mode=ProblemVersion.ExecutionMode.FUNCTION,
            function_signature=default_sig,
            starter_templates=templates,
            statement_uz=instance.statement_uz,
            statement_en=instance.statement_en,
            created_by=instance.author,
        )

        order = 1
        for sc in (sample_cases or []):
            TestCase.objects.create(
                version=v,
                input_data=sc.get("input", ""),
                expected_output=sc.get("output", ""),
                explanation=sc.get("explanation", ""),
                is_sample=True,
                order=order,
            )
            order += 1

        for hc in (hidden_cases or []):
            TestCase.objects.create(
                version=v,
                input_data=hc.get("input", ""),
                expected_output=hc.get("output", ""),
                is_sample=False,
                order=order,
            )
            order += 1

        return instance

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        instance = super().update(instance, validated_data)
        if tags is not None:
            instance.tags.set(tags)
        return instance


class ContestSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    status = serializers.CharField(read_only=True)
    end_time = serializers.DateTimeField(read_only=True)
    problem_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=Problem.objects.all(),
        source="problems",
        required=False,
    )
    problems_detail = ProblemListSerializer(source="problems", many=True, read_only=True)
    standings = serializers.SerializerMethodField()

    class Meta:
        model = Contest
        fields = [
            "id",
            "slug",
            "title_uz",
            "title_en",
            "announcement_uz",
            "announcement_en",
            "rules_uz",
            "rules_en",
            "division",
            "is_rated",
            "start_time",
            "duration_minutes",
            "end_time",
            "status",
            "author",
            "author_username",
            "visibility",
            "ratings_calculated",
            "problem_ids",
            "problem_order",
            "problems_detail",
            "standings",
            "created_at",
        ]
        read_only_fields = ["author", "visibility", "ratings_calculated"]
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
            "title_en": {"required": False, "allow_blank": True},
            "announcement_en": {"required": False, "allow_blank": True},
            "announcement_uz": {"required": False, "allow_blank": True},
            "rules_uz": {"required": False, "allow_blank": True},
            "rules_en": {"required": False, "allow_blank": True},
            "problem_order": {"required": False},
        }

    def validate(self, attrs):
        title_uz = attrs.get("title_uz") or (self.instance.title_uz if self.instance else "")
        title_en = attrs.get("title_en") or (self.instance.title_en if self.instance else "")

        if not title_uz and not title_en:
            raise serializers.ValidationError({"title_uz": "Musobaqa nomi kiritilishi shart."})

        if not title_uz:
            attrs["title_uz"] = title_en
        if not title_en:
            attrs["title_en"] = title_uz

        ann_uz = attrs.get("announcement_uz") or (self.instance.announcement_uz if self.instance else "")
        ann_en = attrs.get("announcement_en") or (self.instance.announcement_en if self.instance else "")

        if not ann_uz:
            attrs["announcement_uz"] = ann_en or "Musobaqa qoidalari va tavsifi."
        if not ann_en:
            attrs["announcement_en"] = attrs["announcement_uz"]

        if attrs.get("announcement_uz"):
            attrs["announcement_uz"] = sanitize_html(attrs["announcement_uz"])
        if attrs.get("announcement_en"):
            attrs["announcement_en"] = sanitize_html(attrs["announcement_en"])
        if attrs.get("rules_uz"):
            attrs["rules_uz"] = sanitize_html(attrs["rules_uz"])
        if attrs.get("rules_en"):
            attrs["rules_en"] = sanitize_html(attrs["rules_en"])

        duration = attrs.get("duration_minutes")
        if duration is not None:
            if duration < 10 or duration > 10080:
                raise serializers.ValidationError(
                    {"duration_minutes": "Musobaqa davomiyligi 10 daqiqadan 10080 daqiqagacha (7 kun) bo'lishi kerak."}
                )

        # Completed contest immutability
        if self.instance and (self.instance.status == "past" or self.instance.ratings_calculated):
            if "start_time" in attrs and attrs["start_time"] != self.instance.start_time:
                raise serializers.ValidationError({"start_time": "Yakunlangan musobaqa boshlanish vaqtini o'zgartirib bo'lmaydi."})
            if "duration_minutes" in attrs and attrs["duration_minutes"] != self.instance.duration_minutes:
                raise serializers.ValidationError({"duration_minutes": "Yakunlangan musobaqa davomiyligini o'zgartirib bo'lmaydi."})
            if "problems" in attrs:
                existing_pids = set(self.instance.problems.values_list("id", flat=True))
                new_pids = set(p.id for p in attrs["problems"])
                if existing_pids != new_pids:
                    raise serializers.ValidationError({"problem_ids": "Yakunlangan musobaqa masalalarini o'zgartirish mumkin emas."})

        slug = attrs.get("slug")
        if not slug and not self.instance:
            base_slug = slugify(attrs.get("title_en") or attrs.get("title_uz") or "contest")
            if not base_slug:
                import uuid
                base_slug = f"contest-{uuid.uuid4().hex[:6]}"
            slug = base_slug
            counter = 1
            while Contest.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            attrs["slug"] = slug
        elif slug:
            existing = Contest.objects.filter(slug=slug)
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            if existing.exists():
                raise serializers.ValidationError({"slug": f"'{slug}' nomli musobaqa URL (slug) allaqachon mavjud."})

        # Validate problem authorization
        request = self.context.get("request")
        user = getattr(request, "user", None)
        problems_to_check = attrs.get("problems")
        if problems_to_check is not None:
            for prob in problems_to_check:
                if prob.visibility != VisibilityStatus.PUBLIC and prob.author != user:
                    if not user or not is_admin_or_above(user):
                        raise serializers.ValidationError(
                            {"problem_ids": f"Boshqa muallifga tegishli xususiy '{prob.title_uz or prob.title_en}' masalasini musobaqaga qo'shish huquqi yo'q."}
                        )

        return attrs

    def get_standings(self, obj):
        if obj.status == "upcoming":
            return []
        parts = ContestParticipation.objects.filter(contest=obj).select_related("user").order_by("-score", "penalty_minutes", "id")
        return [
            {
                "rank": idx + 1,
                "user_id": p.user.id,
                "username": p.user.username,
                "solved": p.solved_problems.count(),
                "score": p.score,
                "penalty": p.penalty_minutes,
                "rating_before": p.rating_before,
                "rating_after": p.rating_after,
            }
            for idx, p in enumerate(parts)
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        is_privileged = user and user.is_authenticated and (
            is_admin_or_above(user) or instance.author == user
        )
        if instance.status == "upcoming" and not is_privileged:
            data["problems_detail"] = []
        elif data.get("problems_detail") and instance.problem_order:
            order_map = {item.get("problem_id"): item for item in instance.problem_order if isinstance(item, dict)}
            for prob_dict in data["problems_detail"]:
                item = order_map.get(prob_dict.get("id"))
                if item:
                    prob_dict["points"] = item.get("points", 100)
                    prob_dict["order"] = item.get("order", 0)
        return data

    def validate_problems(self, problems):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        for prob in problems:
            if prob.visibility != VisibilityStatus.PUBLIC and prob.author != user:
                if not user or not is_admin_or_above(user):
                    raise serializers.ValidationError(
                        f"Boshqa muallifga tegishli xususiy '{prob.title_uz or prob.title_en}' masalasini musobaqaga qo'shish huquqi yo'q."
                    )
        return problems


class SubmissionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    problem_title = serializers.CharField(source="problem.title_en", read_only=True)
    problem_slug = serializers.CharField(source="problem.slug", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id",
            "user",
            "username",
            "problem",
            "problem_title",
            "problem_slug",
            "contest",
            "code",
            "language",
            "status",
            "passed_cases",
            "total_cases",
            "runtime_ms",
            "error_output",
            "created_at",
        ]
        read_only_fields = [
            "user",
            "status",
            "passed_cases",
            "total_cases",
            "runtime_ms",
            "error_output",
            "created_at",
        ]


class ContestParticipationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ContestParticipation
        fields = [
            "id",
            "contest",
            "user",
            "username",
            "score",
            "penalty_minutes",
            "rating_before",
            "rating_after",
            "rank",
        ]


class DiscussionCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = DiscussionComment
        fields = ["id", "discussion", "user", "username", "content", "created_at"]
        read_only_fields = ["discussion", "user", "created_at"]

    def validate_content(self, value):
        return sanitize_html(value) if value else value


class DiscussionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    comments = DiscussionCommentSerializer(many=True, read_only=True)
    comments_count = serializers.IntegerField(source="comments.count", read_only=True)

    class Meta:
        model = Discussion
        fields = [
            "id",
            "problem",
            "user",
            "username",
            "title",
            "content",
            "comments_count",
            "comments",
            "created_at",
        ]
        read_only_fields = ["problem", "user", "created_at"]

    def validate_title(self, value):
        from html import escape
        return escape(value.strip()) if value else value

    def validate_content(self, value):
        return sanitize_html(value) if value else value


class PublicationRequestSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    reviewer_username = serializers.CharField(source="reviewer.username", read_only=True)
    target_title = serializers.SerializerMethodField()
    target_slug = serializers.SerializerMethodField()

    class Meta:
        model = PublicationRequest
        fields = [
            "id",
            "request_type",
            "problem",
            "contest",
            "lesson",
            "target_title",
            "target_slug",
            "author",
            "author_username",
            "status",
            "reviewer",
            "reviewer_username",
            "reviewed_at",
            "feedback",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "author",
            "status",
            "reviewer",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]

    def get_target_title(self, obj):
        if obj.request_type == "problem" and obj.problem:
            return obj.problem.title_uz or obj.problem.title_en
        if obj.request_type == "contest" and obj.contest:
            return obj.contest.title_uz or obj.contest.title_en
        if obj.request_type == "lesson" and obj.lesson:
            return obj.lesson.title_uz or obj.lesson.title_en
        return ""

    def get_target_slug(self, obj):
        if obj.request_type == "problem" and obj.problem:
            return obj.problem.slug
        if obj.request_type == "contest" and obj.contest:
            return obj.contest.slug
        if obj.request_type == "lesson" and obj.lesson:
            return obj.lesson.slug
        return ""

