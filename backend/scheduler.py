from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import logging

logger = logging.getLogger(__name__)
_scheduler = None

def start_scheduler():
    global _scheduler
    from services.sync import run_sync  # lazy import avoids circular

    _scheduler = BackgroundScheduler(timezone="Asia/Manila")
    _scheduler.add_job(
        run_sync,
        trigger=CronTrigger(
            day=1,
            hour=8,
            minute=0
        ),
        id="monthly_price_sync",
        replace_existing=True
    )
    _scheduler.start()
    logger.info("Scheduler started — sync runs monthly on the 1st day at 08:00 PHT")


def stop_scheduler():
    if _scheduler and _scheduler.running:
        _scheduler.shutdown()