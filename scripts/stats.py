"""Calcolo statistiche per il report Caco."""
from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Any


def daterange(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def compute_ranking(totals: dict[str, int], total_visits: int) -> list[dict[str, Any]]:
    sorted_members = sorted(totals.items(), key=lambda x: (-x[1], x[0]))
    ranking: list[dict[str, Any]] = []
    prev_count: int | None = None
    rank = 0
    for idx, (member_id, count) in enumerate(sorted_members):
        if prev_count != count:
            rank = idx + 1
        prev_count = count
        ranking.append(
            {
                "rank": rank,
                "memberId": member_id,
                "total": count,
                "percentage": round((count / total_visits) * 100, 1) if total_visits else 0,
            }
        )
    return ranking


def rank_at_date(
    visits_by_member: dict[str, list[datetime]], target: date
) -> dict[str, int]:
    totals = {
        member_id: sum(1 for v in visits if v.date() <= target)
        for member_id, visits in visits_by_member.items()
    }
    ranking = compute_ranking(totals, sum(totals.values()) or 1)
    return {entry["memberId"]: entry["rank"] for entry in ranking}


def detect_overtakes(
    visits_by_member: dict[str, list[datetime]], start: date, end: date
) -> list[dict[str, Any]]:
    """Rileva i giorni in cui un membro supera un altro nel totale cumulativo."""
    overtakes: list[dict[str, Any]] = []
    prev_totals: dict[str, int] | None = None
    currently_ahead: set[tuple[str, str]] = set()

    for day in daterange(start, end):
        totals = {
            member_id: sum(1 for v in visits if v.date() <= day)
            for member_id, visits in visits_by_member.items()
        }
        if prev_totals is not None:
            for passer in visits_by_member:
                for passed in visits_by_member:
                    if passer == passed:
                        continue
                    pair = (passer, passed)
                    if totals[passer] > totals[passed]:
                        if pair not in currently_ahead and prev_totals[passer] <= prev_totals[passed]:
                            overtakes.append(
                                {
                                    "date": day.isoformat(),
                                    "passerId": passer,
                                    "passedId": passed,
                                    "passerTotal": totals[passer],
                                    "passedTotal": totals[passed],
                                }
                            )
                        currently_ahead.add(pair)
                    elif totals[passer] < totals[passed]:
                        currently_ahead.discard(pair)
        prev_totals = totals

    return overtakes


def build_overtake_chart(
    visits_by_member: dict[str, list[datetime]],
    member_ids: list[str],
    window_start: date,
    window_end: date,
) -> list[dict[str, Any]]:
    points: list[dict[str, Any]] = []
    for member_id in member_ids:
        cumulative = 0
        visits = sorted(visits_by_member.get(member_id, []))
        visit_idx = 0
        for day in daterange(window_start, window_end):
            while visit_idx < len(visits) and visits[visit_idx].date() <= day:
                cumulative += 1
                visit_idx += 1
            points.append(
                {
                    "date": day.isoformat(),
                    "memberId": member_id,
                    "cumulative": cumulative,
                }
            )
    return points


def _pick_key_overtakes(
    overtakes: list[dict[str, Any]], member_id: str, max_count: int = 3
) -> list[dict[str, Any]]:
    member_overtakes = [o for o in overtakes if o["passerId"] == member_id]
    if not member_overtakes:
        return []
    member_overtakes.sort(key=lambda o: o["date"])
    return member_overtakes[-max_count:]


def _build_overtake_story(
    visits_by_member: dict[str, list[datetime]],
    member_id: str,
    overtakes: list[dict[str, Any]],
    start: date,
    end: date,
    padding_days: int = 3,
) -> dict[str, Any] | None:
    key_overtakes = _pick_key_overtakes(overtakes, member_id)
    if not key_overtakes:
        return None

    involved = {member_id}
    for o in key_overtakes:
        involved.add(o["passedId"])

    first = datetime.strptime(key_overtakes[0]["date"], "%Y-%m-%d").date()
    last = datetime.strptime(key_overtakes[-1]["date"], "%Y-%m-%d").date()
    window_start = max(start, first - timedelta(days=padding_days))
    window_end = min(end, last + timedelta(days=padding_days))

    return {
        "keyOvertakes": key_overtakes,
        "chart": {
            "from": window_start.isoformat(),
            "to": window_end.isoformat(),
            "memberIds": sorted(involved),
            "points": build_overtake_chart(
                visits_by_member, sorted(involved), window_start, window_end
            ),
        },
    }


def longest_streak(active_days: set[date], start: date, end: date, active: bool) -> dict[str, Any]:
    best_len = 0
    best_start: date | None = None
    best_end: date | None = None
    current_start: date | None = None
    current_len = 0

    for day in daterange(start, end):
        is_active = day in active_days
        matches = is_active if active else not is_active
        if matches:
            if current_len == 0:
                current_start = day
            current_len += 1
            if current_len > best_len:
                best_len = current_len
                best_start = current_start
                best_end = day
        else:
            current_len = 0
            current_start = None

    return {
        "days": best_len,
        "from": best_start.isoformat() if best_start else None,
        "to": best_end.isoformat() if best_end else None,
    }


def build_timeline(
    visits_by_member: dict[str, list[datetime]], start: date, end: date
) -> list[dict[str, Any]]:
    timeline: list[dict[str, Any]] = []
    for member_id in sorted(visits_by_member.keys()):
        cumulative = 0
        visits = sorted(visits_by_member[member_id])
        visit_idx = 0
        for day in daterange(start, end):
            while visit_idx < len(visits) and visits[visit_idx].date() <= day:
                cumulative += 1
                visit_idx += 1
            timeline.append(
                {"date": day.isoformat(), "memberId": member_id, "cumulative": cumulative}
            )
    return timeline


def build_daily_counts(
    visits_by_member: dict[str, list[datetime]], start: date, end: date
) -> list[dict[str, Any]]:
    daily: list[dict[str, Any]] = []
    for member_id, visits in visits_by_member.items():
        counts: dict[date, int] = defaultdict(int)
        for visit in visits:
            counts[visit.date()] += 1
        for day in daterange(start, end):
            count = counts.get(day, 0)
            if count > 0:
                daily.append({"date": day.isoformat(), "memberId": member_id, "count": count})
    return daily


def compute_highlights(
    visits_by_member: dict[str, list[datetime]],
    start: date,
    end: date,
    midpoint: date,
) -> dict[str, Any]:
    daily_by_member: dict[str, dict[date, int]] = defaultdict(lambda: defaultdict(int))
    for member_id, visits in visits_by_member.items():
        for visit in visits:
            daily_by_member[member_id][visit.date()] += 1

    single_day_record = {"memberId": "", "date": "", "count": 0}
    for member_id, days in daily_by_member.items():
        for day, count in days.items():
            if count > single_day_record["count"]:
                single_day_record = {
                    "memberId": member_id,
                    "date": day.isoformat(),
                    "count": count,
                }

    visit_streaks = []
    dry_streaks = []
    for member_id in visits_by_member:
        active_days = {v.date() for v in visits_by_member[member_id]}
        vs = longest_streak(active_days, start, end, active=True)
        ds = longest_streak(active_days, start, end, active=False)
        visit_streaks.append({"memberId": member_id, **vs})
        dry_streaks.append({"memberId": member_id, **ds})

    longest_visit = max(visit_streaks, key=lambda x: x["days"])
    longest_dry = max(dry_streaks, key=lambda x: x["days"])

    rank_mid = rank_at_date(visits_by_member, midpoint)
    rank_final = rank_at_date(visits_by_member, end)
    comebacks = []
    for member_id in visits_by_member:
        mid_rank = rank_mid.get(member_id, len(visits_by_member))
        final_rank = rank_final.get(member_id, len(visits_by_member))
        comebacks.append(
            {
                "memberId": member_id,
                "rankAtMidpoint": mid_rank,
                "finalRank": final_rank,
                "positionsGained": mid_rank - final_rank,
            }
        )
    best_comeback = max(
        comebacks,
        key=lambda x: (x["positionsGained"], -x["finalRank"]),
    )

    overtakes = detect_overtakes(visits_by_member, start, end)
    best_comeback_story = _build_overtake_story(
        visits_by_member, best_comeback["memberId"], overtakes, start, end
    )
    if best_comeback_story:
        best_comeback = {**best_comeback, "overtakeStory": best_comeback_story}

    early_date = start + timedelta(days=6)
    rank_early = rank_at_date(visits_by_member, early_date)
    early_recoveries = []
    for member_id in visits_by_member:
        early_rank = rank_early.get(member_id, len(visits_by_member))
        final_rank = rank_final.get(member_id, len(visits_by_member))
        early_recoveries.append(
            {
                "memberId": member_id,
                "rankAtEarly": early_rank,
                "rankAtMidpoint": rank_mid.get(member_id, len(visits_by_member)),
                "finalRank": final_rank,
                "positionsGainedFromEarly": early_rank - final_rank,
            }
        )
    top_early_recovery = max(
        early_recoveries,
        key=lambda x: (x["positionsGainedFromEarly"], -x["finalRank"]),
    )
    early_recovery: dict[str, Any] | None = None
    if top_early_recovery["positionsGainedFromEarly"] > 0:
        if top_early_recovery["memberId"] != best_comeback["memberId"] or (
            top_early_recovery["positionsGainedFromEarly"]
            > best_comeback["positionsGained"]
        ):
            story = _build_overtake_story(
                visits_by_member,
                top_early_recovery["memberId"],
                overtakes,
                start,
                end,
                padding_days=4,
            )
            early_recovery = {**top_early_recovery, "earlyPhaseEnd": early_date.isoformat()}
            if story:
                early_recovery["overtakeStory"] = story

    return {
        "singleDayRecord": single_day_record,
        "longestVisitStreak": {
            "memberId": longest_visit["memberId"],
            "days": longest_visit["days"],
            "from": longest_visit["from"],
            "to": longest_visit["to"],
        },
        "longestDryStreak": {
            "memberId": longest_dry["memberId"],
            "days": longest_dry["days"],
            "from": longest_dry["from"],
            "to": longest_dry["to"],
        },
        "bestComeback": best_comeback,
        "earlyRecovery": early_recovery,
    }


def time_slot(hour: int) -> str:
    if 6 <= hour < 12:
        return "mattina"
    if 12 <= hour < 18:
        return "pomeriggio"
    if 18 <= hour < 24:
        return "sera"
    return "notte"


def compute_extras(
    visits_by_member: dict[str, list[datetime]],
    start: date,
    end: date,
    midpoint: date,
) -> dict[str, Any]:
    all_visits: list[tuple[datetime, str]] = []
    for member_id, visits in visits_by_member.items():
        for visit in visits:
            all_visits.append((visit, member_id))
    all_visits.sort(key=lambda x: x[0])

    daily_totals: dict[date, int] = defaultdict(int)
    for visit, _ in all_visits:
        daily_totals[visit.date()] += 1
    busiest_day = max(daily_totals.items(), key=lambda x: x[1])

    global_slots: dict[str, int] = defaultdict(int)
    member_slots: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for visit, member_id in all_visits:
        slot = time_slot(visit.hour)
        global_slots[slot] += 1
        member_slots[member_id][slot] += 1

    preferred_slot_global = max(global_slots.items(), key=lambda x: x[1])[0]
    preferred_by_member = {
        mid: max(slots.items(), key=lambda x: x[1])[0]
        for mid, slots in member_slots.items()
    }

    weekend_counts: dict[str, int] = defaultdict(int)
    weekday_counts: dict[str, int] = defaultdict(int)
    for visit, member_id in all_visits:
        if visit.weekday() >= 5:
            weekend_counts[member_id] += 1
        else:
            weekday_counts[member_id] += 1

    weekend_warriors = []
    for member_id in visits_by_member:
        total = len(visits_by_member[member_id])
        wknd = weekend_counts[member_id]
        weekday = weekday_counts[member_id]
        wknd_pct = round((wknd / total) * 100, 1) if total else 0
        weekend_warriors.append(
            {
                "memberId": member_id,
                "weekendCount": wknd,
                "weekdayCount": weekday,
                "weekendPercentage": wknd_pct,
            }
        )
    top_weekend = max(weekend_warriors, key=lambda x: x["weekendPercentage"])

    first_of_day: dict[str, int] = defaultdict(int)
    by_day: dict[date, list[tuple[datetime, str]]] = defaultdict(list)
    for visit, member_id in all_visits:
        by_day[visit.date()].append((visit, member_id))
    for day_visits in by_day.values():
        day_visits.sort(key=lambda x: x[0])
        first_of_day[day_visits[0][1]] += 1
    top_first = max(first_of_day.items(), key=lambda x: x[1])

    night_counts: dict[str, int] = defaultdict(int)
    for visit, member_id in all_visits:
        if visit.hour >= 22 or visit.hour < 6:
            night_counts[member_id] += 1
    top_night = max(night_counts.items(), key=lambda x: x[1]) if night_counts else ("", 0)

    rank_mid = rank_at_date(visits_by_member, midpoint)
    rank_final = rank_at_date(visits_by_member, end)
    midpoint_vs_final = [
        {
            "memberId": member_id,
            "rankAtMidpoint": rank_mid.get(member_id, 0),
            "finalRank": rank_final.get(member_id, 0),
            "change": rank_mid.get(member_id, 0) - rank_final.get(member_id, 0),
        }
        for member_id in sorted(visits_by_member.keys())
    ]

    return {
        "busiestDay": {"date": busiest_day[0].isoformat(), "count": busiest_day[1]},
        "preferredTimeSlot": {
            "global": preferred_slot_global,
            "globalCounts": dict(global_slots),
            "byMember": preferred_by_member,
        },
        "weekendWarrior": top_weekend,
        "firstOfDay": {"memberId": top_first[0], "count": top_first[1]},
        "nightOwl": {"memberId": top_night[0], "count": top_night[1]},
        "midpointVsFinal": midpoint_vs_final,
    }


def build_rank_timeline(
    visits_by_member: dict[str, list[datetime]], start: date, end: date
) -> list[dict[str, Any]]:
    """Posizione in classifica (cumulativa) per ogni membro e ogni giorno."""
    timeline: list[dict[str, Any]] = []
    for day in daterange(start, end):
        totals = {
            member_id: sum(1 for v in visits if v.date() <= day)
            for member_id, visits in visits_by_member.items()
        }
        ranks = compute_ranking(totals, sum(totals.values()) or 1)
        rank_by_member = {entry["memberId"]: entry["rank"] for entry in ranks}
        for member_id in sorted(visits_by_member.keys()):
            timeline.append(
                {
                    "date": day.isoformat(),
                    "memberId": member_id,
                    "rank": rank_by_member[member_id],
                }
            )
    return timeline


def build_daily_averages(
    visits_by_member: dict[str, list[datetime]], start: date, end: date
) -> list[dict[str, Any]]:
    total_days = (end - start).days + 1
    averages: list[dict[str, Any]] = []

    for member_id, visits in visits_by_member.items():
        total = len(visits)
        active_days = len({v.date() for v in visits})
        averages.append(
            {
                "memberId": member_id,
                "total": total,
                "activeDays": active_days,
                "dailyAverage": round(total / total_days, 2),
                "dailyAverageActiveDays": round(total / active_days, 2) if active_days else 0,
            }
        )

    averages.sort(key=lambda x: (-x["dailyAverage"], x["memberId"]))
    return averages


def build_report(
    visits_by_member: dict[str, list[datetime]],
    members_config: dict[str, dict[str, str]],
    midpoint: date,
    provisional_ranks: dict[str, int] | None = None,
) -> dict[str, Any]:
    all_visits = [v for visits in visits_by_member.values() for v in visits]
    if not all_visits:
        raise ValueError("Nessuna visita trovata nella chat.")

    start = min(v.date() for v in all_visits)
    end = max(v.date() for v in all_visits)
    total_visits = len(all_visits)

    totals = {mid: len(visits_by_member.get(mid, [])) for mid in members_config}
    for mid in visits_by_member:
        if mid not in totals:
            totals[mid] = len(visits_by_member[mid])

    members = []
    for member_id, cfg in members_config.items():
        count = len(visits_by_member.get(member_id, []))
        members.append(
            {
                "id": member_id,
                "displayName": cfg["displayName"],
                "color": cfg["color"],
                "initials": cfg["initials"],
                "total": count,
            }
        )
    members.sort(key=lambda m: -m["total"])

    ranking = compute_ranking(
        {m["id"]: m["total"] for m in members}, total_visits
    )

    return {
        "meta": {
            "periodStart": start.isoformat(),
            "periodEnd": end.isoformat(),
            "totalVisits": total_visits,
            "totalDays": (end - start).days + 1,
            "dailyAverage": round(total_visits / ((end - start).days + 1), 1),
            "generatedAt": datetime.now().isoformat(),
        },
        "members": members,
        "ranking": ranking,
        "dailyAverages": build_daily_averages(visits_by_member, start, end),
        "timeline": build_timeline(visits_by_member, start, end),
        "rankTimeline": build_rank_timeline(visits_by_member, start, end),
        "provisionalRanks": provisional_ranks or {},
        "dailyCounts": build_daily_counts(visits_by_member, start, end),
        "highlights": compute_highlights(visits_by_member, start, end, midpoint),
        "extras": compute_extras(visits_by_member, start, end, midpoint),
    }
