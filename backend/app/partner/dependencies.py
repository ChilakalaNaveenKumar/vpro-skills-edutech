"""Shared-secret authentication for the partner API.

Digi-Setu's Next.js server is the only caller. It is a server, not a browser,
so there is no user to log in and no session to keep - a single shared key in
a header is the right shape here, and it never reaches a visitor's machine.

The key is compared with `secrets.compare_digest` rather than `==` so a caller
cannot learn it one character at a time by timing the responses.
"""

import secrets

from fastapi import Header, HTTPException, status

from app.core.config import get_settings

_UNAUTHORISED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid or missing partner key",
)


def require_partner_key(x_partner_key: str | None = Header(default=None)) -> None:
    configured = get_settings().partner_api_key
    # An unset key disables the partner surface outright. Without this, a
    # deployment that forgot to configure one would accept an empty header.
    if not configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Partner API is not enabled on this deployment",
        )
    if not x_partner_key or not secrets.compare_digest(x_partner_key, configured):
        raise _UNAUTHORISED
