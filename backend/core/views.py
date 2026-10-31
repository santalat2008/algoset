from datetime import timedelta
from django.db import transaction
from django.db.models import Q, F, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView


class AuthRateThrottle(AnonRateThrottle):
    scope = "auth"


class ExecutionRateThrottle(UserRateThrottle):
    scope = "execution"


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
from .permissions import (
    IsAdminOrAbove,
    IsAuthorOrAbove,
    is_admin_or_above,
    is_superadmin,
)
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    AlgoSetTokenObtainPairSerializer,
    TagSerializer,
    TopicCategorySerializer,
    TopicSerializer,
    LessonSerializer,
    ProblemListSerializer,
    ProblemDetailSerializer,
    ProblemAdminSerializer,
    ProblemAuthoringDetailSerializer,
    ProblemVersionSerializer,
    TestCaseSerializer,
    TestGroupSerializer,
    ValidationRunSerializer,
    ValidationResultSerializer,
    ContestSerializer,
    SubmissionSerializer,
    ContestParticipationSerializer,
    DiscussionSerializer,
    DiscussionCommentSerializer,
    PublicationRequestSerializer,
)
from .services import (
    send_verification_email,
    run_python_code,
    evaluate_python_submission,
    update_contest_ratings,
    record_user_activity,
    generate_starter_templates,
    compare_outputs,
    validate_problem_version,
    generate_testcase_outputs,
    import_testcases_from_zip,
    publish_problem_version,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def perform_create(self, serializer):
        user = serializer.save()
        send_verification_email(user)


class AlgoSetLoginView(TokenObtainPairView):
    serializer_class = AlgoSetTokenObtainPairSerializer
    throttle_classes = [AuthRateThrottle]


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def _verify(self, request):
        token = request.data.get("token") or request.query_params.get("token")
        if not token:
            return Response({"detail": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)
        user = get_object_or_404(User, verification_token=token)
        if user.is_email_verified:
            return Response(
                {"detail": "Email manzili allaqachon tasdiqlangan.", "username": user.username},
                status=status.HTTP_200_OK,
            )
        import uuid
        user.is_email_verified = True
        user.verification_token = uuid.uuid4()
        user.save()
        return Response(
            {"detail": "Email verified successfully.", "username": user.username},
            status=status.HTTP_200_OK,
        )

    def get(self, request):
        return self._verify(request)

    def post(self, request):
        return self._verify(request)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        solved_ids = list(
            Submission.objects.filter(user=user, status=Submission.Status.ACCEPTED)
            .values_list("problem_id", flat=True)
            .distinct()
        )
        total_problems = Problem.objects.filter(visibility=VisibilityStatus.PUBLIC).count()
        total_contests = Contest.objects.filter(visibility=VisibilityStatus.PUBLIC).count()
        total_topics = Topic.objects.count()
        completed_topics = UserTopicProgress.objects.filter(user=user, is_completed=True).count()
        recent_submissions = Submission.objects.filter(user=user).select_related("problem")[:10]

        data = UserSerializer(user).data
        data["solved_problems_count"] = len(solved_ids)
        data["contests_joined_count"] = ContestParticipation.objects.filter(user=user).count()
        data["tutorials_progress"] = {"completed": completed_topics, "total": total_topics}
        data["problems_progress"] = {"solved": len(solved_ids), "total": total_problems}
        data["contests_progress"] = {"joined": data["contests_joined_count"], "total": total_contests}
        data["recent_activity"] = SubmissionSerializer(recent_submissions, many=True).data
        return Response(data)

    def patch(self, request):
        user = request.user
        data = request.data
        if "first_name" in data:
            user.first_name = data["first_name"]
        if "last_name" in data:
            user.last_name = data["last_name"]
        if "preferred_language" in data:
            user.preferred_language = data["preferred_language"]
        if "email" in data and data["email"] != user.email:
            new_email = data["email"].strip()
            if User.objects.filter(email=new_email).exclude(id=user.id).exists():
                return Response(
                    {"detail": "Ushbu email manzili boshqa hisob tomonidan band qilingan."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.email = new_email
            user.is_email_verified = False
            send_verification_email(user)
        if "password" in data and data["password"]:
            current_password = data.get("current_password")
            if not current_password or not user.check_password(current_password):
                return Response(
                    {"detail": "Joriy parol kiritilmadi yoki noto'g'ri."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            new_password = str(data["password"])
            if len(new_password) < 8:
                return Response(
                    {"detail": "Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            from django.contrib.auth.password_validation import validate_password
            from django.core.exceptions import ValidationError as DjangoValidationError
            try:
                validate_password(new_password, user)
            except DjangoValidationError as ve:
                return Response(
                    {"detail": ve.messages[0] if ve.messages else "Parol xavfsizlik talablariga javob bermaydi."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.set_password(new_password)
        user.save()
        return self.get(request)


class PlatformStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "tutorials_count": Topic.objects.count(),
            "problems_count": Problem.objects.filter(visibility=VisibilityStatus.PUBLIC).count(),
            "contests_count": Contest.objects.filter(visibility=VisibilityStatus.PUBLIC).count(),
            "active_learners_count": User.objects.count(),
        })


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email and request.user.is_authenticated:
            email = request.user.email
        if not email:
            return Response(
                {"detail": "Email manzili kiritilishi shart."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = User.objects.filter(email__iexact=email).first()
        if user and not user.is_email_verified:
            send_verification_email(user)
        return Response({
            "detail": "Agar ushbu email manzili ro'yxatdan o'tgan bo'lsa, tasdiqlash xabari yuborildi.",
            "is_email_verified": False,
        })


class UserManagementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrAbove]
    queryset = User.objects.all().order_by("-id")
    serializer_class = UserSerializer
    filterset_fields = ["role", "is_email_verified"]
    search_fields = ["username", "email"]
    pagination_class = None

    @action(detail=True, methods=["post"])
    def set_role(self, request, pk=None):
        target_user = self.get_object()
        new_role = request.data.get("role")
        if new_role not in dict(User.Role.choices):
            return Response({"detail": "Invalid role."}, status=status.HTTP_400_BAD_REQUEST)
        if not is_superadmin(request.user):
            if new_role not in [User.Role.STUDENT, User.Role.AUTHOR] or target_user.role in [
                User.Role.ADMIN,
                User.Role.SUPERADMIN,
            ]:
                return Response(
                    {"detail": "Only Superadmins can manage Admin or Superadmin roles."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        if target_user.role == User.Role.SUPERADMIN and new_role != User.Role.SUPERADMIN:
            active_superadmins = User.objects.filter(role=User.Role.SUPERADMIN, is_active=True).exclude(id=target_user.id).count()
            if active_superadmins == 0:
                return Response(
                    {"detail": "Yagona faol superadmin hisobining rolini pasaytirish mumkin emas."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        target_user.role = new_role
        target_user.save()
        return Response(UserSerializer(target_user).data)

    def update(self, request, *args, **kwargs):
        target_user = self.get_object()
        new_role = request.data.get("role")
        if new_role and new_role != target_user.role:
            if not is_superadmin(request.user):
                if new_role not in [User.Role.STUDENT, User.Role.AUTHOR] or target_user.role in [
                    User.Role.ADMIN,
                    User.Role.SUPERADMIN,
                ]:
                    return Response(
                        {"detail": "Only Superadmins can manage Admin or Superadmin roles."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            if target_user.role == User.Role.SUPERADMIN and new_role != User.Role.SUPERADMIN:
                active_superadmins = (
                    User.objects.filter(role=User.Role.SUPERADMIN, is_active=True)
                    .exclude(id=target_user.id)
                    .count()
                )
                if active_superadmins == 0:
                    return Response(
                        {"detail": "Yagona faol superadmin hisobining rolini pasaytirish mumkin emas."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
        if "is_active" in request.data:
            is_active_val = request.data.get("is_active")
            if (is_active_val is False or str(is_active_val).lower() == "false") and target_user.role == User.Role.SUPERADMIN:
                active_superadmins = (
                    User.objects.filter(role=User.Role.SUPERADMIN, is_active=True)
                    .exclude(id=target_user.id)
                    .count()
                )
                if active_superadmins == 0:
                    return Response(
                        {"detail": "Yagona faol superadmin hisobini faolsizlantirish (is_active=False) mumkin emas."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        target_user = self.get_object()
        if not is_superadmin(request.user):
            return Response(
                {"detail": "Faqat superadmin foydalanuvchini o'chira oladi."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if target_user.role == User.Role.SUPERADMIN:
            active_superadmins = User.objects.filter(role=User.Role.SUPERADMIN, is_active=True).exclude(id=target_user.id).count()
            if active_superadmins == 0:
                return Response(
                    {"detail": "Yagona faol superadmin hisobini o'chirish mumkin emas."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def verify_email(self, request, pk=None):
        target_user = self.get_object()
        target_user.is_email_verified = True
        target_user.save()
        return Response({"detail": "Email verified.", "is_email_verified": True})


class RoleManagementView(APIView):
    permission_classes = [IsAdminOrAbove]

    def post(self, request, user_id):
        target_user = get_object_or_404(User, id=user_id)
        new_role = request.data.get("role")

        if new_role not in dict(User.Role.choices):
            return Response(
                {"detail": "Invalid role."}, status=status.HTTP_400_BAD_REQUEST
            )

        if not is_superadmin(request.user):
            if new_role not in [User.Role.STUDENT, User.Role.AUTHOR] or target_user.role in [
                User.Role.ADMIN,
                User.Role.SUPERADMIN,
            ]:
                return Response(
                    {"detail": "Only Superadmins can manage Admin or Superadmin roles."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        if target_user.role == User.Role.SUPERADMIN and new_role != User.Role.SUPERADMIN:
            active_superadmins = User.objects.filter(role=User.Role.SUPERADMIN, is_active=True).exclude(id=target_user.id).count()
            if active_superadmins == 0:
                return Response(
                    {"detail": "Yagona faol superadmin hisobining rolini pasaytirish mumkin emas."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        target_user.role = new_role
        target_user.save()
        return Response(UserSerializer(target_user).data, status=status.HTTP_200_OK)



class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.annotate(
        problem_count=Count(
            "problems",
            filter=Q(problems__visibility=VisibilityStatus.PUBLIC)
        )
    ).all()
    serializer_class = TagSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class TopicCategoryViewSet(viewsets.ModelViewSet):
    queryset = TopicCategory.objects.prefetch_related("topics").all()
    serializer_class = TopicCategorySerializer
    lookup_field = "slug"
    pagination_class = None

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        if self.action == "complete":
            return [IsAuthenticated()]
        if self.action == "studio_stats":
            return [IsAuthorOrAbove()]
        return [IsAdminOrAbove()]

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        if category.topics.exists():
            return Response(
                {"detail": f"Ushbu toifada {category.topics.count()} ta mavzu mavjud. O'chirishdan oldin ularni boshqa toifaga ko'chiring yoki o'chiring."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthorOrAbove])
    def studio_stats(self, request):
        user = request.user
        total_cats = TopicCategory.objects.count()
        active_cats = TopicCategory.objects.filter(is_active=True).count()
        total_topics = Topic.objects.count()

        if is_admin_or_above(user):
            lessons_qs = Lesson.objects.all()
        else:
            lessons_qs = Lesson.objects.filter(Q(visibility=VisibilityStatus.PUBLIC) | Q(created_by=user))

        total_lessons = lessons_qs.count()
        published_lessons = lessons_qs.filter(visibility=VisibilityStatus.PUBLIC).count()
        private_lessons = lessons_qs.filter(visibility=VisibilityStatus.PRIVATE).count()
        pending_lessons = lessons_qs.filter(visibility=VisibilityStatus.PENDING).count()

        return Response({
            "categories_count": total_cats,
            "active_categories_count": active_cats,
            "topics_count": total_topics,
            "lessons_count": total_lessons,
            "published_lessons_count": published_lessons,
            "private_lessons_count": private_lessons,
            "pending_lessons_count": pending_lessons,
        })


class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.select_related("category", "created_by").all()
    serializer_class = TopicSerializer
    lookup_field = "slug"
    pagination_class = None

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        if self.action == "complete":
            return [IsAuthenticated()]
        return [IsAuthorOrAbove()]

    def get_queryset(self):
        user = self.request.user
        qs = Topic.objects.select_related("category", "created_by").prefetch_related("lessons")
        cat_slug = self.request.query_params.get("category_slug") or self.request.query_params.get("category")
        if cat_slug:
            qs = qs.filter(category__slug=cat_slug)
        if not user.is_authenticated or user.role == User.Role.STUDENT:
            return qs.filter(visibility=VisibilityStatus.PUBLIC)
        if is_admin_or_above(user):
            return qs.all()
        if user.role == User.Role.AUTHOR:
            return qs.filter(Q(visibility=VisibilityStatus.PUBLIC) | Q(created_by=user))
        return qs.filter(visibility=VisibilityStatus.PUBLIC)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        topic = self.get_object()
        if not is_admin_or_above(request.user) and topic.created_by != request.user:
            return Response({"detail": "Ruxsat etilmagan."}, status=status.HTTP_403_FORBIDDEN)
        if topic.lessons.exists():
            return Response(
                {"detail": f"Ushbu mavzuda {topic.lessons.count()} ta dars mavjud. O'chirishdan oldin ularni o'chiring yoki boshqa mavzuga ko'chiring."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def complete(self, request, slug=None):
        topic = self.get_object()
        progress, created = UserTopicProgress.objects.get_or_create(
            user=request.user, topic=topic
        )
        if not created:
            progress.is_completed = not progress.is_completed
            progress.save()
        record_user_activity(request.user, is_accepted=False)
        return Response({"is_completed": progress.is_completed})


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    lookup_field = "slug"
    permission_classes = [IsAuthorOrAbove]
    pagination_class = None

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        if self.action == "complete":
            return [IsAuthenticated()]
        if self.action == "review_request":
            return [IsAdminOrAbove()]
        return [IsAuthorOrAbove()]

    def get_queryset(self):
        user = self.request.user
        qs = Lesson.objects.select_related("topic", "topic__category", "created_by").prefetch_related("related_problems")

        cat_slug = self.request.query_params.get("category_slug") or self.request.query_params.get("category")
        if cat_slug:
            qs = qs.filter(topic__category__slug=cat_slug)

        topic_slug = self.request.query_params.get("topic_slug") or self.request.query_params.get("topic")
        if topic_slug:
            qs = qs.filter(topic__slug=topic_slug)

        visibility_param = self.request.query_params.get("visibility")
        if visibility_param:
            qs = qs.filter(visibility=visibility_param)

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(title_uz__icontains=search)
                | Q(title_en__icontains=search)
                | Q(summary_uz__icontains=search)
                | Q(summary_en__icontains=search)
            )

        if not user.is_authenticated or user.role == User.Role.STUDENT:
            return qs.filter(visibility=VisibilityStatus.PUBLIC)
        if is_admin_or_above(user):
            return qs.all()
        if user.role == User.Role.AUTHOR:
            return qs.filter(Q(visibility=VisibilityStatus.PUBLIC) | Q(created_by=user))
        return qs.filter(visibility=VisibilityStatus.PUBLIC)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, visibility=VisibilityStatus.PRIVATE)

    def destroy(self, request, *args, **kwargs):
        lesson = self.get_object()
        if not is_admin_or_above(request.user) and lesson.created_by != request.user:
            return Response({"detail": "Ruxsat etilmagan."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthorOrAbove])
    def request_public(self, request, slug=None):
        lesson = self.get_object()
        if lesson.created_by != request.user and not is_admin_or_above(request.user):
            return Response({"detail": "Faqat muallif nashr so'rovini yuborishi mumkin."}, status=status.HTTP_403_FORBIDDEN)
        lesson.visibility = VisibilityStatus.PENDING
        lesson.save()

        pub_req, _ = PublicationRequest.objects.get_or_create(
            request_type=PublicationRequest.RequestType.LESSON,
            lesson=lesson,
            status=PublicationRequest.Status.PENDING,
            defaults={"author": lesson.created_by or request.user},
        )
        return Response({"status": lesson.visibility, "request_id": pub_req.id})

    @action(detail=True, methods=["post"], permission_classes=[IsAdminOrAbove])
    def review_request(self, request, slug=None):
        lesson = self.get_object()
        decision = request.data.get("decision")
        feedback = request.data.get("feedback") or request.data.get("reason", "")
        now = timezone.now()

        pub_req = PublicationRequest.objects.filter(
            request_type=PublicationRequest.RequestType.LESSON,
            lesson=lesson,
            status=PublicationRequest.Status.PENDING,
        ).first()

        if decision == "approve":
            lesson.visibility = VisibilityStatus.PUBLIC
            if pub_req:
                pub_req.status = PublicationRequest.Status.APPROVED
                pub_req.reviewer = request.user
                pub_req.reviewed_at = now
                pub_req.feedback = feedback
                pub_req.save()
        elif decision == "deny":
            lesson.visibility = VisibilityStatus.REJECTED
            if pub_req:
                pub_req.status = PublicationRequest.Status.REJECTED
                pub_req.reviewer = request.user
                pub_req.reviewed_at = now
                pub_req.feedback = feedback
                pub_req.save()
        else:
            return Response(
                {"detail": "Noto'g'ri qaror (decision). 'approve' yoki 'deny' bo'lishi kerak."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        lesson.save()
        return Response({"status": lesson.visibility})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def complete(self, request, slug=None):
        lesson = self.get_object()
        progress, created = UserLessonProgress.objects.get_or_create(
            user=request.user, lesson=lesson
        )
        if not created:
            progress.is_completed = not progress.is_completed
            progress.save()
        record_user_activity(request.user, is_accepted=False)
        return Response({"is_completed": progress.is_completed})


class ProblemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthorOrAbove]
    lookup_field = "slug"
    filterset_fields = ["difficulty", "visibility"]
    search_fields = ["title_uz", "title_en", "tags__name", "tags__slug"]

    def get_serializer_class(self):
        if self.action == "list":
            return ProblemListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return ProblemAdminSerializer
        return ProblemDetailSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Problem.objects.prefetch_related("tags").select_related("author")

        tag_param = self.request.query_params.get("tag")
        if tag_param:
            qs = qs.filter(Q(tags__slug=tag_param) | Q(tags__name__iexact=tag_param))

        if not user.is_authenticated:
            return qs.filter(visibility=VisibilityStatus.PUBLIC)
        if self.action in [
            "authoring", "create_version", "version_detail", "version_testcases",
            "testcase_detail", "upload_testcases_zip", "generate_outputs",
            "validate_version", "validation_status", "publish_version"
        ]:
            return qs.all()
        if is_admin_or_above(user):
            return qs.all()
        if user.role == User.Role.AUTHOR:
            return qs.filter(Q(visibility=VisibilityStatus.PUBLIC) | Q(author=user))
        return qs.filter(visibility=VisibilityStatus.PUBLIC)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, visibility=VisibilityStatus.PRIVATE)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def tags(self, request):
        tags = Tag.objects.annotate(
            problem_count=Count(
                "problems",
                filter=Q(problems__visibility=VisibilityStatus.PUBLIC)
            )
        ).filter(problem_count__gt=0)
        return Response(TagSerializer(tags, many=True).data)

    @action(detail=False, methods=["get"], permission_classes=[IsAdminOrAbove])
    def pending(self, request):
        qs = Problem.objects.filter(visibility=VisibilityStatus.PENDING)
        return Response(ProblemListSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthorOrAbove])
    def request_public(self, request, slug=None):
        problem = self.get_object()
        if problem.author != request.user and not is_admin_or_above(request.user):
            return Response(
                {"detail": "Only the author or admin can request public status."},
                status=status.HTTP_403_FORBIDDEN,
            )
        problem.visibility = VisibilityStatus.PENDING
        problem.save()

        pub_req, _ = PublicationRequest.objects.get_or_create(
            request_type=PublicationRequest.RequestType.PROBLEM,
            problem=problem,
            status=PublicationRequest.Status.PENDING,
            defaults={"author": problem.author or request.user},
        )
        return Response({"status": problem.visibility, "request_id": pub_req.id})

    @action(detail=True, methods=["post"], permission_classes=[IsAdminOrAbove])
    def review_request(self, request, slug=None):
        problem = self.get_object()
        decision = request.data.get("decision")
        feedback = request.data.get("feedback") or request.data.get("reason", "")
        now = timezone.now()

        pub_req = PublicationRequest.objects.filter(
            request_type=PublicationRequest.RequestType.PROBLEM,
            problem=problem,
            status=PublicationRequest.Status.PENDING,
        ).first()

        if decision == "approve":
            draft_v = problem.versions.filter(is_published=False).first()
            if draft_v and draft_v.validation_runs.filter(status=ValidationRun.Status.PASSED).exists():
                try:
                    publish_problem_version(draft_v, request.user)
                except Exception:
                    problem.visibility = VisibilityStatus.PUBLIC
                    problem.save()
            else:
                problem.visibility = VisibilityStatus.PUBLIC
                problem.save()

            if pub_req:
                pub_req.status = PublicationRequest.Status.APPROVED
                pub_req.reviewer = request.user
                pub_req.reviewed_at = now
                pub_req.feedback = feedback
                pub_req.save()
        elif decision == "deny":
            problem.visibility = VisibilityStatus.REJECTED
            problem.save()
            if pub_req:
                pub_req.status = PublicationRequest.Status.REJECTED
                pub_req.reviewer = request.user
                pub_req.reviewed_at = now
                pub_req.feedback = feedback
                pub_req.save()
        else:
            return Response(
                {"detail": "Decision must be 'approve' or 'deny'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"status": problem.visibility})


    def _check_problem_author_or_admin(self, problem, request):
        if not is_admin_or_above(request.user) and problem.author != request.user:
            return False
        return True

    def _get_or_create_draft_version(self, problem, user):
        v = problem.versions.filter(is_published=False).first()
        if not v:
            prev = problem.versions.order_by("-version_number").first()
            next_num = (prev.version_number + 1) if prev else 1
            default_sig = {
                "name": "solve",
                "params": [{"name": "inp", "type": "str"}],
                "return_type": "str"
            }
            templates = generate_starter_templates("function", default_sig)
            if problem.starter_code:
                templates["python3"] = problem.starter_code
            v = ProblemVersion.objects.create(
                problem=problem,
                version_number=next_num,
                status=ProblemVersion.Status.DRAFT,
                execution_mode=ProblemVersion.ExecutionMode.FUNCTION,
                function_signature=default_sig,
                starter_templates=templates,
                statement_uz=problem.statement_uz,
                statement_en=problem.statement_en,
                created_by=user,
            )
            if prev:
                v.execution_mode = prev.execution_mode
                v.function_signature = prev.function_signature
                v.starter_templates = prev.starter_templates
                v.checker_type = prev.checker_type
                v.float_tolerance = prev.float_tolerance
                v.custom_checker_code = prev.custom_checker_code
                v.reference_solution = prev.reference_solution
                v.time_limit_ms = prev.time_limit_ms
                v.memory_limit_mb = prev.memory_limit_mb
                v.save()
                for tc in prev.test_cases.all():
                    TestCase.objects.create(
                        version=v,
                        group=tc.group,
                        input_data=tc.input_data,
                        expected_output=tc.expected_output,
                        is_sample=tc.is_sample,
                        explanation=tc.explanation,
                        order=tc.order,
                    )
            else:
                order = 1
                for sc in (problem.sample_test_cases or []):
                    TestCase.objects.create(
                        version=v,
                        input_data=sc.get("input", ""),
                        expected_output=sc.get("output", ""),
                        is_sample=True,
                        explanation=sc.get("explanation", ""),
                        order=order,
                    )
                    order += 1
                for hc in (problem.hidden_test_cases or []):
                    TestCase.objects.create(
                        version=v,
                        input_data=hc.get("input", ""),
                        expected_output=hc.get("output", ""),
                        is_sample=False,
                        order=order,
                    )
                    order += 1
        return v

    @action(detail=False, methods=["post"], permission_classes=[IsAuthorOrAbove])
    def generate_templates(self, request):
        mode = request.data.get("execution_mode", "function")
        sig = request.data.get("function_signature", {})
        templates = generate_starter_templates(mode, sig)
        return Response({"starter_templates": templates})

    @action(detail=True, methods=["get", "patch", "put"], permission_classes=[IsAuthorOrAbove])
    def authoring(self, request, slug=None):
        problem = self.get_object()
        if not self._check_problem_author_or_admin(problem, request):
            return Response({"detail": "Faqat muallif yoki admin ushbu masalani tahrirlashi mumkin."}, status=status.HTTP_403_FORBIDDEN)

        self._get_or_create_draft_version(problem, request.user)

        if request.method in ["PATCH", "PUT"]:
            data = request.data
            if "title_uz" in data:
                problem.title_uz = data["title_uz"]
            if "title_en" in data:
                problem.title_en = data["title_en"]
            if "difficulty" in data:
                problem.difficulty = data["difficulty"]
            if "tags" in data and isinstance(data["tags"], list):
                from django.utils.text import slugify
                tags_list = []
                for t in data["tags"]:
                    tname = t.strip() if isinstance(t, str) else ""
                    if tname:
                        tag_obj, _ = Tag.objects.get_or_create(name=tname, defaults={"slug": slugify(tname) or tname.lower()})
                        tags_list.append(tag_obj)
                problem.tags.set(tags_list)
            problem.save()

            draft = problem.versions.filter(is_published=False).first()
            if draft:
                for field in [
                    "statement_uz", "statement_en", "input_description_uz", "output_description_uz",
                    "constraints", "execution_mode", "function_signature", "starter_templates",
                    "checker_type", "float_tolerance", "custom_checker_code", "reference_solution",
                    "time_limit_ms", "memory_limit_mb"
                ]:
                    if field in data:
                        setattr(draft, field, data[field])
                draft.save()

        problem.refresh_from_db()
        return Response(ProblemAuthoringDetailSerializer(problem).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthorOrAbove])
    def create_version(self, request, slug=None):
        problem = self.get_object()
        if not self._check_problem_author_or_admin(problem, request):
            return Response({"detail": "Ruxsat etilmagan."}, status=status.HTTP_403_FORBIDDEN)

        existing_draft = problem.versions.filter(is_published=False).first()
        if existing_draft:
            return Response(ProblemVersionSerializer(existing_draft).data, status=status.HTTP_200_OK)

        prev = problem.versions.order_by("-version_number").first()
        next_num = (prev.version_number + 1) if prev else 1

        v = ProblemVersion.objects.create(
            problem=problem,
            version_number=next_num,
            status=ProblemVersion.Status.DRAFT,
            execution_mode=prev.execution_mode if prev else ProblemVersion.ExecutionMode.FUNCTION,
            function_signature=prev.function_signature if prev else {},
            starter_templates=prev.starter_templates if prev else {},
            statement_uz=prev.statement_uz if prev else problem.statement_uz,
            statement_en=prev.statement_en if prev else problem.statement_en,
            input_description_uz=prev.input_description_uz if prev else "",
            output_description_uz=prev.output_description_uz if prev else "",
            constraints=prev.constraints if prev else "",
            checker_type=prev.checker_type if prev else ProblemVersion.CheckerType.EXACT,
            float_tolerance=prev.float_tolerance if prev else 1e-6,
            custom_checker_code=prev.custom_checker_code if prev else "",
            reference_solution=prev.reference_solution if prev else "",
            time_limit_ms=prev.time_limit_ms if prev else 2000,
            memory_limit_mb=prev.memory_limit_mb if prev else 256,
            created_by=request.user,
        )
        if prev:
            for tc in prev.test_cases.all():
                TestCase.objects.create(
                    version=v,
                    group=tc.group,
                    input_data=tc.input_data,
                    expected_output=tc.expected_output,
                    is_sample=tc.is_sample,
                    explanation=tc.explanation,
                    order=tc.order,
                )
        return Response(ProblemVersionSerializer(v).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "patch"], url_path="versions/(?P<version_num>[^/.]+)", permission_classes=[IsAuthorOrAbove])
    def version_detail(self, request, slug=None, version_num=None):
        problem = self.get_object()
        if not self._check_problem_author_or_admin(problem, request):
            return Response({"detail": "Ruxsat etilmagan."}, status=status.HTTP_403_FORBIDDEN)

        version = get_object_or_404(ProblemVersion, problem=problem, version_number=version_num)

        if request.method == "PATCH":
            if version.is_published:
                return Response(
                    {"detail": "Nashr qilingan versiya o'zgarmasdir (immutable). O'zgartirish kiritish uchun yangi qoralama versiya yarating."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            data = request.data
            for field in [
                "statement_uz", "statement_en", "input_description_uz", "output_description_uz",
                "constraints", "execution_mode", "function_signature", "starter_templates",
                "checker_type", "float_tolerance", "custom_checker_code", "reference_solution",
                "time_limit_ms", "memory_limit_mb"
            ]:
                if field in data:
                    setattr(version, field, data[field])
            version.save()

        return Response(ProblemVersionSerializer(version).data)

    @action(detail=True, methods=["get", "post"], url_path="versions/(?P<version_num>[^/.]+)/testcases", permission_classes=[IsAuthorOrAbove])
    def version_testcases(self, request, slug=None, version_num=None):
        problem = self.get_object()
        if not self._check_problem_author_or_admin(problem, request):
            return Response({"detail": "Ruxsat etilmagan."}, status=status.HTTP_403_FORBIDDEN)

        version = get_object_or_404(ProblemVersion, problem=problem, version_number=version_num)

        if request.method == "POST":
            if version.is_published:
                return Response({"detail": "Nashr qilingan versiyaga test qo'shib bo'lmaydi."}, status=status.HTTP_400_BAD_REQUEST)
            data = request.data
            order = data.get("order")
            if not order:
                max_order = version.test_cases.order_by("-order").first()
                order = (max_order.order + 1) if max_order else 1
            tc = TestCase.objects.create(
                version=version,
                input_data=data.get("input_data", ""),
                expected_output=data.get("expected_output", ""),
                is_sample=data.get("is_sample", False),
                explanation=data.get("explanation", ""),
                order=order,
            )
            return Response(TestCaseSerializer(tc).data, status=status.HTTP_201_CREATED)

        cases = version.test_cases.all().order_by("order", "id")
        return Response(TestCaseSerializer(cases, many=True).data)

    @action(detail=True, methods=["get", "patch", "put", "delete"], url_path="versions/(?P<version_num>[^/.]+)/testcases/(?P<case_id>[^/.]+)", permission_classes=[IsAuthorOrAbove])
    def testcase_detail(self, request, slug=None, version_num=None, case_id=None):
        problem = self.get_object()
        if not self._check_problem_author_or_admin(problem, request):
            return Response({"detail": "Ruxsat etilmagan."}, status=status.HTTP_403_FORBIDDEN)

        version = get_object_or_404(ProblemVersion, problem=problem, version_number=version_num)
        case = get_object_or_404(TestCase, id=case_id, version=version)

        if request.method == "DELETE":
            if version.is_published:
                return Response({"detail": "Nashr qilingan versiyadagi testni o'chirib bo'lmaydi."}, status=status.HTTP_400_BAD_REQUEST)
            case.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        if request.method in ["PATCH", "PUT"]:
            if version.is_published:
                return Response({"detail": "Nashr qilingan versiyadagi testni o'zgartirib bo'lmaydi."}, status=status.HTTP_400_BAD_REQUEST)
            data = request.data
            for f in ["input_data", "expected_output", "is_sample", "order", "explanation", "time_limit_override_ms"]:
                if f in data:
                    setattr(case, f, data[f])
            case.save()

        return Response(TestCaseSerializer(case).data)

    @action(detail=True, methods=["post"], url_path="versions/(?P<version_num>[^/.]+)/upload_zip", permission_classes=[IsAuthorOrAbove])
    def upload_testcases_zip(self, request, slug=None, version_num=None):
        problem = self.get_object()
        if not self._check_problem_author_or_admin(problem, request):
            return Response({"detail": "Ruxsat etilmagan."}, status=status.HTTP_403_FORBIDDEN)

        version = get_object_or_404(ProblemVersion, problem=problem, version_number=version_num)
        if version.is_published:
            return Response({"detail": "Nashr qilingan versiyaga test yuklab bo'lmaydi."}, status=status.HTTP_400_BAD_REQUEST)

        zip_file = request.FILES.get("file") or request.FILES.get("zip_file")
        if not zip_file:
            return Response({"detail": "ZIP fayl tanlanmagan."}, status=status.HTTP_400_BAD_REQUEST)

        is_sample = request.data.get("is_sample") in [True, "true", "True", "1"]
        group_name = request.data.get("group_name")
        try:
            created = import_testcases_from_zip(version, zip_file, is_sample=is_sample, group_name=group_name)
            return Response({
                "detail": f"{len(created)} ta test keys muvaffaqiyatli import qilindi.",
                "count": len(created),
                "test_cases": TestCaseSerializer(created, many=True).data,
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="versions/(?P<version_num>[^/.]+)/generate_outputs", permission_classes=[IsAuthorOrAbove])
    def generate_outputs(self, request, slug=None, version_num=None):
        problem = self.get_object()
        if not self._check_problem_author_or_admin(problem, request):
            return Response({"detail": "Ruxsat etilmagan."}, status=status.HTTP_403_FORBIDDEN)

        version = get_object_or_404(ProblemVersion, problem=problem, version_number=version_num)
        if version.is_published:
            return Response({"detail": "Nashr qilingan versiyani o'zgartirib bo'lmaydi."}, status=status.HTTP_400_BAD_REQUEST)

        ref_code = request.data.get("reference_solution") or version.reference_solution
        try:
            results = generate_testcase_outputs(version, reference_code=ref_code)
            return Response({
                "detail": f"{len(results)} ta test uchun kutilgan natijalar generatsiya qilindi.",
                "results": results,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="versions/(?P<version_num>[^/.]+)/validate", permission_classes=[IsAuthorOrAbove])
    def validate_version(self, request, slug=None, version_num=None):
        problem = self.get_object()
        if not self._check_problem_author_or_admin(problem, request):
            return Response({"detail": "Ruxsat etilmagan."}, status=status.HTTP_403_FORBIDDEN)

        version = get_object_or_404(ProblemVersion, problem=problem, version_number=version_num)
        ref_code = request.data.get("reference_solution") or version.reference_solution
        wrong_code = request.data.get("wrong_solution")

        if ref_code and ref_code != version.reference_solution and not version.is_published:
            version.reference_solution = ref_code
            version.save(update_fields=["reference_solution"])

        run = validate_problem_version(version, reference_code=ref_code, wrong_code=wrong_code, user=request.user)
        return Response(ValidationRunSerializer(run).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="versions/(?P<version_num>[^/.]+)/validation_status", permission_classes=[IsAuthorOrAbove])
    def validation_status(self, request, slug=None, version_num=None):
        problem = self.get_object()
        if not self._check_problem_author_or_admin(problem, request):
            return Response({"detail": "Ruxsat etilmagan."}, status=status.HTTP_403_FORBIDDEN)

        version = get_object_or_404(ProblemVersion, problem=problem, version_number=version_num)
        runs = version.validation_runs.all()[:10]
        return Response(ValidationRunSerializer(runs, many=True).data)

    @action(detail=True, methods=["post"], url_path="versions/(?P<version_num>[^/.]+)/publish", permission_classes=[IsAuthorOrAbove])
    def publish_version(self, request, slug=None, version_num=None):
        problem = self.get_object()
        if not self._check_problem_author_or_admin(problem, request):
            return Response({"detail": "Ruxsat etilmagan."}, status=status.HTTP_403_FORBIDDEN)

        version = get_object_or_404(ProblemVersion, problem=problem, version_number=version_num)
        try:
            pub_v = publish_problem_version(version, user=request.user)
            return Response({
                "detail": f"{problem.slug} masalasi v{pub_v.version_number} muvaffaqiyatli nashr qilindi!",
                "version": ProblemVersionSerializer(pub_v).data,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated], throttle_classes=[ExecutionRateThrottle])
    def run(self, request, slug=None):
        problem = self.get_object()
        code = request.data.get("code", "")
        custom_input = request.data.get("custom_input")
        language = request.data.get("language", "python3")
        if language != "python3":
            return Response(
                {
                    "detail": f"'{language}' dasturlash tili hozirda ijro etilmaydi. Hozirda faqat Python 3 qo'llab-quvvatlanadi.",
                    "status": Submission.Status.RUNTIME_ERROR,
                    "error": f"'{language}' tili hozirda ijro etilmaydi. Faqat Python 3 mavjud.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = run_python_code(
            code=code,
            custom_input=custom_input,
            sample_test_cases=problem.sample_test_cases or [],
            language=language,
            problem=problem,
        )
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated], throttle_classes=[ExecutionRateThrottle])
    def submit(self, request, slug=None):
        problem = self.get_object()
        code = request.data.get("code", "")
        language = request.data.get("language", "python3")
        if language != "python3":
            return Response(
                {
                    "detail": f"'{language}' dasturlash tili hozirda ijro etilmaydi. Hozirda faqat Python 3 qo'llab-quvvatlanadi.",
                    "status": Submission.Status.RUNTIME_ERROR,
                    "error": f"'{language}' tili hozirda ijro etilmaydi. Faqat Python 3 mavjud.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        contest_id = request.data.get("contest_id")

        contest = None
        if contest_id:
            contest = Contest.objects.filter(id=contest_id).first()
            if not contest:
                return Response({"detail": "Contest not found."}, status=status.HTTP_404_NOT_FOUND)
            if contest.status != "ongoing":
                return Response({"detail": "Contest is not currently active."}, status=status.HTTP_400_BAD_REQUEST)
            if not contest.problems.filter(id=problem.id).exists():
                return Response({"detail": "Problem does not belong to this contest."}, status=status.HTTP_400_BAD_REQUEST)

        all_cases = (problem.sample_test_cases or []) + (problem.hidden_test_cases or [])
        result = evaluate_python_submission(code, all_cases, language=language, problem=problem)

        sub = Submission.objects.create(
            user=request.user,
            problem=problem,
            contest=contest,
            code=code,
            language=language,
            status=result["status"],
            passed_cases=result["passed"],
            total_cases=result["total"],
            runtime_ms=result.get("runtime_ms", 0),
            error_output=result.get("error", ""),
        )

        is_accepted = (result["status"] == Submission.Status.ACCEPTED)
        already_solved = Submission.objects.filter(
            user=request.user, problem=problem, status=Submission.Status.ACCEPTED
        ).exclude(id=sub.id).exists()

        Problem.objects.filter(id=problem.id).update(
            submission_count=F("submission_count") + 1,
            solved_count=F("solved_count") + (1 if (is_accepted and not already_solved) else 0)
        )
        problem.refresh_from_db()

        if is_accepted and contest:
            with transaction.atomic():
                part, _ = ContestParticipation.objects.select_for_update().get_or_create(
                    contest=contest,
                    user=request.user,
                    defaults={"rating_before": request.user.rating, "rating_after": request.user.rating},
                )
                if not part.solved_problems.filter(id=problem.id).exists():
                    part.solved_problems.add(problem)
                    part.score += 100
                    minutes_elapsed = max(0, int((timezone.now() - contest.start_time).total_seconds() / 60))
                    part.penalty_minutes += minutes_elapsed
                    part.save()

        record_user_activity(request.user, is_accepted=is_accepted)
        return Response(SubmissionSerializer(sub).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def submissions(self, request, slug=None):
        problem = self.get_object()
        user_subs = Submission.objects.filter(problem=problem, user=request.user)
        return Response(SubmissionSerializer(user_subs, many=True).data)

    @action(detail=True, methods=["get", "post"], permission_classes=[IsAuthenticatedOrReadOnly])
    def discussions(self, request, slug=None):
        problem = self.get_object()
        if request.method == "POST":
            serializer = DiscussionSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(user=request.user, problem=problem)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        discussions = Discussion.objects.filter(problem=problem).prefetch_related("comments")
        return Response(DiscussionSerializer(discussions, many=True).data)


    @action(detail=True, methods=["post"], url_path="discussions/(?P<disc_id>[^/.]+)/comments", permission_classes=[IsAuthenticated])
    def add_comment(self, request, slug=None, disc_id=None):
        problem = self.get_object()
        discussion = get_object_or_404(Discussion, id=disc_id, problem=problem)
        serializer = DiscussionCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, discussion=discussion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "problem__slug", "contest__id"]

    def get_queryset(self):
        user = self.request.user
        if is_admin_or_above(user):
            return Submission.objects.all().select_related("user", "problem", "contest")
        return Submission.objects.filter(user=user).select_related("user", "problem", "contest")


class ContestViewSet(viewsets.ModelViewSet):
    serializer_class = ContestSerializer
    permission_classes = [IsAuthorOrAbove]
    lookup_field = "slug"
    filterset_fields = ["division", "is_rated"]

    def get_queryset(self):
        user = self.request.user
        now = timezone.now()
        qs = Contest.objects.prefetch_related("problems").select_related("author")

        status_param = self.request.query_params.get("status")
        if status_param == "upcoming":
            qs = qs.filter(start_time__gt=now)
        elif status_param == "past":
            qs = [c for c in qs if c.end_time < now]
            qs_ids = [c.id for c in qs]
            qs = Contest.objects.filter(id__in=qs_ids).prefetch_related("problems").select_related("author")
        elif status_param == "ongoing":
            qs = [c for c in qs if c.start_time <= now <= c.end_time]
            qs_ids = [c.id for c in qs]
            qs = Contest.objects.filter(id__in=qs_ids).prefetch_related("problems").select_related("author")

        if not user.is_authenticated:
            return qs.filter(visibility=VisibilityStatus.PUBLIC)
        if is_admin_or_above(user):
            return qs.all()
        if user.role == User.Role.AUTHOR:
            return qs.filter(Q(visibility=VisibilityStatus.PUBLIC) | Q(author=user))
        return qs.filter(visibility=VisibilityStatus.PUBLIC)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, visibility=VisibilityStatus.PRIVATE)

    def destroy(self, request, *args, **kwargs):
        contest = self.get_object()
        if not is_admin_or_above(request.user) and contest.author != request.user:
            return Response({"detail": "Ruxsat etilmagan."}, status=status.HTTP_403_FORBIDDEN)
        if contest.status == "past" or contest.ratings_calculated:
            return Response(
                {"detail": "Yakunlangan yoki reyting hisoblangan musobaqani o'chirib bo'lmaydi."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if contest.submissions.exists():
            return Response(
                {"detail": "Ushbu musobaqada yuborilgan yechimlar mavjud. Uni o'chirish mumkin emas."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthorOrAbove])
    def studio_stats(self, request):
        user = request.user
        now = timezone.now()
        if is_admin_or_above(user):
            qs = Contest.objects.all()
        else:
            qs = Contest.objects.filter(Q(visibility=VisibilityStatus.PUBLIC) | Q(author=user))

        total = qs.count()
        public_count = qs.filter(visibility=VisibilityStatus.PUBLIC).count()
        private_count = qs.filter(visibility=VisibilityStatus.PRIVATE).count()
        draft_count = qs.filter(visibility=VisibilityStatus.PRIVATE).count()
        pending_count = qs.filter(visibility=VisibilityStatus.PENDING).count()
        rejected_count = qs.filter(visibility=VisibilityStatus.REJECTED).count()

        upcoming_count = qs.filter(start_time__gt=now).count()
        past_count = 0
        ongoing_count = 0
        for c in qs:
            if c.end_time < now:
                past_count += 1
            elif c.start_time <= now <= c.end_time:
                ongoing_count += 1

        return Response({
            "total": total,
            "public": public_count,
            "private": private_count,
            "draft": draft_count,
            "pending": pending_count,
            "rejected": rejected_count,
            "upcoming": upcoming_count,
            "ongoing": ongoing_count,
            "past": past_count,
        })

    @action(detail=False, methods=["get"], permission_classes=[IsAdminOrAbove])
    def pending(self, request):
        qs = Contest.objects.filter(visibility=VisibilityStatus.PENDING)
        return Response(ContestSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthorOrAbove])
    def request_public(self, request, slug=None):
        contest = self.get_object()
        if contest.author != request.user and not is_admin_or_above(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        contest.visibility = VisibilityStatus.PENDING
        contest.save()

        pub_req, _ = PublicationRequest.objects.get_or_create(
            request_type=PublicationRequest.RequestType.CONTEST,
            contest=contest,
            status=PublicationRequest.Status.PENDING,
            defaults={"author": contest.author or request.user},
        )
        return Response({"status": contest.visibility, "request_id": pub_req.id})

    @action(detail=True, methods=["post"], permission_classes=[IsAdminOrAbove])
    def review_request(self, request, slug=None):
        contest = self.get_object()
        decision = request.data.get("decision")
        feedback = request.data.get("feedback") or request.data.get("reason", "")
        now = timezone.now()

        pub_req = PublicationRequest.objects.filter(
            request_type=PublicationRequest.RequestType.CONTEST,
            contest=contest,
            status=PublicationRequest.Status.PENDING,
        ).first()

        if decision == "approve":
            contest.visibility = VisibilityStatus.PUBLIC
            if pub_req:
                pub_req.status = PublicationRequest.Status.APPROVED
                pub_req.reviewer = request.user
                pub_req.reviewed_at = now
                pub_req.feedback = feedback
                pub_req.save()
        elif decision == "deny":
            contest.visibility = VisibilityStatus.REJECTED
            if pub_req:
                pub_req.status = PublicationRequest.Status.REJECTED
                pub_req.reviewer = request.user
                pub_req.reviewed_at = now
                pub_req.feedback = feedback
                pub_req.save()
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        contest.save()
        return Response({"status": contest.visibility})


    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def join(self, request, slug=None):
        contest = self.get_object()
        if contest.status == "past":
            return Response({"detail": "Cannot join a past contest."}, status=status.HTTP_400_BAD_REQUEST)
        part, created = ContestParticipation.objects.get_or_create(
            contest=contest,
            user=request.user,
            defaults={"rating_before": request.user.rating, "rating_after": request.user.rating},
        )
        return Response(
            ContestParticipationSerializer(part).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAdminOrAbove])
    def finalize_ratings(self, request, slug=None):
        contest = self.get_object()
        if contest.status != "past" and not request.data.get("force"):
            return Response(
                {"detail": "Contest is still ongoing or upcoming."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            contest_locked = Contest.objects.select_for_update().get(id=contest.id)
            updated = update_contest_ratings(contest_locked)
        return Response(
            ContestParticipationSerializer(updated, many=True).data,
            status=status.HTTP_200_OK,
        )


class LeaderboardView(generics.ListAPIView):
    queryset = User.objects.order_by("-rating", "username")[:100]
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class PublicationRequestViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicationRequestSerializer
    permission_classes = [IsAuthorOrAbove]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return PublicationRequest.objects.none()
        if is_admin_or_above(user):
            qs = PublicationRequest.objects.select_related("problem", "contest", "lesson", "author", "reviewer").all()
        else:
            qs = PublicationRequest.objects.filter(author=user).select_related("problem", "contest", "lesson", "author", "reviewer")

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param.upper())
        req_type = self.request.query_params.get("type")
        if req_type:
            qs = qs.filter(request_type=req_type.lower())
        return qs

