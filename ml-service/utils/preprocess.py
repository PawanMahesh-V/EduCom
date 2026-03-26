import html
import re


CHAR_SUBSTITUTIONS = str.maketrans({
    '@': 'a',
    '4': 'a',
    '^': 'a',
    '8': 'b',
    '(': 'c',
    '<': 'c',
    '3': 'e',
    '#': 'h',
    '!': 'i',
    '1': 'i',
    '|': 'i',
    '0': 'o',
    '*': 'o',
    '$': 's',
    '5': 's',
    '7': 't',
    '+': 't',
    'v': 'u',
})


def clean_text(text: str) -> str:
    if text is None:
        return ""

    normalized = html.unescape(str(text)).lower().strip()
    normalized = re.sub(r"https?://\S+|www\.\S+", " ", normalized)
    normalized = normalized.translate(CHAR_SUBSTITUTIONS)

    cleaned_tokens = []
    for token in normalized.split():
        token = re.sub(r"[^a-z0-9]", "", token)
        token = re.sub(r"(.)\1{2,}", r"\1\1", token)

        if token:
            cleaned_tokens.append(token)

    return " ".join(cleaned_tokens)
