"""Background job queue for async analysis execution."""

import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, Optional

logger = logging.getLogger(__name__)

# Possible states for a tracked job
_QUEUED = "queued"
_RUNNING = "running"
_COMPLETED = "completed"
_FAILED = "failed"


class JobQueue:
    def __init__(self, max_workers: int) -> None:
        self._executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="analyzer")
        self._jobs: dict[int, str] = {}
        self._lock = threading.Lock()

    def submit(self, submission_id: int, fn: Callable[[], None]) -> bool:
        """Queue *fn* for background execution.

        Returns False (and does nothing) if *submission_id* is already in flight.
        Returns True when the job is accepted.
        """
        with self._lock:
            if submission_id in self._jobs and self._jobs[submission_id] in (_QUEUED, _RUNNING):
                return False
            self._jobs[submission_id] = _QUEUED

        self._executor.submit(self._run, submission_id, fn)
        return True

    def get_status(self, submission_id: int) -> Optional[str]:
        """Return current status string, or None if submission_id is unknown."""
        with self._lock:
            return self._jobs.get(submission_id)

    def mark(self, submission_id: int, status: str) -> None:
        with self._lock:
            self._jobs[submission_id] = status

    def _run(self, submission_id: int, fn: Callable[[], None]) -> None:
        self.mark(submission_id, _RUNNING)
        try:
            fn()
        except Exception:
            logger.exception("[%s] unhandled exception in background job", submission_id)
            self.mark(submission_id, _FAILED)


_queue: Optional[JobQueue] = None


def init(max_workers: int) -> None:
    global _queue
    _queue = JobQueue(max_workers)


def submit(submission_id: int, fn: Callable[[], None]) -> bool:
    return _queue.submit(submission_id, fn)


def get_status(submission_id: int) -> Optional[str]:
    return _queue.get_status(submission_id)


def mark(submission_id: int, status: str) -> None:
    _queue.mark(submission_id, status)
