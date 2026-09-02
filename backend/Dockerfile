FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .
COPY scripts ./scripts
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

# Run as a dedicated non-root user rather than root - the image only ever
# needs to read its own application code and talk to Postgres/the network,
# never write to the filesystem it ships with.
RUN useradd --system --create-home --uid 10001 appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Liveness/readiness probe for orchestrators (docker compose, Kubernetes,
# etc.) - hits the existing GET /health endpoint. Uses Python's stdlib
# instead of curl/wget so nothing extra needs installing in this slim image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=3)" || exit 1

# The entrypoint applies pending Alembic migrations before the app starts -
# see docker-entrypoint.sh. CMD stays overridable (e.g. by a compose file's
# `command:`) same as before this phase.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
