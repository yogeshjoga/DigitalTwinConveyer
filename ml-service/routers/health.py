from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()


@router.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "beltguard-ml", "ts": datetime.now(timezone.utc).isoformat()}
