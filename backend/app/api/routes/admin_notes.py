"""Admin notes and goals management routes."""

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.admin_note import AdminGoal, AdminNote

router = APIRouter()


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class GoalResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    status: str
    priority: int
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: int = 0
    due_date: Optional[datetime] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[int] = None
    due_date: Optional[datetime] = None


class NoteResponse(BaseModel):
    id: uuid.UUID
    content: str
    category: str
    created_at: datetime
    updated_at: datetime


class NoteCreate(BaseModel):
    content: str
    category: str = "idea"


# ---------------------------------------------------------------------------
# Goal endpoints
# ---------------------------------------------------------------------------


@router.get("/goals/", response_model=List[GoalResponse])
async def list_goals(db: AsyncSession = Depends(get_db)):
    """List all goals sorted by priority DESC, then status."""
    query = select(AdminGoal).order_by(
        AdminGoal.priority.desc(), AdminGoal.status
    )
    result = await db.execute(query)
    goals = result.scalars().all()
    return [GoalResponse.model_validate(g, from_attributes=True) for g in goals]


@router.post("/goals/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(body: GoalCreate, db: AsyncSession = Depends(get_db)):
    """Create a new goal."""
    goal = AdminGoal(
        title=body.title,
        description=body.description,
        priority=body.priority,
        due_date=body.due_date,
    )
    db.add(goal)
    await db.flush()
    await db.refresh(goal)
    return GoalResponse.model_validate(goal, from_attributes=True)


@router.put("/goals/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: uuid.UUID,
    body: GoalUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing goal."""
    result = await db.execute(select(AdminGoal).where(AdminGoal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found.")

    update_data = body.model_dump(exclude_unset=True)

    # Auto-set completed_at when status changes to done
    if update_data.get("status") == "done" and goal.status != "done":
        update_data["completed_at"] = datetime.now(timezone.utc)
    elif update_data.get("status") and update_data["status"] != "done":
        update_data["completed_at"] = None

    for field, value in update_data.items():
        setattr(goal, field, value)

    await db.flush()
    await db.refresh(goal)
    return GoalResponse.model_validate(goal, from_attributes=True)


@router.delete("/goals/{goal_id}", status_code=status.HTTP_200_OK)
async def delete_goal(goal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Delete a goal."""
    result = await db.execute(select(AdminGoal).where(AdminGoal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found.")

    await db.delete(goal)
    await db.flush()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Note endpoints
# ---------------------------------------------------------------------------


@router.get("/notes/", response_model=List[NoteResponse])
async def list_notes(db: AsyncSession = Depends(get_db)):
    """List all notes sorted by created_at DESC."""
    query = select(AdminNote).order_by(AdminNote.created_at.desc())
    result = await db.execute(query)
    notes = result.scalars().all()
    return [NoteResponse.model_validate(n, from_attributes=True) for n in notes]


@router.post("/notes/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(body: NoteCreate, db: AsyncSession = Depends(get_db)):
    """Create a new note."""
    note = AdminNote(
        content=body.content,
        category=body.category,
    )
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return NoteResponse.model_validate(note, from_attributes=True)


@router.delete("/notes/{note_id}", status_code=status.HTTP_200_OK)
async def delete_note(note_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Delete a note."""
    result = await db.execute(select(AdminNote).where(AdminNote.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")

    await db.delete(note)
    await db.flush()
    return {"ok": True}
