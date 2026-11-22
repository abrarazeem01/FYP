"""
NEXUS SENTINEL — WEBSOCKET BROADCAST MANAGER
Manages active WebSocket connections for real-time terminal log streams
(SCRAPER_LOG) and high-priority threat alerts (THREAT_ALERT).
"""

import asyncio
import logging
from typing import Set, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("NexusSentinel-WS")


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Active connections: {len(self.active_connections)}")

    async def broadcast_log(self, message: str, level: str = "INFO"):
        """Broadcasts a live scraper terminal log line to all UI clients."""
        payload = {
            "type": "SCRAPER_LOG",
            "message": message,
            "level": level,
        }
        await self.broadcast(payload)

    async def broadcast_threat_alert(self, alert_data: Dict[str, Any]):
        """Broadcasts a high-priority threat alert when risk score >= 75%."""
        payload = {
            "type": "THREAT_ALERT",
            "alert": alert_data,
        }
        await self.broadcast(payload)

    async def broadcast(self, payload: Dict[str, Any]):
        if not self.active_connections:
            return
        dead = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(payload)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.active_connections.discard(d)


ws_manager = ConnectionManager()
