import logging
import time

from groq import RateLimitError, APIStatusError, APIConnectionError, APITimeoutError

from app.ai.graph.builder import graph
from app.ai.graph.context import RuntimeContext

logger = logging.getLogger(__name__)

_PROVIDER_ERROR_MESSAGES = {
    RateLimitError: (
        "I'm getting a lot of requests right now and have hit a "
        "temporary usage limit. Please try again in a few minutes."
    ),
    APITimeoutError: "That took too long to process. Please try again.",
    APIConnectionError: (
        "I'm having trouble connecting right now. Please check your "
        "connection and try again in a moment."
    ),
    APIStatusError: (
        "Something went wrong on my end while processing that. "
        "Please try again shortly."
    ),
}


class GraphInvocationError(Exception):
    """Raised on a known provider failure; carries the user-facing message."""

    def __init__(self, user_message: str):
        self.user_message = user_message
        super().__init__(user_message)


async def run_graph(state: dict, context: RuntimeContext):
    try:
        start = time.perf_counter()
        result = None
        async for event in graph.astream(state, context=context, stream_mode="updates"):
            for node_name, node_output in event.items():
                logger.debug("node=%s output=%s", node_name, node_output)
                result = node_output
        logger.debug("graph execution took %.2fs", time.perf_counter() - start)
        return result
    except (RateLimitError, APITimeoutError, APIConnectionError, APIStatusError) as exc:
        raise GraphInvocationError(_PROVIDER_ERROR_MESSAGES[type(exc)]) from exc
