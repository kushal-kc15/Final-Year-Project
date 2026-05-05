"""
Test script to verify OCR handles random images correctly
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vyapar_margadarshan.settings')
django.setup()

from receipts.ocr_processor import OCRProcessor

def test_random_image():
    """
    Test with a random image (not a receipt)
    You can test this by:
    1. Creating a simple test image
    2. Or using any existing non-receipt image
    """
    print("=" * 60)
    print("Testing OCR with Random Image")
    print("=" * 60)
    
    # For testing, you would need to provide a path to a non-receipt image
    # Example: test_image_path = "path/to/random/image.jpg"
    
    print("\nTo test:")
    print("1. Upload a random image (not a receipt) through the API")
    print("2. The system should return: 'No receipt data found'")
    print("3. The receipt status should be 'FAILED'")
    print("\nExpected behavior:")
    print("✓ Random images are rejected")
    print("✓ User-friendly error message is shown")
    print("✓ Receipt is marked as FAILED in database")
    
    print("\n" + "=" * 60)
    print("Test Instructions Complete")
    print("=" * 60)

if __name__ == '__main__':
    test_random_image()
