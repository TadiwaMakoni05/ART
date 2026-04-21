from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    PatientViewSet, MedicationViewSet, AdherenceViewSet,
    ProviderDashboardView, SyncDataView, ChatbotView,
    MyTokenObtainPairView, GamificationViewSet, QuoteView, AnalyticsView,
    AdminDashboardView, AdminUserViewSet, ProviderViewSet, MessageViewSet,
    PrescriptionViewSet, ViralLoadResultViewSet, DownloadReportView,
    AIChatView, PushSubscribeView, PredictViralLoadView
)

router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')
router.register(r'medications', MedicationViewSet, basename='medication')
router.register(r'adherence', AdherenceViewSet, basename='adherence')
router.register(r'gamification', GamificationViewSet, basename='gamification')
router.register(r'admin/users', AdminUserViewSet, basename='admin-users')
router.register(r'providers-list', ProviderViewSet, basename='providers-list')
router.register(r'messages', MessageViewSet, basename='messages')
router.register(r'viral-loads', ViralLoadResultViewSet, basename='viral-loads')

urlpatterns = [
    path('auth/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('providers/me/dashboard/', ProviderDashboardView.as_view(), name='provider-dashboard'),
    path('sync/', SyncDataView.as_view(), name='sync-data'),
    path('chatbot/', ChatbotView.as_view(), name='chatbot'),
    path('patient/ai-chat/', AIChatView.as_view(), name='ai-chat'),

    path('learn/home-quotes/', QuoteView.as_view(), name='home-quotes'),
    path('patients/me/analytics/', AnalyticsView.as_view(), name='patient-analytics'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    
    path('reports/<int:pk>/download/', DownloadReportView.as_view(), name='download-report'),
    
    path('push/subscribe/', PushSubscribeView.as_view(), name='push-subscribe'),
    path('predict-viral-load/', PredictViralLoadView.as_view(), name='predict-viral-load'),
    
    path('', include(router.urls)),
]
