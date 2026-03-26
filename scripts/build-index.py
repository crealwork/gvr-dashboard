#!/usr/bin/env python3
"""Aggregate monthly JSON files into index.json time series."""

import json
from pathlib import Path

def main():
    data_dir = Path(__file__).parent.parent / "data" / "gvr"
    monthly_files = sorted(data_dir.glob("2*.json"))  # matches YYYYMM.json, skips index.json

    if not monthly_files:
        print("No monthly JSON files found")
        return

    # Get area metadata from most recent file
    with open(monthly_files[-1], "r") as f:
        latest = json.load(f)

    areas_meta = [
        {"name": a["name"], "slug": a["slug"], "activityGroup": a["activityGroup"]}
        for a in latest["areas"]
    ]

    # Collect summaries and build time series
    summaries = {}
    time_series = {}
    property_types = ["composite", "detached", "townhome", "apartment"]

    for area in areas_meta:
        slug = area["slug"]
        time_series[slug] = {}
        for pt in property_types:
            time_series[slug][pt] = {
                "dates": [],
                "benchmarkPrices": [],
                "priceIndices": [],
                "sales": [],
                "newListings": [],
                "salesToListingsRatios": [],
                "medianSellingPrices": [],
            }

    for monthly_file in monthly_files:
        with open(monthly_file, "r") as f:
            report = json.load(f)

        date = report["date"]
        summaries[date] = report["summary"]

        for area_data in report["areas"]:
            slug = area_data["slug"]
            if slug not in time_series:
                continue

            for pt in property_types:
                ts = time_series[slug][pt]
                ts["dates"].append(date)

                price_data = area_data["types"].get(pt)
                if price_data:
                    ts["benchmarkPrices"].append(price_data["benchmarkPrice"])
                    ts["priceIndices"].append(price_data["priceIndex"])
                else:
                    ts["benchmarkPrices"].append(None)
                    ts["priceIndices"].append(None)

                activity_data = (area_data["activity"] or {}).get(pt) if pt != "composite" else None
                if activity_data:
                    ts["sales"].append(activity_data.get("sales"))
                    ts["newListings"].append(activity_data.get("newListings"))
                    ts["salesToListingsRatios"].append(activity_data.get("salesToListingsRatio"))
                    ts["medianSellingPrices"].append(activity_data.get("medianSellingPrice"))
                else:
                    ts["sales"].append(None)
                    ts["newListings"].append(None)
                    ts["salesToListingsRatios"].append(None)
                    ts["medianSellingPrices"].append(None)

    # Write index.json
    index = {
        "board": "gvr",
        "lastUpdated": latest["date"],
        "areas": areas_meta,
        "summaries": summaries,
        "timeSeries": time_series,
    }

    output_path = data_dir / "index.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False)

    size_kb = output_path.stat().st_size / 1024
    print(f"index.json written: {size_kb:.0f} KB, {len(monthly_files)} months, {len(areas_meta)} areas")

if __name__ == "__main__":
    main()
