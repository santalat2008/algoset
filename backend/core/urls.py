from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView,
    VerifyEmailView,
    ResendVerificationView,
    MeView,
    PlatformStatsView,
    RoleManagementView,
    UserManagementViewSet,
    TagViewSet,
    TopicCategoryViewSet,
    TopicViewSet,
    LessonViewSet,
    ProblemViewSet,
    ContestViewSet,
    SubmissionViewSet,
    LeaderboardView,
    PublicationRequestViewSet,
    AlgoSetLoginView,
)

router = DefaultRouter()
router.register("users", UserManagementViewSet, basename="user")
router.register("categories", TopicCategoryViewSet, basename="category")
router.register("topics", TopicViewSet, basename="topic")
router.register("lessons", LessonViewSet, basename="lesson")
router.register("tags", TagViewSet, basename="tag")
router.register("problems", ProblemViewSet, basename="problem")
router.register("contests", ContestViewSet, basename="contest")
router.register("submissions", SubmissionViewSet, basename="submission")
router.register("publication-requests", PublicationRequestViewSet, basename="publication-request")


urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("auth/resend-verification/", ResendVerificationView.as_view(), name="resend-verification"),
    path("auth/login/", AlgoSetLoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("stats/", PlatformStatsView.as_view(), name="stats"),
    path("users/<int:user_id>/role/", RoleManagementView.as_view(), name="manage-role"),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
    path("", include(router.urls)),
]
