from core.engine import run_risk_engine
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.markdown import Markdown

console = Console()

def prompt_choice(label, options, default):
    """Prompt user to select an option from a list."""
    print(f"\n{label}:")
    for i, opt in enumerate(options, 1):
        print(f"  {i}. {opt}")
    choice = input(f"Select option (default {default}): ").strip()
    if choice.isdigit() and 1 <= int(choice) <= len(options):
        return options[int(choice) - 1]
    return default

if __name__ == "__main__":
    console.print("\n=== AI Weather + GIS Risk Advisor (Interactive Demo) ===\n", style="bold green")

    # --------------------
    # User Input
    # --------------------
    location = input("Enter location (e.g. Karachi): ").strip() or "Karachi"
    lat = float(input("Enter latitude (e.g. 24.8607): ") or 24.8607)
    lon = float(input("Enter longitude (e.g. 67.0011): ") or 67.0011)
    task = input("Enter task (e.g. Outdoor drone inspection): ").strip() or "Outdoor drone inspection"
    time_window = input("Enter time window (e.g. Next 2 hours): ").strip() or "Next 2 hours"

    risk_tolerance = prompt_choice("Risk Tolerance", ["low", "medium", "high"], "medium")
    mission_criticality = prompt_choice("Mission Criticality", ["routine", "important", "emergency"], "routine")
    asset_sensitivity = prompt_choice("Asset Sensitivity", ["low", "medium", "high"], "medium")

    # --------------------
    # Run Risk Engine
    # --------------------
    result = run_risk_engine(
        location, lat, lon, task, time_window,
        risk_tolerance, mission_criticality, asset_sensitivity
    )

    # --------------------
    # Pretty Display
    # --------------------
    context = result["context"]
    decision_text = result["ai_decision"]

    # Decision badge
    if "PAUSE" in decision_text.upper():
        badge = "[bold red]🔴 PAUSE[/]"
    elif "CAUTION" in decision_text.upper():
        badge = "[bold yellow]🟡 PROCEED WITH CAUTION[/]"
    else:
        badge = "[bold green]🟢 PROCEED[/]"

    console.rule("[bold blue]AI DECISION SUMMARY[/]")

    # Task, GIS, Weather table
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Category", style="bold cyan")
    table.add_column("Details", style="white")

    table.add_row("Task", f"{context['task_context']['task']} ({context['task_context']['time_window']})")
    table.add_row("GIS Area", f"{context['gis']['area_type']} - {context['gis']['risk_notes']}")
    table.add_row("Weather", f"Temp {context['weather']['temperature']}°C, Wind {context['weather']['wind_speed']} km/h, Rain {context['weather']['rain_risk']}")
    table.add_row("Risk Tolerance", context['user_preferences']['risk_tolerance'])
    table.add_row("Mission Criticality", context['user_preferences']['mission_criticality'])
    table.add_row("Asset Sensitivity", context['user_preferences']['asset_sensitivity'])

    console.print(Panel(table, title="Task & Environmental Summary", border_style="bright_magenta"))

    # Render AI reasoning as Markdown
    console.print(Panel(Markdown(decision_text), title=f"Decision: {badge}", title_align="left", border_style="bright_blue"))

    console.rule("[bold blue]END OF ASSESSMENT[/]")

