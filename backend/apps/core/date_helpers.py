"""
Date helper utilities for BS (Bikram Sambat) and AD (Anno Domini) conversion.
"""

import datetime
import logging

import nepali_datetime

from .exceptions import DateConversionError

logger = logging.getLogger(__name__)


def bs_to_ad(bs_year, bs_month, bs_day):
    """
    Convert a Bikram Sambat (BS) date to Anno Domini (AD).
    
    Args:
        bs_year (int): BS year
        bs_month (int): BS month (1-12)
        bs_day (int): BS day
    
    Returns:
        tuple: (ad_year, ad_month, ad_day)
    
    Raises:
        DateConversionError: If the BS date is invalid or out of supported range.
    """
    try:
        np_date = nepali_datetime.date(bs_year, bs_month, bs_day)
        ad_date = np_date.to_datetime_date()
        return ad_date.year, ad_date.month, ad_date.day
    except ValueError as e:
        logger.error(f"ValueError converting BS {bs_year}-{bs_month}-{bs_day} to AD: {e}")
        raise DateConversionError(f"Invalid BS date: {e}")
    except Exception as e:
        logger.error(f"Unexpected error converting BS {bs_year}-{bs_month}-{bs_day} to AD: {e}")
        raise DateConversionError(f"Failed to convert BS to AD: {e}")


def ad_to_bs(ad_year, ad_month, ad_day):
    """
    Convert an Anno Domini (AD) date to Bikram Sambat (BS).
    
    Args:
        ad_year (int): AD year
        ad_month (int): AD month (1-12)
        ad_day (int): AD day
    
    Returns:
        tuple: (bs_year, bs_month, bs_day)
    
    Raises:
        DateConversionError: If the AD date is invalid or out of supported range.
    """
    try:
        ad_date = datetime.date(ad_year, ad_month, ad_day)
        np_date = nepali_datetime.date.from_datetime_date(ad_date)
        return np_date.year, np_date.month, np_date.day
    except ValueError as e:
        logger.error(f"ValueError converting AD {ad_year}-{ad_month}-{ad_day} to BS: {e}")
        raise DateConversionError(f"Invalid AD date: {e}")
    except Exception as e:
        logger.error(f"Unexpected error converting AD {ad_year}-{ad_month}-{ad_day} to BS: {e}")
        raise DateConversionError(f"Failed to convert AD to BS: {e}")
