from rest_framework import permissions

class IsProvider(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'provider'

class IsPatient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'patient'

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsOwnerOrProvider(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model instance has an `owner` attribute.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        # if request.method in permissions.SAFE_METHODS:
        #     return True

        if request.user.role == 'provider':
             # Providers can see/edit their linked patients data
             # Need to implement check if patient is linked to provider
             if hasattr(obj, 'patient'):
                 return obj.patient.provider_link.provider == request.user
             elif hasattr(obj, 'user'): # PatientProfile
                 return obj.provider_link.provider == request.user
             return False

        if request.user.role == 'patient':
            # Patients can only see their own data
             if hasattr(obj, 'patient'):
                 return obj.patient.user == request.user
             elif hasattr(obj, 'user'): # PatientProfile
                 return obj.user == request.user
             return False
        
        return request.user.is_staff
