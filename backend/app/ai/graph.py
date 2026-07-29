from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph, START
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.runtime import get_runtime

from app.ai.context import RuntimeContext
from app.ai.model import llm
from app.ai.system_prompt import SYSTEM_PROMPT
from app.ai.state import GraphState
from app.ai.tools import chat_tools

chat_model = llm.bind_tools(chat_tools)

print("Graph initialized with tools:", chat_tools)

async def chatbot(state: GraphState):
    runtime = get_runtime(RuntimeContext)

    messages = [
        SystemMessage(
            content=SYSTEM_PROMPT.format(student_name=runtime.context.student_name)
        ),
        *state["messages"],
    ]

    response = await chat_model.ainvoke(messages)

    return {"messages": [response]}


builder = StateGraph(GraphState, context_schema=RuntimeContext)

builder.add_node("chatbot", chatbot)
builder.add_node("tools", ToolNode(chat_tools))

builder.add_edge(START, "chatbot")
builder.add_conditional_edges("chatbot", tools_condition)
builder.add_edge("tools", "chatbot")

graph = builder.compile()
