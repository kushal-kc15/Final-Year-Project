"""
Tesseract OCR configuration for Windows
"""
import os
import pytesseract

# Set Tesseract path for Windows
TESSERACT_PATH = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
    print(f"✓ Tesseract configured at: {TESSERACT_PATH}")
else:
    print(f"✗ Tesseract not found at: {TESSERACT_PATH}")
    print("  Please install Tesseract or update the path in receipts/tesseract_config.py")
