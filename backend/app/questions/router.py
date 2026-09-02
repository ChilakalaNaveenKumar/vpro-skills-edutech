"""API router for the MCQ questions module.

Admin-only, on purpose: students never browse questions directly, only
through app/assessments/router.py's take/submit endpoints (which never
expose `is_correct`). There is no student-facing router in this module.

Questions belong to a reusable Assessment (2026-08-31), not directly to a
Topic - see app/assessments/models.py's docstring. An Assessment must
already exist (created via the admin_router in app/assessments/router.py)
before questions can be added to it; there is no more auto-provisioning
(that used to live in app/assessments/provisioning.py, now removed).
"""

from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.assessments.models import Assessment
from app.auth.dependencies import require_admin
from app.database.session import get_db
from app.questions.bulk_upload import build_template_workbook, parse_questions_workbook
from app.questions.models import Question, QuestionOption
from app.questions.schemas import (
    BulkUploadResult,
    BulkUploadRowError,
    QuestionAdminPublic,
    QuestionCreate,
    QuestionUpdate,
)

admin_router = APIRouter(
    prefix="/api/admin/questions", dependencies=[Depends(require_admin)], tags=["Questions"]
)


# --- Bulk upload (2026-08-31) -----------------------------------------
# Registered before the two `/assessments/{assessment_id}...` routes below
# purely for readability (grouped with the create-side of the module);
# FastAPI matches by exact literal path segment vs. `{param}` placeholder,
# not by registration order, so "bulk-template" can never be swallowed by
# "{assessment_id}" - there's no ordering hazard here to begin with.


@admin_router.get("/bulk-template")
def download_bulk_upload_template() -> StreamingResponse:
    """A ready-to-fill .xlsx with the exact columns parse_questions_workbook()
    expects, plus two filled-in example rows. Generated fresh per request
    (cheap) rather than served as a static file, so it can never drift out
    of sync with what the parser actually accepts.
    """
    workbook = build_template_workbook()
    buffer = BytesIO()
    workbook.save(buffer)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=question_upload_template.xlsx"},
    )


@admin_router.post("/assessments/{assessment_id}/bulk-upload", response_model=BulkUploadResult)
def bulk_upload_questions(
    assessment_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)
) -> BulkUploadResult:
    """Creates one Question (+ its 4 QuestionOptions) per valid row.
    Partial success by design, not all-or-nothing: a typo in row 14 of a
    40-row upload shouldn't cost the admin the other 39 correctly-filled
    rows - they get a per-row error list back and can fix + re-upload just
    the failed rows (they're independent Questions either way, so there's
    no correctness reason to require every row to succeed together).
    """
    if db.get(Assessment, assessment_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    if not (file.filename or "").lower().endswith(".xlsx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a .xlsx Excel file (use the template).",
        )

    content = file.file.read()
    try:
        parsed_rows, row_errors = parse_questions_workbook(content)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if not parsed_rows and not row_errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No question rows found in the file."
        )

    for row in parsed_rows:
        question = Question(
            assessment_id=assessment_id,
            question_text=row.question_text,
            status=row.status,
            options=[
                QuestionOption(
                    option_label=label,
                    option_text=text,
                    is_correct=(label == row.correct_label),
                )
                for label, text in row.option_texts.items()
            ],
        )
        db.add(question)

    db.commit()

    return BulkUploadResult(
        created=len(parsed_rows),
        skipped=len(row_errors),
        errors=[BulkUploadRowError(row=e.row, message=e.message) for e in row_errors],
    )


@admin_router.get("/assessments/{assessment_id}", response_model=list[QuestionAdminPublic])
def list_questions_for_assessment(
    assessment_id: int, db: Session = Depends(get_db)
) -> list[Question]:
    if db.get(Assessment, assessment_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    stmt = (
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.assessment_id == assessment_id)
        .order_by(Question.id)
    )
    return list(db.scalars(stmt).all())


@admin_router.post("/", response_model=QuestionAdminPublic, status_code=status.HTTP_201_CREATED)
def create_question(payload: QuestionCreate, db: Session = Depends(get_db)) -> Question:
    if db.get(Assessment, payload.assessment_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    question = Question(
        assessment_id=payload.assessment_id,
        question_text=payload.question_text,
        status=payload.status,
        options=[
            QuestionOption(
                option_label=option.option_label.upper(),
                option_text=option.option_text,
                is_correct=option.is_correct,
            )
            for option in payload.options
        ],
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@admin_router.put("/{question_id}", response_model=QuestionAdminPublic)
def update_question(
    question_id: int, payload: QuestionUpdate, db: Session = Depends(get_db)
) -> Question:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    if payload.question_text is not None:
        question.question_text = payload.question_text
    if payload.status is not None:
        question.status = payload.status

    if payload.options is not None:
        existing_by_label = {option.option_label: option for option in question.options}
        incoming_labels = {option.option_label.upper() for option in payload.options}
        if incoming_labels != set(existing_by_label.keys()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Option labels must match this question's existing A/B/C/D options",
            )
        for incoming in payload.options:
            existing = existing_by_label[incoming.option_label.upper()]
            existing.option_text = incoming.option_text
            existing.is_correct = incoming.is_correct

    db.commit()
    db.refresh(question)
    return question


@admin_router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(question_id: int, db: Session = Depends(get_db)) -> None:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    db.delete(question)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This question has existing assessment answers and cannot be deleted",
        )
