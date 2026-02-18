from django.apps import AppConfig


class AdherenceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'adherence'

    def ready(self):
        import adherence.signals
