from django.db import migrations, models


def populate_profile_defaults(apps, schema_editor):
    User = apps.get_model('users', 'User')
    for user in User.objects.all().iterator():
        changed = []
        if not user.first_name:
            user.first_name = user.username
            changed.append('first_name')
        if not user.last_name:
            user.last_name = 'Usuario'
            changed.append('last_name')
        if not user.email:
            user.email = f'{user.username}@example.invalid'
            changed.append('email')
        if changed:
            user.save(update_fields=changed)


class Migration(migrations.Migration):
    dependencies = [('users', '0002_savedaddress')]

    operations = [
        migrations.AddField(
            model_name='user',
            name='profile_image',
            field=models.ImageField(blank=True, default='userdefaultpic.avif', upload_to='profiles/'),
        ),
        migrations.RunPython(populate_profile_defaults, migrations.RunPython.noop),
    ]