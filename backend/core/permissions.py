from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import User


def is_author_or_above(user: User) -> bool:
    return bool(
        user
        and user.is_authenticated
        and user.role in [User.Role.AUTHOR, User.Role.ADMIN, User.Role.SUPERADMIN]
    )


def is_admin_or_above(user: User) -> bool:
    return bool(
        user
        and user.is_authenticated
        and user.role in [User.Role.ADMIN, User.Role.SUPERADMIN]
    )


def is_superadmin(user: User) -> bool:
    return bool(
        user and user.is_authenticated and user.role == User.Role.SUPERADMIN
    )


class IsAdminOrAbove(BasePermission):
    def has_permission(self, request, view):
        return is_admin_or_above(request.user)

    def has_object_permission(self, request, view, obj):
        return is_admin_or_above(request.user)


class IsAuthorOrAbove(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return is_author_or_above(request.user)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if is_admin_or_above(request.user):
            return True
        owner = getattr(obj, "author", None) or getattr(obj, "created_by", None)
        return owner == request.user


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_superadmin(request.user)

    def has_object_permission(self, request, view, obj):
        return is_superadmin(request.user)


class IsOwnerOrAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if is_admin_or_above(request.user):
            return True
        return getattr(obj, "user", None) == request.user
