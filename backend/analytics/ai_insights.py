import json
import logging

import requests
from decouple import config

logger = logging.getLogger(__name__)


class AIInsightError(RuntimeError):
    """Raised when the AI insight provider cannot return a usable summary."""


AI_INSIGHT_PROMPT = """You are a finance analyst for a business expense management system.
Use only the JSON snapshot provided by the backend. Do not invent transactions.
Return valid JSON only with this exact shape:
{
  "summary": "one concise executive summary sentence",
  "highlights": ["2-3 concrete observations"],
  "risks": ["0-3 risk observations"],
  "recommendations": ["2-3 practical next actions"]
}
Keep each item under 24 words. Mention amounts exactly as numbers from the snapshot when useful."""


def _strip_markdown_json(text):
    cleaned = text.strip()
    if cleaned.startswith('```'):
        cleaned = cleaned.split('```')[1]
        if cleaned.startswith('json'):
            cleaned = cleaned[4:]
    return cleaned.strip()


def generate_ai_insight(snapshot):
    api_key = config('NVIDIA_API_KEY', default='').strip()
    if not api_key:
        raise AIInsightError('NVIDIA_API_KEY is not configured.')

    invoke_url = config(
        'AI_INSIGHTS_INVOKE_URL',
        default=config('NVIDIA_OCR_INVOKE_URL', default='https://integrate.api.nvidia.com/v1/chat/completions'),
    ).strip()
    model = config('AI_INSIGHTS_MODEL', default=config('NVIDIA_OCR_MODEL', default='moonshotai/kimi-k2.6')).strip()
    timeout = config('AI_INSIGHTS_TIMEOUT', default=60, cast=int)

    payload = {
        'model': model,
        'max_tokens': config('AI_INSIGHTS_MAX_OUTPUT_TOKENS', default=900, cast=int),
        'temperature': 0.2,
        'top_p': 1,
        'stream': False,
        'messages': [
            {'role': 'system', 'content': AI_INSIGHT_PROMPT},
            {'role': 'user', 'content': json.dumps(snapshot, default=str)},
        ],
    }
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }

    try:
        response = requests.post(invoke_url, headers=headers, json=payload, timeout=timeout)
        response.raise_for_status()
        provider_payload = response.json()
    except (requests.RequestException, ValueError) as exc:
        logger.warning('AI insight provider request failed', extra={'error_type': exc.__class__.__name__})
        raise AIInsightError('AI insight provider request failed.') from exc

    choices = provider_payload.get('choices') or []
    content = ((choices[0].get('message') or {}).get('content') or '').strip() if choices else ''
    if not content:
        raise AIInsightError('AI insight provider returned an empty response.')

    try:
        insight = json.loads(_strip_markdown_json(content))
    except json.JSONDecodeError as exc:
        logger.warning('AI insight provider returned invalid JSON')
        raise AIInsightError('AI insight provider returned invalid JSON.') from exc

    return {
        'summary': str(insight.get('summary') or '').strip(),
        'highlights': _clean_list(insight.get('highlights'), limit=3),
        'risks': _clean_list(insight.get('risks'), limit=3),
        'recommendations': _clean_list(insight.get('recommendations'), limit=3),
        'provider': 'nvidia',
        'model': model,
    }


def _clean_list(value, limit):
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value[:limit] if str(item).strip()]
