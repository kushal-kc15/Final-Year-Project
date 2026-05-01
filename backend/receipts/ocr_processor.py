import re
from datetime import datetime
from decimal import Decimal
import os
import time

import google.generativeai as genai
from PIL import Image


class OCRProcessor:
    """
    Process receipt images and extract structured data using Google Gemini API
    """
    
    def __init__(self, image_path):
        self.image_path = image_path
        
        # Get Gemini API key
        from decouple import config
        self.gemini_api_key = config('GEMINI_API_KEY')
        genai.configure(api_key=self.gemini_api_key)
        
        # Try different model names in order of preference
        self.model_names = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro-vision',
        ]
        
        self.model = None
        for model_name in self.model_names:
            try:
                self.model = genai.GenerativeModel(model_name)
                print(f"✓ Using Gemini model: {model_name}")
                break
            except Exception as e:
                print(f"✗ Model {model_name} not available: {str(e)}")
                continue
        
        if not self.model:
            raise Exception("No Gemini models available. Please check your API key and quota.")
        
        # Retry configuration
        self.max_retries = 2
        self.retry_delay = 1  # seconds
    
    def extract_with_gemini(self):
        """
        Extract receipt data using Google Gemini API with retry logic
        Returns structured data directly
        """
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                # Load image
                img = Image.open(self.image_path)
                
                # Create prompt for structured extraction
                prompt = """Analyze this receipt image and extract the following information in JSON format:

{
    "vendor_name": "name of the store/vendor",
    "total_amount": "total amount as a number (e.g., 1234.56)",
    "receipt_date": "date in YYYY-MM-DD format",
    "category": "one of: FOOD, TRANSPORT, OFFICE, UTILITIES, SALARY, RENT, MARKETING, OTHER",
    "description": "brief description of what this expense is for",
    "line_items": [
        {
            "description": "item name",
            "quantity": 1,
            "unit_price": 0.00,
            "amount": 0.00
        }
    ],
    "raw_text": "all text from the receipt"
}

Rules:
- Extract the TOTAL amount (not subtotal)
- If date is unclear, use today's date
- For category, analyze the receipt content and vendor to determine the most appropriate category:
  * FOOD: Restaurants, cafes, grocery stores, food delivery
  * TRANSPORT: Gas stations, taxi, uber, parking, vehicle maintenance
  * OFFICE: Stationery, office equipment, supplies
  * UTILITIES: Electricity, water, internet, phone bills
  * SALARY: Payroll, wages, employee payments
  * RENT: Property rent, lease payments
  * MARKETING: Advertising, promotional materials, social media ads
  * OTHER: Anything that doesn't fit above categories
- For line_items, extract as many as you can identify with accurate quantities and prices
- Include all visible text in raw_text
- For description, provide a brief summary of what was purchased
- Return valid JSON only, no markdown formatting
- If you cannot read something, use empty string or 0"""

                # Call Gemini API with old package (more stable)
                response = self.model.generate_content([prompt, img])
                
                # Parse response
                import json
                result_text = response.text.strip()
                
                # Remove markdown code blocks if present
                if result_text.startswith('```'):
                    result_text = result_text.split('```')[1]
                    if result_text.startswith('json'):
                        result_text = result_text[4:]
                    result_text = result_text.strip()
                
                data = json.loads(result_text)
                
                # Convert to expected format
                return {
                    'raw_text': data.get('raw_text', ''),
                    'vendor_name': data.get('vendor_name', ''),
                    'vendor_confidence': 95,
                    'total_amount': Decimal(str(data.get('total_amount', 0))) if data.get('total_amount') else None,
                    'amount_confidence': 95,
                    'receipt_date': datetime.strptime(data.get('receipt_date', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d').date(),
                    'date_confidence': 90,
                    'category': data.get('category', 'OTHER'),
                    'description': data.get('description', ''),
                    'line_items': data.get('line_items', [])
                }
                
            except Exception as e:
                last_error = e
                error_str = str(e)
                
                # Check for quota exceeded
                if '429' in error_str or 'quota' in error_str.lower():
                    raise Exception("Gemini API quota exceeded. Please check your billing at https://makersuite.google.com/app/apikey")
                
                # Check for invalid API key
                if '401' in error_str or '403' in error_str or 'API key' in error_str:
                    raise Exception("Invalid Gemini API key. Please check your configuration.")
                
                # Check if it's a rate limit or high demand error
                if '503' in error_str or 'UNAVAILABLE' in error_str or 'high demand' in error_str.lower():
                    if attempt < self.max_retries - 1:
                        wait_time = self.retry_delay * (2 ** attempt)  # Exponential backoff
                        print(f"⏳ Gemini API unavailable (attempt {attempt + 1}/{self.max_retries}). Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                        continue
                
                # For other errors, don't retry
                print(f"❌ Gemini API error: {e}")
                break
        
        # If all retries failed
        raise Exception(f"Failed to process receipt with Gemini after {self.max_retries} attempts: {str(last_error)}")
    
    def process(self):
        """
        Main processing method - extract all data using Gemini API
        Returns: dict with extracted data
        """
        print("Using Google Gemini API for OCR...")
        return self.extract_with_gemini()
