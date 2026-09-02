"""Permanent regression tests for two bugs caught by hand during manual
verification in earlier phases, both documented in docs/ARCHITECTURE.md's
"Admin panel / student management (Phase 8)" section. Neither category is
one of the roadmap's four ("auth, authorization, scoring,
cross-student-isolation") but both were real production bugs with nothing
stopping them from silently coming back, so they get their own file.
"""

from __future__ import annotations


def _option_id(question_json: dict, label: str) -> int:
    for option in question_json["options"]:
        if option["option_label"] == label:
            return option["id"]
    raise AssertionError(f"no option labeled {label!r} in {question_json!r}")


class TestMyBatchesRoutingCollision:
    """docs/ARCHITECTURE.md, "Admin panel / student management (Phase 8)":
    adding `/{user_id:int}/batches` routes to the admin-gated `router`
    collided with `me_router`'s literal `/api/users/me/batches` route -
    both mounted under `/api/users`, and (before the `:int` converter was
    added) Starlette's path matching treated the literal string "me" as a
    `user_id` path segment, so `GET /api/users/me/batches` was swallowed
    by the admin-only `/{user_id}/batches` route and an ordinary student
    got back 403 "Admin access required" instead of their own batches.
    Fixed by giving every admin-router path parameter here an explicit
    `:int` converter, so a non-numeric segment falls through to the next
    matching route (me_router) regardless of registration order.
    """

    def test_student_me_batches_returns_own_batches_not_403(
        self, client, make_student, make_course, make_batch, enroll, login_as
    ):
        student = make_student(email="collision.student@example.com")
        course = make_course()
        batch = make_batch(course=course)
        enroll(student=student, batch=batch)

        headers = login_as(student.email)
        response = client.get("/api/users/me/batches", headers=headers)

        assert response.status_code == 200, response.text
        batch_ids = [b["id"] for b in response.json()]
        assert batch_ids == [batch.id]

    def test_admin_me_batches_returns_empty_list_not_403(self, client, make_admin, login_as):
        # An admin has no student_batches rows of their own - this must
        # still resolve to me_router (200, empty list), not be swallowed
        # by the admin router's own /{user_id:int}/batches route.
        admin = make_admin(email="collision.admin@example.com")
        headers = login_as(admin.email)

        response = client.get("/api/users/me/batches", headers=headers)

        assert response.status_code == 200, response.text
        assert response.json() == []

    def test_admin_can_still_list_a_specific_students_batches_by_id(
        self, client, make_admin, make_student, make_course, make_batch, enroll, login_as
    ):
        # The fix must not break the admin route it was colliding with:
        # /{user_id:int}/batches still works for a real numeric id.
        admin = make_admin(email="collision.admin2@example.com")
        student = make_student(email="collision.student2@example.com")
        course = make_course()
        batch = make_batch(course=course)
        enroll(student=student, batch=batch)

        headers = login_as(admin.email)
        response = client.get(f"/api/users/{student.id}/batches", headers=headers)

        assert response.status_code == 200, response.text
        assert [b["id"] for b in response.json()] == [batch.id]


class TestDeleteTopicIntegrityError:
    """docs/ARCHITECTURE.md, "Admin panel / student management (Phase 8)":
    deleting a topic cascades to delete its Assessment and Questions
    (ON DELETE CASCADE), but assessment_answers.question_id is
    ON DELETE RESTRICT - so deleting a topic with already-answered
    questions raised an uncaught IntegrityError (a raw 500) until
    delete_topic was fixed to catch IntegrityError, roll back, and
    return 409, the same way questions/router.py's delete_question
    already handled its own analogous case.
    """

    def test_delete_topic_with_answered_questions_returns_409_not_500(
        self,
        client,
        make_admin,
        make_student,
        make_course,
        make_batch,
        make_topic,
        make_question,
        enroll,
        login_as,
    ):
        admin = make_admin(email="delregress.admin@example.com")
        student = make_student(email="delregress.student@example.com")
        course = make_course()
        batch = make_batch(course=course)
        topic = make_topic(course=course)
        make_question(topic=topic, correct_label="A")
        enroll(student=student, batch=batch)

        student_headers = login_as(student.email)
        get_response = client.get(f"/api/topics/{topic.id}/assessment", headers=student_headers)
        assert get_response.status_code == 200, get_response.text
        question_json = get_response.json()["questions"][0]
        answer_option_id = _option_id(question_json, "A")

        submit_response = client.post(
            f"/api/topics/{topic.id}/assessment/submit",
            headers=student_headers,
            json={
                "started_at": "2026-01-01T00:00:00Z",
                "answers": [
                    {"question_id": question_json["id"], "selected_option_id": answer_option_id}
                ],
            },
        )
        assert submit_response.status_code == 200, submit_response.text

        admin_headers = login_as(admin.email)
        delete_response = client.delete(f"/api/admin/topics/{topic.id}", headers=admin_headers)

        assert delete_response.status_code == 409, delete_response.text

    def test_delete_untouched_topic_still_succeeds(
        self, client, make_admin, make_course, make_topic, login_as
    ):
        admin = make_admin(email="delregress.admin2@example.com")
        course = make_course()
        topic = make_topic(course=course)

        headers = login_as(admin.email)
        response = client.delete(f"/api/admin/topics/{topic.id}", headers=headers)

        assert response.status_code == 204, response.text
