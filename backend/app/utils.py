from pathlib import Path
import re
from typing import Optional
import unicodedata
import uuid


_CYR_MAP = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "ґ": "g",
    "д": "d",
    "е": "e",
    "є": "ye",
    "ж": "zh",
    "з": "z",
    "и": "y",
    "і": "i",
    "ї": "yi",
    "й": "y",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "kh",
    "ц": "ts",
    "ч": "ch",
    "ш": "sh",
    "щ": "shch",
    "ь": "",
    "ю": "yu",
    "я": "ya",
    # uppercase will be lowered before transliteration; if needed you can add uppercase too
}


def transliterate_char(ch: str) -> Optional[str]:
    if ch in _CYR_MAP:
        return _CYR_MAP[ch]
    # if uppercase Cyrillic, lower and try again
    low = ch.lower()
    if low in _CYR_MAP:
        out = _CYR_MAP[low]
        # preserve case? we always lowercase, so return lower.
        return out
    return None


def normalize_text(s: str) -> str:
    """
    1) NFKD normalize (separate accents)
    2) transliterate basic Cyrillic
    3) remove combining marks
    4) replace whitespace with '-'
    5) replace unsupported chars with '_'
    6) lower-case
    """
    if not s:
        return ""
    s = s.strip()
    # 1 & 3: normalize and strip diacritics for latin chars
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    # we'll build result char-by-char to handle Cyrillic specially
    out_chars = []
    for ch in s:
        if ch.isspace():
            out_chars.append("-")
            continue
        # ascii letters and digits keep
        if "A" <= ch <= "Z" or "a" <= ch <= "z" or "0" <= ch <= "9" or ch in "-_":
            out_chars.append(ch)
            continue
        # try transliteration for Cyrillic (and similar)
        tr = transliterate_char(ch)
        if tr is not None:
            out_chars.append(tr)
            continue
        # for any other character produce '_' as replacement
        out_chars.append("_")
    result = "".join(out_chars).lower()
    # collapse repeated runs of '-' or '_' into a single same char
    result = re.sub(r"([-_])\1+", r"\1", result)
    # if there are mixed runs like "-_" or "_-" collapse to single '-' (prefer dash)
    result = re.sub(r"[-_]+", "-", result)
    # strip leading/trailing '-' or '_' (we prefer no leading dash)
    result = result.strip("-_")
    return result


def generate_readable_id(
    name: str, existing_ids: set, root_dir: Path, max_len: int = 30
) -> str:
    """
    Build a readable id from `name`. Ensure it only contains a-z0-9-_,
    is <= max_len, and doesn't collide with existing_ids or filesystem.
    On collisions append -1, -2, ... trimming base if needed.
    """
    base = normalize_text(name or "")
    if not base:
        # fallback to human-ish random id
        base = f"gallery-{uuid.uuid4().hex[:8]}"

    # limit base initially to max_len (we will reserve room for suffix if needed)
    base = base[:max_len]

    candidate = base
    suffix = ""
    counter = 1

    # helper to check both in-memory db and filesystem collision
    def exists_check(id_: str) -> bool:
        if id_ in existing_ids:
            return True
        if (root_dir / id_).exists():
            return True
        return False

    while exists_check(candidate):
        suffix = f"-{counter}"
        # ensure we fit into max_len: trim base to (max_len - len(suffix))
        allowed_base_len = max_len - len(suffix)
        if allowed_base_len <= 0:
            # extremely unlikely; create a short random fallback
            candidate = uuid.uuid4().hex[:max_len]
        else:
            trimmed = base[:allowed_base_len].rstrip("-_")
            # avoid empty trimmed base
            if not trimmed:
                trimmed = uuid.uuid4().hex[:allowed_base_len]
            candidate = f"{trimmed}{suffix}"
        counter += 1

    return candidate
