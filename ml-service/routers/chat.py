"""
/chat endpoint — LangChain + OpenAI powered AI assistant for belt insights.
Falls back to a rule-based engine when no API key is configured.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import os

router = APIRouter()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# ── Request / Response models ──────────────────────────────────────────────────
class MetricContext(BaseModel):
    label: str
    value: float
    unit: str

class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    context: Optional[dict] = None   # prediction + sensor snapshot

class ChatResponse(BaseModel):
    reply: str
    timestamp: str
    source: str   # "openai" | "rule-based"

# ── System prompt ──────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are BeltGuard AI Assistant — an expert in conveyor belt monitoring,
predictive maintenance, and industrial engineering for coal, steel, and mining industries.

You have access to real-time sensor data and ML predictions for the monitored conveyor belt.
When the user asks about metrics, risks, or maintenance, use the provided context data to give
specific, actionable answers. Always be concise, technical, and practical.

Key domain knowledge:
- UDL (Uniform Distributed Load): safe range 50–500 kg/m
- Belt speed: safe range 1–6 m/s
- Temperature: warning >60°C, critical >80°C
- Vibration: warning >5 mm/s, critical >10 mm/s
- Tear probability >70% = immediate inspection required
- Remaining life <100h = schedule maintenance urgently
- Impact velocity formula: v = √(2gH) where g=9.81 m/s², H=drop height

Always provide:
1. Direct answer to the question
2. What the current value means in context
3. Recommended action if applicable
"""

# ── Rule-based fallback engine ─────────────────────────────────────────────────
def rule_based_response(message: str, context: Optional[dict]) -> str:
    msg = message.lower()
    pred = context.get("prediction", {}) if context else {}
    sensors = context.get("sensors", {}) if context else {}
    belt = context.get("belt", {}) if context else {}
    belt_name = belt.get("name", "the belt")
    belt_id   = belt.get("id", "")

    tear   = pred.get("tear_probability", 0)
    burst  = pred.get("burst_risk", 0)
    heat   = pred.get("overheat_risk", 0)
    life   = pred.get("remaining_life_hours", 0)
    maint  = pred.get("maintenance_window_hours", 0)
    conf   = pred.get("confidence_score", 0)
    temp   = sensors.get("temperature", 0)
    vib    = sensors.get("vibration", 0)
    load   = sensors.get("load_cell", 0)
    udl    = sensors.get("udl", 0)
    speed  = sensors.get("belt_speed", 0)

    # Tear / damage questions
    if any(w in msg for w in ["tear", "rip", "damage", "hole", "crack"]):
        level = "HIGH ⚠️" if tear > 0.7 else "MEDIUM" if tear > 0.4 else "LOW ✓"
        action = (
            "**Immediate inspection required.** Stop belt if possible and inspect for tears."
            if tear > 0.7 else
            "Monitor closely. Schedule visual inspection within 24 hours."
            if tear > 0.4 else
            "Belt surface appears healthy. Continue normal monitoring."
        )
        return (
            f"**Tear Probability: {tear*100:.1f}% — {level}**\n\n"
            f"Current load cell: {load:.0f} kg, vibration: {vib:.1f} mm/s, UDL: {udl:.0f} kg/m.\n\n"
            f"{action}\n\n"
            f"Key contributors: load stress ({load/600*100:.0f}% of max), "
            f"vibration stress ({vib/20*100:.0f}% of max)."
        )

    # Temperature / heat questions
    if any(w in msg for w in ["temp", "heat", "hot", "thermal", "overheat", "friction"]):
        status = "CRITICAL 🔴" if temp > 80 else "WARNING 🟡" if temp > 60 else "NORMAL 🟢"
        return (
            f"**Temperature: {temp:.1f}°C — {status}**\n\n"
            f"Overheat risk score: {heat*100:.1f}%.\n\n"
            + ("Reduce belt speed immediately and check idler friction. "
               "Thermal runaway can cause belt fire in coal applications." if temp > 80 else
               "Inspect idler rollers and lubrication in high-temperature zones. "
               "Consider reducing load by 15%." if temp > 60 else
               "Temperature is within safe operating range. "
               "Continue monitoring thermal zones 3–5 which show elevated friction.")
        )

    # Remaining life / maintenance
    if any(w in msg for w in ["life", "maintenance", "replace", "when", "schedule", "maint"]):
        urgency = "URGENT" if life < 100 else "SOON" if life < 300 else "PLANNED"
        return (
            f"**Remaining Belt Life: {life:.0f} hours — {urgency}**\n\n"
            f"Recommended maintenance window: **{maint:.0f} hours** from now.\n\n"
            + (f"⚠️ Schedule emergency maintenance within {life:.0f}h. "
               "Belt failure risk is high." if life < 100 else
               f"Plan maintenance in the next {maint:.0f}h to avoid unplanned downtime. "
               "Order replacement belt now." if life < 300 else
               f"Belt is in good condition. Next scheduled maintenance in {maint:.0f}h. "
               "Continue standard inspection intervals.")
            + f"\n\nModel confidence: {conf*100:.0f}%."
        )

    # Load / UDL questions
    if any(w in msg for w in ["load", "udl", "weight", "heavy", "overload", "capacity"]):
        pct = udl / 500 * 100
        status = "OVERLOAD ⚠️" if udl > 450 else "HIGH" if udl > 350 else "NORMAL ✓"
        return (
            f"**UDL: {udl:.0f} kg/m — {status} ({pct:.0f}% of max)**\n\n"
            f"Load cell reading: {load:.0f} kg. Belt speed: {speed:.1f} m/s.\n\n"
            + ("Reduce feed rate immediately. UDL exceeds 90% of rated capacity. "
               "Risk of belt sag and structural damage." if udl > 450 else
               "Consider reducing feed rate by 10–15%. "
               "Monitor for belt sag between idlers." if udl > 350 else
               "Load is within safe operating range. "
               "Mass flow rate is optimal for current belt speed.")
        )

    # Vibration / misalignment
    if any(w in msg for w in ["vibrat", "misalign", "wobble", "shake", "oscillat"]):
        status = "CRITICAL" if vib > 10 else "WARNING" if vib > 5 else "NORMAL"
        return (
            f"**Vibration: {vib:.1f} mm/s — {status}**\n\n"
            f"Misalignment risk: {pred.get('misalignment_risk', 0)*100:.1f}%.\n\n"
            + ("Stop belt and inspect tracking immediately. "
               "Severe misalignment can cause edge damage and spillage." if vib > 10 else
               "Check belt tracking and idler alignment. "
               "Inspect for material buildup on return idlers." if vib > 5 else
               "Vibration levels are normal. Belt tracking appears stable.")
        )

    # General status / summary
    if any(w in msg for w in ["status", "summary", "overview", "health", "how is", "report"]):
        overall = "CRITICAL" if tear > 0.7 or life < 100 else "WARNING" if tear > 0.4 or life < 300 else "HEALTHY"
        return (
            f"## Belt Status Summary — {overall}\n\n"
            f"| Metric | Value | Status |\n"
            f"|--------|-------|--------|\n"
            f"| Remaining Life | {life:.0f}h | {'⚠️' if life < 300 else '✓'} |\n"
            f"| Tear Probability | {tear*100:.1f}% | {'⚠️' if tear > 0.4 else '✓'} |\n"
            f"| Temperature | {temp:.1f}°C | {'⚠️' if temp > 60 else '✓'} |\n"
            f"| Vibration | {vib:.1f} mm/s | {'⚠️' if vib > 5 else '✓'} |\n"
            f"| UDL | {udl:.0f} kg/m | {'⚠️' if udl > 350 else '✓'} |\n\n"
            f"**Next maintenance in {maint:.0f}h.** Model confidence: {conf*100:.0f}%."
        )

    # Default
    return (
        f"I'm monitoring **{belt_name}** (`{belt_id}`). Current readings:\n\n"
        f"- **Remaining life**: {life:.0f}h\n"
        f"- **Tear risk**: {tear*100:.1f}%\n"
        f"- **Temperature**: {temp:.1f}°C\n"
        f"- **Vibration**: {vib:.1f} mm/s\n\n"
        f"Ask me about: tear risk, temperature, maintenance schedule, load analysis, "
        f"vibration, or overall belt health."
    )


