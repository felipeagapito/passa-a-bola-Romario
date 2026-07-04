import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "copa.json"
API_HOST = "v3.football.api-sports.io"
BRT = timezone(timedelta(hours=-3))


def now_brt():
    return datetime.now(BRT).strftime("%Y-%m-%d %H:%M BRT")


def load_data():
    with DATA_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_data(data):
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with DATA_PATH.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def normalize_status(short_status):
    finished = {"FT", "AET", "PEN"}
    live = {"1H", "HT", "2H", "ET", "BT", "P", "LIVE"}
    if short_status in finished:
        return "Complete"
    if short_status in live:
        return "Live"
    return "Scheduled"


def fetch_api_fixtures(api_key, league_id, season):
    url = f"https://{API_HOST}/fixtures"
    headers = {"x-apisports-key": api_key}
    params = {"league": league_id, "season": season}
    response = requests.get(url, headers=headers, params=params, timeout=30)
    response.raise_for_status()
    payload = response.json()
    return payload.get("response", [])


def apply_api_update(seed, fixtures):
    by_id = {str(m.get("id")): m for m in seed.get("matches", [])}
    updated_count = 0

    for item in fixtures:
        fixture = item.get("fixture", {})
        fixture_id = str(fixture.get("id"))
        if fixture_id not in by_id:
            continue

        goals = item.get("goals", {}) or {}
        score = item.get("score", {}) or {}
        teams = item.get("teams", {}) or {}
        status = fixture.get("status", {}) or {}
        match = by_id[fixture_id]

        match["status"] = normalize_status(status.get("short"))
        match["home_score"] = goals.get("home")
        match["away_score"] = goals.get("away")

        penalty = score.get("penalty") or {}
        if penalty.get("home") is not None or penalty.get("away") is not None:
            match["home_pen"] = penalty.get("home")
            match["away_pen"] = penalty.get("away")

        if teams.get("home", {}).get("winner") is True:
            match["winner"] = match.get("home")
            match["winner_code"] = match.get("home_code")
        elif teams.get("away", {}).get("winner") is True:
            match["winner"] = match.get("away")
            match["winner_code"] = match.get("away_code")

        updated_count += 1

    seed["source_mode"] = "api"
    seed["api_updated_matches"] = updated_count
    return seed


def main():
    data = load_data()
    data["generated_at"] = datetime.now(BRT).isoformat()
    data["last_updated_brt"] = now_brt()

    api_key = os.getenv("API_FOOTBALL_KEY")
    league_id = os.getenv("API_FOOTBALL_LEAGUE_ID", "1")
    season = os.getenv("API_FOOTBALL_SEASON", "2026")

    if not api_key:
        data["source_mode"] = "seed"
        data["update_notice"] = "API_FOOTBALL_KEY ausente. Mantendo seed local e atualizando timestamp."
        save_data(data)
        return

    try:
        fixtures = fetch_api_fixtures(api_key, league_id, season)
        data = apply_api_update(data, fixtures)
        data["update_notice"] = "Atualização via API concluída."
    except Exception as exc:
        data["source_mode"] = "seed_error"
        data["update_notice"] = f"Falha na API. Mantendo seed local. Erro: {exc}"

    save_data(data)


if __name__ == "__main__":
    main()
