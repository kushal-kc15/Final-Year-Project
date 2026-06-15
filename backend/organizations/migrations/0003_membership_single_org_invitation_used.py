# Generated for Phase 2 membership hardening.

from django.db import migrations, models


def sync_invitation_usage(apps, schema_editor):
    Invitation = apps.get_model('organizations', 'Invitation')
    Invitation.objects.filter(status='ACCEPTED').update(is_used=True)


def collapse_existing_memberships(apps, schema_editor):
    Membership = apps.get_model('organizations', 'Membership')
    User = apps.get_model('users', 'User')

    user_ids = Membership.objects.values_list('user_id', flat=True).distinct()

    for user_id in user_ids:
        memberships = list(
            Membership.objects.filter(user_id=user_id).order_by('joined_at', 'id')
        )
        if not memberships:
            continue

        user = User.objects.filter(id=user_id).first()
        active_org_id = getattr(user, 'active_organization_id', None)
        keep = next(
            (membership for membership in memberships if membership.organization_id == active_org_id),
            memberships[0],
        )

        delete_ids = [membership.id for membership in memberships if membership.id != keep.id]
        if delete_ids:
            Membership.objects.filter(id__in=delete_ids).delete()

        if user and user.active_organization_id != keep.organization_id:
            user.active_organization_id = keep.organization_id
            user.save(update_fields=['active_organization'])

    users_with_memberships = Membership.objects.values_list('user_id', flat=True)
    User.objects.exclude(active_organization__isnull=True).exclude(
        id__in=users_with_memberships
    ).update(active_organization=None)


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_user_active_organization'),
        ('organizations', '0002_remove_manager_role'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='OrganizationMember',
            new_name='Membership',
        ),
        migrations.AddField(
            model_name='organization',
            name='address',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='organization',
            name='city',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='organization',
            name='contact_email',
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AddField(
            model_name='organization',
            name='country',
            field=models.CharField(blank=True, default='Nepal', max_length=100),
        ),
        migrations.AddField(
            model_name='organization',
            name='industry',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='organization',
            name='legal_name',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='organization',
            name='phone_number',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='organization',
            name='registration_number',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='organization',
            name='tax_id',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='invitation',
            name='is_used',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(sync_invitation_usage, migrations.RunPython.noop),
        migrations.RunPython(collapse_existing_memberships, migrations.RunPython.noop),
        migrations.AlterUniqueTogether(
            name='membership',
            unique_together={('user',)},
        ),
    ]
