#!/usr/bin/env python3
"""Parser chat WhatsApp gruppo Caco -> report.json"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from stats import build_report

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = Path(__file__).resolve().parent / "config.json"

MESSAGE_RE = re.compile(
    r"^(\d{2}/\d{2}/\d{2}),\s(\d{1,2}:\d{2}\s[AP]M)\s-\s(.+?):\s(.+)$"
)
WHATSAPP_SUFFIXES = (
    "<Questo messaggio è stato modificato>",
    "<Media omessi>",
)
SYSTEM_MARKERS = (
    "ha creato il gruppo",
    "ha cambiato la descrizione",
    "ha cambiato l'immagine",
    "ha fissato un messaggio",
    "ti ha aggiunto",
    "crittografati end-to-end",
    "I messaggi e le chiamate",
)


def load_config() -> dict:
    with open(CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


def clean_message_body(body: str) -> str:
    text = body.strip()
    for suffix in WHATSAPP_SUFFIXES:
        if suffix in text:
            text = text.replace(suffix, "").strip()
    return text


def normalize_sender(raw: str, name_mapping: dict[str, str]) -> str | None:
    sender = raw.strip().lstrip("\u200e").strip()
    if sender in name_mapping:
        return name_mapping[sender]
    for key, member_id in name_mapping.items():
        if key.lower() in sender.lower() or sender.lower() in key.lower():
            return member_id
    return None


def parse_datetime(date_str: str, time_str: str) -> datetime:
    return datetime.strptime(f"{date_str} {time_str}", "%d/%m/%y %I:%M %p")


def parse_chat(chat_path: Path, config: dict) -> dict[str, list[datetime]]:
    name_mapping = config["nameMapping"]
    visits_by_member: dict[str, list[datetime]] = defaultdict(list)

    with open(chat_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            match = MESSAGE_RE.match(line)
            if not match:
                continue

            date_str, time_str, sender_raw, body = match.groups()

            if any(marker in line for marker in SYSTEM_MARKERS):
                continue
            if sender_raw.strip().startswith("\u200e"):
                continue

            body_clean = clean_message_body(body)
            if body_clean != "\U0001f4a9":
                continue

            member_id = normalize_sender(sender_raw, name_mapping)
            if not member_id:
                print(f"Attenzione: mittente non mappato '{sender_raw}'", file=sys.stderr)
                continue

            visits_by_member[member_id].append(parse_datetime(date_str, time_str))

    return visits_by_member


def main() -> None:
    config = load_config()
    chat_path = ROOT / config["chatFile"]
    output_path = ROOT / config["outputFile"]
    midpoint = datetime.strptime(config["midpointDate"], "%Y-%m-%d").date()

    if not chat_path.exists():
        print(f"File chat non trovato: {chat_path}", file=sys.stderr)
        sys.exit(1)

    visits = parse_chat(chat_path, config)
    report = build_report(
        visits, config["members"], midpoint, config.get("provisionalRanks")
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"Report generato: {output_path}")
    print(f"Visite totali: {report['meta']['totalVisits']}")
    print(f"Partecipanti: {len(report['members'])}")


if __name__ == "__main__":
    main()
