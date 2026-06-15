from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_user_active_organization'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='email_verification_token_created_at',
            field=models.DateTimeField(
                blank=True,
                help_text='When the current email verification token was issued',
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name='user',
            name='email_verification_token',
            field=models.CharField(
                blank=True,
                help_text='Hashed token for email verification',
                max_length=100,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name='passwordresettoken',
            name='token',
            field=models.CharField(help_text='Hashed password reset token', max_length=100, unique=True),
        ),
        migrations.AlterField(
            model_name='twofactorotp',
            name='otp_code',
            field=models.CharField(help_text='Hashed OTP code', max_length=64),
        ),
    ]
