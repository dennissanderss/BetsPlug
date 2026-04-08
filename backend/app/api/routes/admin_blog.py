"""Admin blog management routes."""

import re
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.blog import BlogPost

router = APIRouter()


# ---------------------------------------------------------------------------
# Response / request models
# ---------------------------------------------------------------------------


class BlogPostResponse(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    content: Optional[str] = None
    meta_description: Optional[str] = None
    featured_image_url: Optional[str] = None
    status: str
    author_id: Optional[uuid.UUID] = None
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class BlogPostCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    content: Optional[str] = None
    meta_description: Optional[str] = None
    featured_image_url: Optional[str] = None
    status: str = "draft"
    author_id: Optional[uuid.UUID] = None
    published_at: Optional[datetime] = None


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    meta_description: Optional[str] = None
    featured_image_url: Optional[str] = None
    status: Optional[str] = None
    author_id: Optional[uuid.UUID] = None
    published_at: Optional[datetime] = None


class BlogPostListResponse(BaseModel):
    items: List[BlogPostResponse]
    total: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _slugify(text: str) -> str:
    """Generate a URL-safe slug from a title."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/", response_model=BlogPostListResponse)
async def list_blog_posts(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List blog posts with optional status filter and pagination."""
    query = select(BlogPost)
    count_query = select(func.count()).select_from(BlogPost)

    if status_filter:
        query = query.where(BlogPost.status == status_filter)
        count_query = count_query.where(BlogPost.status == status_filter)

    query = query.order_by(BlogPost.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    posts = result.scalars().all()

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    return BlogPostListResponse(
        items=[BlogPostResponse.model_validate(p, from_attributes=True) for p in posts],
        total=total,
    )


@router.post("/", response_model=BlogPostResponse, status_code=status.HTTP_201_CREATED)
async def create_blog_post(
    body: BlogPostCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new blog post. Auto-generates slug from title if not provided."""
    slug = body.slug if body.slug else _slugify(body.title)

    # Check for slug uniqueness
    existing = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A blog post with slug '{slug}' already exists.",
        )

    post = BlogPost(
        title=body.title,
        slug=slug,
        content=body.content,
        meta_description=body.meta_description,
        featured_image_url=body.featured_image_url,
        status=body.status,
        author_id=body.author_id,
        published_at=body.published_at,
    )
    db.add(post)
    await db.flush()
    await db.refresh(post)
    return BlogPostResponse.model_validate(post, from_attributes=True)


@router.put("/{post_id}", response_model=BlogPostResponse)
async def update_blog_post(
    post_id: uuid.UUID,
    body: BlogPostUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing blog post."""
    result = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found.")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)

    await db.flush()
    await db.refresh(post)
    return BlogPostResponse.model_validate(post, from_attributes=True)


@router.delete("/{post_id}", response_model=BlogPostResponse)
async def delete_blog_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a blog post by setting status to 'archived'."""
    result = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog post not found.")

    post.status = "archived"
    await db.flush()
    await db.refresh(post)
    return BlogPostResponse.model_validate(post, from_attributes=True)
