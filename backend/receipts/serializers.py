from rest_framework import serializers
from django.conf import settings
from PIL import Image, UnidentifiedImageError
from .models import Receipt


class ReceiptSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Receipt
        fields = [
            'id', 'image', 'vendor_name', 'total_amount', 'receipt_date',
            'category', 'description', 'raw_text', 'vendor_confidence', 
            'amount_confidence', 'date_confidence', 'ocr_provider', 'ocr_model',
            'ocr_validation_warnings', 'line_items', 'status', 'error_message',
            'expense', 'user_name', 'created_at', 'updated_at', 'processed_at'
        ]
        read_only_fields = [
            'vendor_name', 'total_amount', 'receipt_date', 'category', 
            'description', 'raw_text', 'vendor_confidence', 'amount_confidence', 
            'date_confidence', 'ocr_provider', 'ocr_model', 'ocr_validation_warnings',
            'line_items', 'status', 'error_message', 'processed_at'
        ]


class ReceiptUploadSerializer(serializers.ModelSerializer):
    image = serializers.FileField()

    class Meta:
        model = Receipt
        fields = ['image']

    def validate_image(self, image):
        max_size = settings.RECEIPT_MAX_UPLOAD_SIZE_BYTES
        if image.size > max_size:
            raise serializers.ValidationError(
                f'Receipt image must be {settings.RECEIPT_MAX_UPLOAD_SIZE_MB} MB or smaller.'
            )

        content_type = getattr(image, 'content_type', '')
        if content_type not in settings.RECEIPT_ALLOWED_CONTENT_TYPES:
            raise serializers.ValidationError('Unsupported receipt image type.')

        try:
            image.file.seek(0)
            with Image.open(image.file) as candidate:
                candidate.verify()
        except (UnidentifiedImageError, OSError):
            raise serializers.ValidationError('Uploaded file is not a valid image.')
        finally:
            image.file.seek(0)

        return image
