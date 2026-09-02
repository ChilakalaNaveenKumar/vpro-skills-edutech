"""Tests for the Excel bulk-question-upload feature (2026-08-31):
app/questions/bulk_upload.py's parser plus the two admin endpoints,
GET /api/admin/questions/bulk-template and
POST /api/admin/questions/assessments/{assessment_id}/bulk-upload.

Bulk-uploading is keyed by assessment_id, not topic_id, since Questions
belong to a reusable Assessment (see app/assessments/models.py's
docstring) - every test here creates a standalone Assessment via
`make_assessment` first, the same way a real admin would create one
through the admin_router before adding questions to it.
"""

from io import BytesIO

from openpyxl import Workbook

HEADER = [
    "Question Text",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Correct Option (A/B/C/D)",
    "Status (Active/Inactive) - optional",
]


def _workbook_bytes(rows: list[list], header: list[str] | None = None) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.append(header if header is not None else HEADER)
    for row in rows:
        ws.append(row)
    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer.read()


def _upload(client, headers, assessment_id: int, file_bytes: bytes, filename: str = "questions.xlsx"):
    return client.post(
        f"/api/admin/questions/assessments/{assessment_id}/bulk-upload",
        headers=headers,
        files={
            "file": (
                filename,
                file_bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )


def test_bulk_upload_requires_admin(client, make_admin, make_student, make_assessment, login_as):
    assessment = make_assessment()
    file_bytes = _workbook_bytes([["Q?", "1", "2", "3", "4", "A", ""]])

    make_student(email="student-bulk@example.com")
    as_student = _upload(client, login_as("student-bulk@example.com"), assessment.id, file_bytes)
    assert as_student.status_code == 403

    make_admin(email="admin-bulk@example.com")
    as_admin = _upload(client, login_as("admin-bulk@example.com"), assessment.id, file_bytes)
    assert as_admin.status_code == 200


def test_bulk_upload_creates_valid_questions(client, make_admin, make_assessment, login_as):
    make_admin(email="admin-bulk-create@example.com")
    headers = login_as("admin-bulk-create@example.com")
    assessment = make_assessment()

    file_bytes = _workbook_bytes(
        [
            ["What is 2 + 2?", "3", "4", "5", "22", "B", "Active"],
            ["Capital of France?", "Berlin", "Madrid", "Paris", "Rome", "c", ""],
        ]
    )
    response = _upload(client, headers, assessment.id, file_bytes)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body == {"created": 2, "skipped": 0, "errors": []}

    listing = client.get(f"/api/admin/questions/assessments/{assessment.id}", headers=headers)
    assert listing.status_code == 200
    questions = listing.json()
    assert len(questions) == 2
    second = next(q for q in questions if q["question_text"] == "Capital of France?")
    correct = next(o for o in second["options"] if o["is_correct"])
    assert correct["option_label"] == "C"
    assert correct["option_text"] == "Paris"


def test_bulk_upload_reports_row_errors_and_skips_them(
    client, make_admin, make_assessment, login_as
):
    make_admin(email="admin-bulk-errors@example.com")
    headers = login_as("admin-bulk-errors@example.com")
    assessment = make_assessment()

    file_bytes = _workbook_bytes(
        [
            ["Valid question", "1", "2", "3", "4", "A", ""],  # row 2 - valid
            ["Missing an option", "1", "2", "3", "", "A", ""],  # row 3 - Option D blank
            ["Bad correct label", "1", "2", "3", "4", "E", ""],  # row 4 - not A-D
            ["", "", "", "", "", "", ""],  # row 5 - wholly blank, silently skipped
        ]
    )
    response = _upload(client, headers, assessment.id, file_bytes)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["created"] == 1
    assert body["skipped"] == 2
    rows_with_errors = {e["row"] for e in body["errors"]}
    assert rows_with_errors == {3, 4}

    listing = client.get(f"/api/admin/questions/assessments/{assessment.id}", headers=headers)
    assert len(listing.json()) == 1


def test_bulk_upload_rejects_non_xlsx_file(client, make_admin, make_assessment, login_as):
    make_admin(email="admin-bulk-badext@example.com")
    headers = login_as("admin-bulk-badext@example.com")
    assessment = make_assessment()

    response = client.post(
        f"/api/admin/questions/assessments/{assessment.id}/bulk-upload",
        headers=headers,
        files={"file": ("questions.csv", b"not,an,excel,file", "text/csv")},
    )
    assert response.status_code == 400


def test_bulk_upload_rejects_wrong_headers(client, make_admin, make_assessment, login_as):
    make_admin(email="admin-bulk-badheader@example.com")
    headers = login_as("admin-bulk-badheader@example.com")
    assessment = make_assessment()

    file_bytes = _workbook_bytes(
        [["Something", "1", "2", "3", "4", "A", ""]],
        header=["Not", "The", "Right", "Columns", "At", "All"],
    )
    response = _upload(client, headers, assessment.id, file_bytes)
    assert response.status_code == 400


def test_bulk_upload_404s_for_unknown_assessment(client, make_admin, login_as):
    make_admin(email="admin-bulk-404@example.com")
    headers = login_as("admin-bulk-404@example.com")
    file_bytes = _workbook_bytes([["Q?", "1", "2", "3", "4", "A", ""]])

    response = _upload(client, headers, 999999, file_bytes)
    assert response.status_code == 404


def test_bulk_upload_all_rows_invalid_creates_nothing(client, make_admin, make_assessment, login_as):
    make_admin(email="admin-bulk-allbad@example.com")
    headers = login_as("admin-bulk-allbad@example.com")
    assessment = make_assessment()

    file_bytes = _workbook_bytes([["Bad row", "1", "2", "3", "4", "Z", ""]])
    response = _upload(client, headers, assessment.id, file_bytes)
    assert response.status_code == 200
    body = response.json()
    assert body["created"] == 0
    assert body["skipped"] == 1


def test_download_bulk_template_requires_admin(client, make_admin, make_student, login_as):
    make_student(email="student-template@example.com")
    as_student = client.get(
        "/api/admin/questions/bulk-template", headers=login_as("student-template@example.com")
    )
    assert as_student.status_code == 403

    make_admin(email="admin-template@example.com")
    as_admin = client.get(
        "/api/admin/questions/bulk-template", headers=login_as("admin-template@example.com")
    )
    assert as_admin.status_code == 200
    assert (
        as_admin.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert len(as_admin.content) > 0
