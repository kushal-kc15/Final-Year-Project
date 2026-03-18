"""
Custom exception classes for standardized error handling.
"""


class BusinessLogicError(Exception):
    """Raised when a business rule is violated."""
    pass


class DateConversionError(Exception):
    """Raised when a BS/AD date conversion fails."""
    pass
