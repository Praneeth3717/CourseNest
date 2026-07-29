import re

_FILLER_PHRASES = {
    "ok",
    "okay",
    "k",
    "kk",
    "cool",
    "fine",
    "alright",
    "sure",
    "thanks",
    "thank you",
    "thx",
    "ty",
    "got it",
    "gotcha",
    "noted",
    "great",
    "nice",
    "good",
    "awesome",
    "yep",
    "yup",
    "yes",
    "no",
    "nope",
}

_PUNCT_RE = re.compile(r"[^\w\s]")


def is_filler_message(text: str) -> bool:
    """
    True only if the whole message (after trimming punctuation/case) is a
    bare acknowledgment with no actual question or request in it. Deliberately
    conservative — the model handles anything ambiguous or mixed-content.
    """
    normalized = _PUNCT_RE.sub("", text).strip().lower()
    return normalized in _FILLER_PHRASES


def filler_reply() -> str:
    return "Happy to help! Let me know if you need anything else."
