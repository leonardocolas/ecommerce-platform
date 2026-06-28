from django.db import models


class Banner(models.Model):
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=300, blank=True, default='')
    description = models.TextField(blank=True, default='')
    image_url = models.URLField(max_length=500, blank=True, null=True)
    link_url = models.CharField(max_length=500, blank=True, default='')
    position = models.PositiveIntegerField(default=0, help_text='Orden de aparición')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['position', '-created_at']

    def __str__(self):
        return self.title