# ── Chat endpoint ──────────────────────────────────────────────────────────────
@router.post("/chat", tags=["AI Chat"])
async def chat(req: ChatRequest) -> ChatResponse:
    ts = datetime.now(timezone.utc).isoformat()

    # ── Try OpenAI via LangChain ───────────────────────────────────────────
    if OPENAI_API_KEY:
        try:
            from langchain_openai import ChatOpenAI
            from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

            llm = ChatOpenAI(
                model="gpt-4o-mini",
                temperature=0.3,
                api_key=OPENAI_API_KEY,
                max_tokens=600,
            )

            # Build context string from prediction + sensor data
            ctx_str = ""
            if req.context:
                pred = req.context.get("prediction", {})
                sens = req.context.get("sensors", {})
                belt = req.context.get("belt", {})
                belt_info = (
                    f"\n\nMONITORED BELT:\n"
                    f"- ID: {belt.get('id', 'Unknown')}\n"
                    f"- Name: {belt.get('name', 'Unknown')}\n"
                    f"- Area: {belt.get('area', 'Unknown')}\n"
                    f"- Material: {belt.get('material', 'Unknown')}\n"
                    f"- Description: {belt.get('description', '')}\n"
                ) if belt else ""
                ctx_str = (
                    belt_info +
                    f"\n\nCURRENT BELT DATA:\n"
                    f"- Remaining life: {pred.get('remaining_life_hours', '?'):.1f}h\n"
                    f"- Tear probability: {pred.get('tear_probability', 0)*100:.1f}%\n"
                    f"- Burst risk: {pred.get('burst_risk', 0)*100:.1f}%\n"
                    f"- Overheat risk: {pred.get('overheat_risk', 0)*100:.1f}%\n"
                    f"- Misalignment risk: {pred.get('misalignment_risk', 0)*100:.1f}%\n"
                    f"- Maintenance window: {pred.get('maintenance_window_hours', '?'):.1f}h\n"
                    f"- Temperature: {sens.get('temperature', '?'):.1f}°C\n"
                    f"- Vibration: {sens.get('vibration', '?'):.1f} mm/s\n"
                    f"- Load cell: {sens.get('load_cell', '?'):.0f} kg\n"
                    f"- UDL: {sens.get('udl', '?'):.0f} kg/m\n"
                    f"- Belt speed: {sens.get('belt_speed', '?'):.1f} m/s\n"
                )

            messages = [SystemMessage(content=SYSTEM_PROMPT + ctx_str)]
            for h in req.history[-6:]:  # last 6 turns for context
                if h.role == "user":
                    messages.append(HumanMessage(content=h.content))
                else:
                    messages.append(AIMessage(content=h.content))
            messages.append(HumanMessage(content=req.message))

            response = await llm.ainvoke(messages)
            return ChatResponse(reply=response.content, timestamp=ts, source="openai")

        except Exception as e:
            # Fall through to rule-based
            pass

    # ── Rule-based fallback ────────────────────────────────────────────────
    reply = rule_based_response(req.message, req.context)
    return ChatResponse(reply=reply, timestamp=ts, source="rule-based")
