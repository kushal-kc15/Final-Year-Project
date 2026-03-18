import datetime

from django.test import TestCase

from apps.core.date_helpers import bs_to_ad, ad_to_bs
from apps.core.exceptions import DateConversionError


class DateConversionTests(TestCase):
    """Property 12 & 13: Date Conversion Accuracy and Error Handling."""

    # --- Property 12: Date Conversion Accuracy ---
    def test_known_bs_to_ad_conversion(self):
        """A well-known BS date should convert correctly to AD."""
        # BS 2080-01-01 = AD 2023-04-14
        ad = bs_to_ad(2080, 1, 1)
        self.assertEqual(ad, (2023, 4, 14))

    def test_known_ad_to_bs_conversion(self):
        """A well-known AD date should convert correctly to BS."""
        # AD 2023-04-14 = BS 2080-01-01
        bs = ad_to_bs(2023, 4, 14)
        self.assertEqual(bs, (2080, 1, 1))

    def test_roundtrip_bs_ad_bs(self):
        """BS -> AD -> BS should return the original date."""
        original_bs = (2081, 6, 15)
        ad = bs_to_ad(*original_bs)
        result_bs = ad_to_bs(*ad)
        self.assertEqual(original_bs, result_bs)

    def test_roundtrip_ad_bs_ad(self):
        """AD -> BS -> AD should return the original date."""
        original_ad = (2024, 3, 18)
        bs = ad_to_bs(*original_ad)
        result_ad = bs_to_ad(*bs)
        self.assertEqual(original_ad, result_ad)

    def test_multiple_dates_roundtrip(self):
        """Multiple dates should survive BS->AD->BS roundtrip."""
        test_dates = [
            (2075, 1, 1),
            (2078, 6, 15),
            (2082, 12, 1),
        ]
        for bs_date in test_dates:
            ad = bs_to_ad(*bs_date)
            result = ad_to_bs(*ad)
            self.assertEqual(bs_date, result, f"Roundtrip failed for {bs_date}")

    # --- Property 13: Date Conversion Error Handling ---
    def test_invalid_bs_month_raises_error(self):
        """BS month > 12 should raise DateConversionError."""
        with self.assertRaises(DateConversionError):
            bs_to_ad(2080, 13, 1)

    def test_invalid_bs_day_raises_error(self):
        """BS day > valid range should raise DateConversionError."""
        with self.assertRaises(DateConversionError):
            bs_to_ad(2080, 1, 35)

    def test_invalid_ad_month_raises_error(self):
        """AD month > 12 should raise DateConversionError."""
        with self.assertRaises(DateConversionError):
            ad_to_bs(2024, 13, 1)

    def test_invalid_ad_day_raises_error(self):
        """AD day 0 should raise DateConversionError."""
        with self.assertRaises(DateConversionError):
            ad_to_bs(2024, 1, 0)


class ErrorHandlingMiddlewareTests(TestCase):
    """Property 10 & 11: Standardized Error Responses and Error Logging."""

    def test_404_returns_json(self):
        """A non-existent URL should return a proper status code."""
        from rest_framework.test import APIClient
        client = APIClient()
        response = client.get('/api/nonexistent/')
        self.assertEqual(response.status_code, 404)
