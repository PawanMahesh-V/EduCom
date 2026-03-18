import html
import re


CHAR_SUBSTITUTIONS = str.maketrans({
    '@': 'a',
    '$': 's',
    '!': 'i',
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
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
