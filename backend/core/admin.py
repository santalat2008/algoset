from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User,
    Tag,
    TopicCategory,
    Topic,
    UserTopicProgress,
    Problem,
    Contest,
    ContestParticipation,
    Submission,
    Discussion,
    DiscussionComment,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "is_email_verified", "rating", "streak_days", "xp")
    list_filter = ("role", "is_email_verified", "is_staff", "is_superuser")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("AlgoSet Info", {"fields": ("role", "is_email_verified", "rating", "max_rating", "xp", "streak_days", "last_active_date", "preferred_language")}),
    )


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "order")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(TopicCategory)
class TopicCategoryAdmin(admin.ModelAdmin):
    list_display = ("title_en", "slug", "group", "order")
    prepopulated_fields = {"slug": ("title_en",)}


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ("title_en", "category", "slug", "order", "created_by")
    list_filter = ("category",)
    prepopulated_fields = {"slug": ("title_en",)}


@admin.register(UserTopicProgress)
class UserTopicProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "topic", "is_completed", "completed_at")
    list_filter = ("is_completed",)


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display = ("title_en", "difficulty", "visibility", "solved_count", "submission_count", "acceptance_rate", "author")
    list_filter = ("difficulty", "visibility")
    search_fields = ("title_en", "title_uz", "slug")
    prepopulated_fields = {"slug": ("title_en",)}


@admin.register(Contest)
class ContestAdmin(admin.ModelAdmin):
    list_display = ("title_en", "division", "status", "is_rated", "start_time", "duration_minutes", "author", "visibility")
    list_filter = ("division", "is_rated", "visibility")
    prepopulated_fields = {"slug": ("title_en",)}


@admin.register(ContestParticipation)
class ContestParticipationAdmin(admin.ModelAdmin):
    list_display = ("contest", "user", "score", "penalty_minutes", "rank", "rating_before", "rating_after")
    list_filter = ("contest",)


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("user", "problem", "contest", "status", "passed_cases", "total_cases", "runtime_ms", "created_at")
    list_filter = ("status", "created_at")


@admin.register(Discussion)
class DiscussionAdmin(admin.ModelAdmin):
    list_display = ("title", "problem", "user", "created_at")
    search_fields = ("title", "content")


@admin.register(DiscussionComment)
class DiscussionCommentAdmin(admin.ModelAdmin):
    list_display = ("discussion", "user", "created_at")
