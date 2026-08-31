"""Auth tests (Phase 11): login, /api/auth/me, and password storage.

Covers app/auth/router.py and app/auth/dependencies.py.
"""


def test_login_success_returns_working_token(client, make_student, login_as):
    make_student(email="alice@example.com")
    headers = login_as("alice@example.com")

    response = client.get("/api/auth/me", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert body["role"] == "STUDENT"
    assert body["is_active"] is True
    # UserPublic must never leak the password hash.
    assert "password_hash" not in body
    assert "password" not in body


def test_login_wrong_password_and_unknown_email_return_identical_generic_401(client, make_student):
    make_student(email="bob@example.com")

    wrong_password = client.post(
        "/api/auth/login", json={"email": "bob@example.com", "password": "not-the-password"}
    )
    unknown_email = client.post(
        "/api/auth/login", json={"email": "nobody@example.com", "password": "irrelevant123"}
    )

    assert wrong_password.status_code == 401
    assert unknown_email.status_code == 401
    # Same detail message for both - the API must never reveal whether the
    # email exists (no user-enumeration via the error message).
    assert wrong_password.json()["detail"] == unknown_email.json()["detail"]


def test_login_inactive_account_is_rejected(client, make_student):
    make_student(email="inactive@example.com", is_active=False)

    response = client.post(
        "/api/auth/login", json={"email": "inactive@example.com", "password": "TestPass123!"}
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Account is inactive"


def test_me_without_token_is_401(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_with_garbage_token_is_401(client):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-jwt"})
    assert response.status_code == 401


def test_me_for_deactivated_user_is_401_even_with_a_previously_valid_token(
    client, make_student, login_as, db_session
):
    student = make_student(email="soon-deactivated@example.com")
    headers = login_as("soon-deactivated@example.com")

    # Deactivate after the token was already issued.
    student.is_active = False
    db_session.commit()

    response = client.get("/api/auth/me", headers=headers)

    # get_current_user re-checks the DB on every request rather than
    # trusting the token's claims alone - a deactivated account must lose
    # access immediately, not wait for the token to expire.
    assert response.status_code == 401


def test_password_is_never_stored_as_plaintext(db_session, make_student):
    plain_password = "TestPass123!"
    student = make_student(email="hashcheck@example.com", password=plain_password)

    assert student.password_hash != plain_password
    # bcrypt hashes always start with one of these version prefixes.
    assert student.password_hash.startswith(("$2a$", "$2b$", "$2y$"))
