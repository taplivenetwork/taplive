def normalize_user_input(location: str, task: str, time_window: str = None):
    if not location or not task:
        raise ValueError("Location and task are required")

    return {
        "location": location.strip(),
        "task": task.strip(),
        "time_window": time_window or "Immediate"
    }
