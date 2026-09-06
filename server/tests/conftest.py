import httpx
import pytest
import pytest_asyncio

from app.main import app
from app.rooms import RoomManager


@pytest_asyncio.fixture()
async def client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture()
def isolated_manager():
    return RoomManager(3600, 5)
