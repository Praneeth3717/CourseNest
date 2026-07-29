from langchain_core.messages import HumanMessage, SystemMessage

from app.ai.graph.model import llm

TITLE_SYSTEM_PROMPT = (
    "Summarize this message as a short, generic 4-5 word title. "
    "Output only the title — no quotes, punctuation, or preamble."
)


async def generate_conversation_title(first_message: str) -> str:
    try:
        response = await llm.ainvoke(
            [
                SystemMessage(content=TITLE_SYSTEM_PROMPT),
                HumanMessage(content=first_message),
            ]
        )
        title = str(response.content).strip().strip('"').strip("'")
        return title[:120] if title else _fallback_title(first_message)
    except Exception:
        return _fallback_title(first_message)


def _fallback_title(first_message: str) -> str:
    text = first_message.strip()
    return (text[:57] + "...") if len(text) > 60 else text
