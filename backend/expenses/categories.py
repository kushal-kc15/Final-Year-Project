from __future__ import annotations

from typing import Dict, Iterable, List, Set, Tuple

# Real expense categories (also used by receipts OCR normalization).
# Keep in sync with Expense category choices.
REAL_EXPENSE_CATEGORY_CODES: Set[str] = {
    'FOOD',
    'TRANSPORT',
    'TRAVEL',
    'OFFICE',
    'UTILITIES',
    'SALARY',
    'RENT',
    'MARKETING',
    'OTHER',
}

# (code, human label) pairs for model choices
REAL_EXPENSE_CATEGORY_CHOICES: List[Tuple[str, str]] = [
    ('FOOD', 'Food & Dining'),
    ('TRANSPORT', 'Transportation'),
    ('TRAVEL', 'Travel & Accommodation'),
    ('OFFICE', 'Office Supplies'),
    ('UTILITIES', 'Utilities'),
    ('SALARY', 'Salary & Wages'),
    ('RENT', 'Rent'),
    ('MARKETING', 'Marketing & Advertising'),
    ('OTHER', 'Other'),
]

# Budget categories are ALL + the real expense categories.
# ALL must be budget-only; do NOT allow it for expenses/receipts.
BUDGET_CATEGORY_CHOICES: List[Tuple[str, str]] = [
    ('ALL', 'All Categories'),
    *REAL_EXPENSE_CATEGORY_CHOICES,
]

# OCR aliases map human labels/phrases to one of the REAL expense category codes.
# IMPORTANT: do not map to 'ALL' and do not include unsupported codes.
OCR_CATEGORY_ALIASES: Dict[str, str] = {
    # Food
    'food': 'FOOD',
    'foods': 'FOOD',
    'meal': 'FOOD',
    'meals': 'FOOD',
    'dining': 'FOOD',
    'restaurant': 'FOOD',
    'restaurants': 'FOOD',
    'cafe': 'FOOD',
    'coffee': 'FOOD',
    'coffees': 'FOOD',
    'dinner': 'FOOD',
    'lunch': 'FOOD',

    # Transport
    'transport': 'TRANSPORT',
    'taxi': 'TRANSPORT',
    'cab': 'TRANSPORT',
    'cabs': 'TRANSPORT',
    'bus': 'TRANSPORT',
    'fuel': 'TRANSPORT',
    'petrol': 'TRANSPORT',
    'ride': 'TRANSPORT',
    'rides': 'TRANSPORT',

    # Travel
    'travel': 'TRAVEL',
    'hotel': 'TRAVEL',
    'lodging': 'TRAVEL',
    'accommodation': 'TRAVEL',

    # Office
    'office': 'OFFICE',
    'office supplies': 'OFFICE',
    'stationery': 'OFFICE',
    'supplies': 'OFFICE',

    # Utilities
    'utilities': 'UTILITIES',
    'utility': 'UTILITIES',
    'internet': 'UTILITIES',
    'electricity': 'UTILITIES',
    'water': 'UTILITIES',
    'phone': 'UTILITIES',
    'tel': 'UTILITIES',
    'mobile': 'UTILITIES',

    # Salary / rent
    'salary': 'SALARY',
    'wages': 'SALARY',
    'rent': 'RENT',

    # Marketing
    'marketing': 'MARKETING',
    'advertising': 'MARKETING',

    # Fallback tokens
    'unknown': 'OTHER',
    'misc': 'OTHER',
}
