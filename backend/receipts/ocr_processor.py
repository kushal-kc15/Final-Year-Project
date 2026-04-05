import re
import pytesseract
from PIL import Image
from datetime import datetime
from decimal import Decimal, InvalidOperation
import cv2
import numpy as np

# Import Tesseract configuration
try:
    from .tesseract_config import TESSERACT_PATH
except ImportError:
    pass


class OCRProcessor:
    """
    Process receipt images and extract structured data using OCR
    """
    
    def __init__(self, image_path):
        self.image_path = image_path
        self.raw_text = ""
        
    def preprocess_image(self):
        """
        Preprocess image for better OCR accuracy
        """
        # Read image
        img = cv2.imread(self.image_path)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply thresholding to get black and white image
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)
        
        return denoised
    
    def extract_text(self):
        """
        Extract raw text from image using Tesseract OCR
        """
        try:
            # Preprocess image
            processed_img = self.preprocess_image()
            
            # Perform OCR
            self.raw_text = pytesseract.image_to_string(processed_img)
            
            return self.raw_text
        except Exception as e:
            print(f"OCR extraction error: {e}")
            # Fallback to basic PIL OCR
            img = Image.open(self.image_path)
            self.raw_text = pytesseract.image_to_string(img)
            return self.raw_text
    
    def extract_vendor(self):
        """
        Extract vendor name (prioritize company names, ignore generic words)
        Returns: (vendor_name, confidence)
        """
        lines = [line.strip() for line in self.raw_text.split('\n') if line.strip()]
        
        if not lines:
            return None, 0
        
        # Words to ignore when looking for vendor names
        ignore_words = {
            'receipt', 'invoice', 'bill', 'tax', 'total', 'subtotal',
            'payment', 'cash', 'credit', 'debit', 'date', 'time',
            'qty', 'quantity', 'description', 'amount', 'price', 'logo'
        }
        
        # Look for company indicators
        company_indicators = ['inc', 'llc', 'ltd', 'corp', 'company', 'co.', 'pvt']
        
        # Search in first 10 lines for vendor
        for line in lines[:10]:
            line_lower = line.lower()
            
            # Skip if line is just a generic word
            if line_lower in ignore_words:
                continue
            
            # Skip lines that are mostly numbers or symbols
            if len(re.findall(r'[a-zA-Z]', line)) < len(line) * 0.5:
                continue
            
            # Skip lines with date patterns (to avoid including dates in vendor name)
            if re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{4}|\d{8}', line):
                # But check if there's a company name before the date
                parts = re.split(r'\s+(?:RECEIPT\s+)?DATE\s+\d', line, flags=re.IGNORECASE)
                if len(parts) > 1 and len(parts[0].strip()) > 3:
                    vendor = re.sub(r'[^a-zA-Z0-9\s&\'\-\.,]', '', parts[0]).strip()
                    if any(indicator in vendor.lower() for indicator in company_indicators):
                        return vendor, 95
                continue
            
            # High confidence if contains company indicator
            if any(indicator in line_lower for indicator in company_indicators):
                vendor = re.sub(r'[^a-zA-Z0-9\s&\'\-\.,]', '', line).strip()
                if len(vendor) > 2:
                    return vendor, 95
            
            # Look for "FROM" section (common in receipts)
            if 'from' in line_lower:
                # Get the next line after "FROM"
                idx = lines.index(line)
                if idx + 1 < len(lines):
                    next_line = lines[idx + 1]
                    if len(next_line) > 2 and next_line.lower() not in ignore_words:
                        # Clean up: remove date patterns from vendor name
                        vendor = next_line
                        # Remove everything after DATE keyword
                        vendor = re.split(r'\s+(?:RECEIPT\s+)?DATE\s+', vendor, flags=re.IGNORECASE)[0]
                        # Remove date patterns
                        vendor = re.sub(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{4}|\d{8}', '', vendor)
                        # Clean special characters
                        vendor = re.sub(r'[^a-zA-Z0-9\s&\'\-\.,]', '', vendor).strip()
                        if len(vendor) > 2:
                            return vendor, 90
            
            # Medium confidence for lines with mostly letters
            if len(re.findall(r'[a-zA-Z]', line)) > len(line) * 0.7:
                vendor = re.sub(r'[^a-zA-Z0-9\s&\'\-\.,]', '', line).strip()
                if len(vendor) > 3 and vendor.lower() not in ignore_words:
                    return vendor, 70
        
        return lines[0] if lines else None, 40
    
    def extract_amount(self):
        """
        Extract total amount (improved pattern matching)
        Returns: (amount, confidence)
        """
        # Common patterns for total amount
        patterns = [
            # TOTAL with amount on same line
            r'total[:\s]*[\$रू€£]?\s*(\d+[,.]?\d*\.?\d{2})',
            # Amount after TOTAL keyword
            r'total.*?(\d+[,.]?\d*\.?\d{2})',
            # Grand total
            r'grand\s*total[:\s]*[\$रू€£]?\s*(\d+[,.]?\d*\.?\d{2})',
            # Amount due
            r'amount\s*due[:\s]*[\$रू€£]?\s*(\d+[,.]?\d*\.?\d{2})',
            # Balance due
            r'balance[:\s]*[\$रू€£]?\s*(\d+[,.]?\d*\.?\d{2})',
            # Total amount
            r'total\s*amount[:\s]*[\$रू€£]?\s*(\d+[,.]?\d*\.?\d{2})',
            # Currency symbol followed by amount at end of line
            r'[\$रू€£]\s*(\d+[,.]?\d*\.?\d{2})\s*$',
        ]
        
        text_lower = self.raw_text.lower()
        lines = text_lower.split('\n')
        
        # First, look for explicit TOTAL lines
        for line in lines:
            if 'total' in line and 'subtotal' not in line:
                for pattern in patterns[:6]:  # Use total-specific patterns
                    matches = re.findall(pattern, line, re.IGNORECASE)
                    if matches:
                        amount_str = matches[-1].replace(',', '').replace(' ', '')
                        try:
                            amount = Decimal(amount_str)
                            if 0 < amount < 1000000:
                                return amount, 95
                        except (InvalidOperation, ValueError):
                            continue
        
        # Then search entire text
        for pattern in patterns:
            matches = re.findall(pattern, text_lower, re.IGNORECASE | re.MULTILINE)
            if matches:
                amount_str = matches[-1].replace(',', '').replace(' ', '')
                try:
                    amount = Decimal(amount_str)
                    if 0 < amount < 1000000:
                        confidence = 85 if 'total' in pattern else 70
                        return amount, confidence
                except (InvalidOperation, ValueError):
                    continue
        
        # Fallback: find largest number that looks like money
        all_numbers = re.findall(r'\d+[,.]?\d*\.?\d{2}', self.raw_text)
        if all_numbers:
            try:
                amounts = [Decimal(n.replace(',', '')) for n in all_numbers]
                amounts = [a for a in amounts if 0 < a < 1000000]
                if amounts:
                    return max(amounts), 50
            except:
                pass
        
        return None, 0
    
    def extract_date(self):
        """
        Extract receipt date - always returns today's date
        Returns: (date, confidence)
        """
        # Always use today's date when expense is added
        return datetime.now().date(), 100
    
    def extract_line_items(self):
        """
        Extract individual line items from receipt (improved table detection)
        Returns: list of dicts with {description, quantity, unit_price, amount}
        """
        items = []
        lines = self.raw_text.split('\n')
        
        # Look for table headers
        in_items_section = False
        for i, line in enumerate(lines):
            line_lower = line.lower()
            
            # Detect start of items section
            if any(keyword in line_lower for keyword in ['qty', 'description', 'item', 'product']):
                in_items_section = True
                continue
            
            # Detect end of items section
            if any(keyword in line_lower for keyword in ['subtotal', 'total', 'tax', 'payment']):
                in_items_section = False
                continue
            
            if in_items_section or not items:  # Always try to extract items
                # Pattern 1: QTY Description Price Amount
                match = re.search(r'^(\d+)\s+(.+?)\s+(\d+\.?\d*)\s+(\d+\.?\d*)$', line.strip())
                if match:
                    qty, desc, price, amount = match.groups()
                    items.append({
                        'quantity': int(qty),
                        'description': desc.strip(),
                        'unit_price': float(price),
                        'amount': float(amount)
                    })
                    continue
                
                # Pattern 2: Description followed by amount at end
                match = re.search(r'^(.+?)\s+(\d+\.?\d{2})$', line.strip())
                if match and len(match.group(1)) > 3:
                    desc, amount = match.groups()
                    # Skip if description looks like a total line
                    if not any(word in desc.lower() for word in ['total', 'subtotal', 'tax', 'due', 'balance']):
                        try:
                            amount_val = float(amount)
                            if 0 < amount_val < 10000:
                                items.append({
                                    'quantity': 1,
                                    'description': desc.strip(),
                                    'unit_price': amount_val,
                                    'amount': amount_val
                                })
                        except ValueError:
                            continue
        
        return items[:20]  # Limit to 20 items
    
    def process(self):
        """
        Main processing method - extract all data
        Returns: dict with extracted data
        """
        # Extract raw text first
        self.extract_text()
        
        # Extract structured data
        vendor, vendor_conf = self.extract_vendor()
        amount, amount_conf = self.extract_amount()
        date, date_conf = self.extract_date()
        line_items = self.extract_line_items()
        
        return {
            'raw_text': self.raw_text,
            'vendor_name': vendor,
            'vendor_confidence': vendor_conf,
            'total_amount': amount,
            'amount_confidence': amount_conf,
            'receipt_date': date,
            'date_confidence': date_conf,
            'line_items': line_items,
        }
