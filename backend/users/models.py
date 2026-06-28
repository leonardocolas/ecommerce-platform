from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('USER', 'User'),
        ('PROVIDER', 'Provider'),
        ('STAFF', 'Staff'),
        ('ADMIN', 'Admin'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='USER')

    def __str__(self):
        return self.username