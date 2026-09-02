"""Bootstrap CLI to create a user account (ADMIN or STUDENT).

There is no public self-registration endpoint - accounts are created by an
admin (see docs/ARCHITECTURE.md's "Authentication" section). This script
exists so the *first* admin account can be created at all, before any admin
UI exists. It is not removed once Phase 8's admin panel lands; it stays as
an operational/bootstrap tool for scripted deployments.

Usage (run from backend/, with the venv active and .env configured):

    python -m scripts.create_user --email admin@vproskills.com \\
        --password "change-me" --full-name "Admin" --role ADMIN
"""

import argparse
import sys

from app.core.enums import UserRole
from app.core.security import hash_password
from app.database.session import SessionLocal
from app.users.models import User


def create_user(email: str, password: str, full_name: str, role: UserRole) -> User:
    email = email.strip().lower()
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing is not None:
            raise SystemExit(f"A user with email {email!r} already exists (id={existing.id}).")

        user = User(
            full_name=full_name.strip(),
            email=email,
            password_hash=hash_password(password),
            role=role,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--full-name", required=True)
    parser.add_argument("--role", required=True, choices=[r.value for r in UserRole])
    args = parser.parse_args()

    if len(args.password) < 8:
        sys.exit("Password must be at least 8 characters.")

    user = create_user(args.email, args.password, args.full_name, UserRole(args.role))
    print(f"Created {user.role.value} user id={user.id} email={user.email}")


if __name__ == "__main__":
    main()
