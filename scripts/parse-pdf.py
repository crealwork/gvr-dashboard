#!/usr/bin/env python3
"""
Parse GVR (Greater Vancouver Realtors) monthly market report PDFs into JSON.

Usage:
    python scripts/parse-pdf.py                    # parse all PDFs
    python scripts/parse-pdf.py 202602             # parse single PDF
    python scripts/parse-pdf.py --verify 202602    # parse and verify expected values
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PDFTOTEXT = r"C:\Program Files\Git\mingw64\bin\pdftotext.exe"

AREAS_ORDERED = [
    "Greater Vancouver",
    "Bowen Island",
    "Burnaby East",
    "Burnaby North",
    "Burnaby South",
    "Coquitlam",
    "Ladner",
    "Maple Ridge",
    "New Westminster",
    "North Vancouver",
    "Pitt Meadows",
    "Port Coquitlam",
    "Port Moody",
    "Richmond",
    "Squamish",
    "Sunshine Coast",
    "Tsawwassen",
    "Vancouver East",
    "Vancouver West",
    "West Vancouver",
    "Whistler",
]

# Sort longest first to prevent substring matches (e.g. "Coquitlam" matching "Port Coquitlam")
AREAS_MATCH_ORDER = sorted(AREAS_ORDERED, key=len, reverse=True)

ACTIVITY_GROUP_MAP = {
    "Burnaby East": "Burnaby",
    "Burnaby North": "Burnaby",
    "Burnaby South": "Burnaby",
    "Maple Ridge": "Maple Ridge/Pitt Meadows",
    "Pitt Meadows": "Maple Ridge/Pitt Meadows",
    "Port Moody": "Port Moody/Belcarra",
    "Ladner": "Delta - South",
    "Tsawwassen": "Delta - South",
    "West Vancouver": "West Vancouver/Howe Sound",
    "Whistler": "Whistler/Pemberton",
}

ACTIVITY_GROUPS_ORDERED = [
    "Greater Vancouver",
    "Bowen Island",
    "Burnaby",
    "Coquitlam",
    "Delta - South",
    "Maple Ridge/Pitt Meadows",
    "New Westminster",
    "North Vancouver",
    "Port Coquitlam",
    "Port Moody/Belcarra",
    "Richmond",
    "Squamish",
    "Sunshine Coast",
    "Vancouver East",
    "Vancouver West",
    "West Vancouver/Howe Sound",
    "Whistler/Pemberton",
]

MONTH_NAMES = {
    "January": "01", "February": "02", "March": "03", "April": "04",
    "May": "05", "June": "06", "July": "07", "August": "08",
    "September": "09", "October": "10", "November": "11", "December": "12",
}


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


# ---------------------------------------------------------------------------
# PDF text extraction
# ---------------------------------------------------------------------------

def extract_text(pdf_path: str) -> str:
    """Run pdftotext -layout and return text."""
    result = subprocess.run(
        [PDFTOTEXT, "-layout", pdf_path, "-"],
        capture_output=True, text=True, timeout=30,
    )
    if result.returncode != 0:
        raise RuntimeError(f"pdftotext failed: {result.stderr}")
    return result.stdout


# ---------------------------------------------------------------------------
# Summary extraction
# ---------------------------------------------------------------------------

def parse_summary(text: str, yyyymm: str) -> dict:
    """Extract summary numbers from news release text."""
    summary = {}

    # Headline: first real headline after "FOR IMMEDIATE RELEASE:" or "News Release"
    m = re.search(r"FOR IMMEDIATE RELEASE:\s*\n\s*\n(.*?)(?:\n\s*\n|\n\s*VANCOUVER)", text, re.DOTALL)
    if not m:
        # Fallback: some PDFs start with "News Release\n\nHeadline"
        m = re.search(r"News Release\s*\n\s*\n(.*?)(?:\n\s*\n)", text, re.DOTALL)
    if m:
        headline = m.group(1).strip()
        # Clean up multi-line headlines
        headline = re.sub(r"\s+", " ", headline)
        summary["headline"] = headline

    # Total sales — look for "totalled X,XXX in Month YYYY" or "totalled X,XXX in Month"
    # Try several patterns to handle different phrasings across years
    sales_patterns = [
        r"(?:residential\s+(?:home\s+)?sales|residential\s+property\s+sales|home\s+sales).*?totall?ed\s+([\d,]+)\s+in",
        r"totall?ed\s+([\d,]+)\s+in\s+\w+\s+\d{4}",
        r"region\s+totall?ed\s+([\d,]+)",
        r"sales.*?totall?ed\s+([\d,]+)",
    ]
    for pat in sales_patterns:
        m = re.search(pat, text, re.IGNORECASE | re.DOTALL)
        if m:
            summary["totalSales"] = int(m.group(1).replace(",", ""))
            break

    # New listings (text may span multiple lines, different phrasings across eras)
    new_listings_patterns = [
        r"(?:There were|were)\s+([\d,]+)\s+(?:detached|properties|residential).*?(?:newly listed|listed for sale)",
        r"[Nn]ew listings\s+for\s+detached.*?totall?ed\s+([\d,]+)",
        r"([\d,]+)\s+(?:detached, attached and apartment )?properties\s+newly\s+listed",
    ]
    for pat in new_listings_patterns:
        m = re.search(pat, text, re.IGNORECASE | re.DOTALL)
        if m:
            summary["newListings"] = int(m.group(1).replace(",", ""))
            break

    # Active listings (text may span multiple lines, multiple phrasings)
    active_patterns = [
        r"total number of (?:properties|homes) currently listed.*?is\s+([\d,]+)",
        r"currently.*?total number of (?:properties|homes) listed.*?is\s+([\d,]+)",
        r"currently listed for sale.*?is\s+([\d,]+)",
    ]
    for pat in active_patterns:
        m = re.search(pat, text, re.IGNORECASE | re.DOTALL)
        if m:
            summary["activeListings"] = int(m.group(1).replace(",", ""))
            break

    # Sales-to-active ratio (text may span multiple lines)
    m = re.search(
        r"sales-to-active\s+listings?\s+ratio.*?is\s+([\d.]+)\s*per\s*cent",
        text, re.IGNORECASE | re.DOTALL,
    )
    if m:
        summary["salesToActiveRatio"] = float(m.group(1))

    # Composite benchmark price (text may span multiple lines)
    m = re.search(
        r"(?:composite\s+)?benchmark\s+price\s+for\s+all\s+residential.*?(?:is\s+currently\s+)?\$([\d,]+)",
        text, re.IGNORECASE | re.DOTALL,
    )
    if not m:
        m = re.search(
            r"(?:HPI|Home Price Index).*?composite.*?benchmark.*?\$([\d,]+)",
            text, re.IGNORECASE | re.DOTALL,
        )
    if not m:
        m = re.search(
            r"benchmark.*?all\s+residential.*?\$([\d,]+)",
            text, re.IGNORECASE | re.DOTALL,
        )
    if m:
        summary["compositeBenchmarkPrice"] = int(m.group(1).replace(",", ""))

    return summary


# ---------------------------------------------------------------------------
# Benchmark table parsing
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Activity table parsing
# ---------------------------------------------------------------------------


def _detect_column_areas(text: str) -> list:
    """
    Detect the activity area column names from the SALES Facts header.
    The areas are listed diagonally in the header rows.

    Known possible areas (in order they appear):
    Bowen Island, Burnaby, Coquitlam, Delta - South, Islands - Gulf,
    Maple Ridge/Pitt Meadows, New Westminster, North Vancouver,
    Port Coquitlam, Port Moody/Belcarra, Richmond, Squamish,
    Sunshine Coast, Vancouver East, Vancouver West,
    West Vancouver/Howe Sound, Whistler/Pemberton

    Older PDFs (pre-2025) don't have Bowen Island as a separate column.
    """
    # All possible column area names, longest first for matching
    all_possible = [
        "West Vancouver/Howe Sound",
        "Maple Ridge/Pitt Meadows",
        "Port Moody/Belcarra",
        "Whistler/Pemberton",
        "New Westminster",
        "North Vancouver",
        "Sunshine Coast",
        "Port Coquitlam",
        "Islands - Gulf",
        "Vancouver East",
        "Vancouver West",
        "Delta - South",
        "Bowen Island",
        "Coquitlam",
        "Richmond",
        "Squamish",
        "Burnaby",
    ]

    # Find SALES section header
    m = re.search(
        r'MLS.*?SALES\s+Facts(.*?)(?:Number|Detached)',
        text, re.DOTALL | re.IGNORECASE,
    )
    if not m:
        # Fallback: use default order without Bowen Island
        return [
            "Burnaby", "Coquitlam", "Delta - South", "Islands - Gulf",
            "Maple Ridge/Pitt Meadows", "New Westminster", "North Vancouver",
            "Port Coquitlam", "Port Moody/Belcarra", "Richmond", "Squamish",
            "Sunshine Coast", "Vancouver East", "Vancouver West",
            "West Vancouver/Howe Sound", "Whistler/Pemberton",
        ]

    header_text = m.group(1)

    # Find which areas appear in the header
    found = set()
    for area in all_possible:
        # Use slightly fuzzy matching — "Burnab y" in some PDFs
        if area in header_text:
            found.add(area)
        elif area == "Burnaby" and "Burnab" in header_text:
            found.add(area)

    # Sort in the canonical order
    canonical_order = [
        "Bowen Island", "Burnaby", "Coquitlam", "Delta - South",
        "Islands - Gulf", "Maple Ridge/Pitt Meadows", "New Westminster",
        "North Vancouver", "Port Coquitlam", "Port Moody/Belcarra",
        "Richmond", "Squamish", "Sunshine Coast", "Vancouver East",
        "Vancouver West", "West Vancouver/Howe Sound", "Whistler/Pemberton",
    ]

    return [a for a in canonical_order if a in found]


def parse_activity_tables(text: str) -> dict:
    """
    Parse the MLS SALES Facts and LISTINGS Facts horizontal tables.

    These tables have activity area names as COLUMN headers (horizontally),
    and rows for Detached/Attached/Apartment data. Each row has one number
    per area column.

    Returns dict of activity_group -> {
        detached: {sales, newListings, salesToListingsRatio, medianSellingPrice},
        townhome: {...},
        apartment: {...}
    }
    """
    result = {}

    # Detect column areas from the SALES section header
    column_areas = _detect_column_areas(text)
    # Always add "Greater Vancouver" at the end for TOTALS
    column_areas.append("Greater Vancouver")

    # Parse SALES section
    sales_data = _parse_horizontal_sales(text, column_areas)

    # Parse LISTINGS section
    listings_data = _parse_horizontal_listings(text, column_areas)

    # Merge
    for area in column_areas:
        if area == "Islands - Gulf":
            continue
        entry = {}
        for prop_type in ["detached", "townhome", "apartment"]:
            d = {}
            if area in sales_data and prop_type in sales_data[area]:
                d.update(sales_data[area][prop_type])
            if area in listings_data and prop_type in listings_data[area]:
                d.update(listings_data[area][prop_type])
            if d:
                entry[prop_type] = d
        if entry:
            result[area] = entry

    return result


def _extract_row_numbers(line: str) -> list:
    """Extract all integer/comma-separated numbers from a line, preserving order."""
    return re.findall(r'\b(\d[\d,]*)\b', line)


def _extract_row_prices(line: str) -> list:
    """Extract all dollar prices or 'n/a' from a line, preserving order and position."""
    # Match $X,XXX,XXX or n/a
    tokens = re.findall(r'(?:\$([\d,]+)|(n/a))', line)
    result = []
    for price_str, na in tokens:
        if na:
            result.append(None)
        else:
            result.append(int(price_str.replace(",", "")))
    return result


def _extract_row_pcts(line: str) -> list:
    """Extract percentage values or n/a from a line."""
    tokens = re.findall(r'(?:(\d+(?:\.\d+)?)%|(n/a))', line)
    result = []
    for pct_str, na in tokens:
        if na:
            result.append(None)
        else:
            result.append(float(pct_str))
    return result


def _find_data_rows(section_text: str, row_type: str) -> tuple:
    """
    Find 3 data rows (Detached, Attached/Attached, Apartment) for the current month
    in a horizontal table section.

    row_type: "numbers" for sales/listings counts, "prices" for median prices,
              "pcts" for sales-to-listings ratios

    Returns (det_values, att_values, apt_values) or None for each if not found.
    """
    lines = section_text.split("\n")

    det_row = None
    att_row = None
    apt_row = None

    # State machine: find first block of Detached + Attached + Apartment rows
    # "Number Detached" line has the first detached data row
    # Next data rows are Attached and Apartment

    if row_type == "numbers":
        # Look for the first "Detached" row with enough numbers (>=10)
        for i, line in enumerate(lines):
            stripped = line.strip()

            if "Detached" in stripped and det_row is None:
                nums = _extract_row_numbers(stripped)
                if len(nums) >= 10:
                    det_row = nums
                    continue

            if det_row is not None and att_row is None:
                # Next line(s) with numbers is Attached
                nums = _extract_row_numbers(stripped)
                if len(nums) >= 10:
                    att_row = nums
                    continue

            if att_row is not None and apt_row is None:
                nums = _extract_row_numbers(stripped)
                if len(nums) >= 10:
                    apt_row = nums
                    break

    elif row_type == "prices":
        # Look for rows with $ signs
        for i, line in enumerate(lines):
            stripped = line.strip()
            if "$" not in stripped and "n/a" not in stripped.lower():
                continue

            prices = _extract_row_prices(stripped)
            if len(prices) >= 8:
                if det_row is None:
                    det_row = prices
                elif att_row is None:
                    att_row = prices
                elif apt_row is None:
                    apt_row = prices
                    break

    elif row_type == "pcts":
        # Look for rows with % signs
        for i, line in enumerate(lines):
            stripped = line.strip()
            if "%" not in stripped:
                continue

            pcts = _extract_row_pcts(stripped)
            if len(pcts) >= 8:
                if det_row is None:
                    det_row = pcts
                elif att_row is None:
                    att_row = pcts
                elif apt_row is None:
                    apt_row = pcts
                    break

    return det_row, att_row, apt_row


def _parse_horizontal_sales(text: str, column_areas: list) -> dict:
    """Parse the SALES Facts horizontal table."""
    result = {}

    # Find SALES section
    m = re.search(
        r'MLS.*?SALES\s+Facts(.*?)(?:MLS.*?LISTINGS\s+Facts|Residential Average|\Z)',
        text, re.DOTALL | re.IGNORECASE,
    )
    if not m:
        return result

    sales_text = m.group(1)

    # Get current month sales numbers
    det_sales, att_sales, apt_sales = _find_data_rows(sales_text, "numbers")

    # Get current month median prices
    det_prices, att_prices, apt_prices = _find_data_rows(sales_text, "prices")

    # Map to areas
    for idx, area in enumerate(column_areas):
        if area == "Islands - Gulf":
            continue
        entry = {}

        if det_sales and idx < len(det_sales):
            try:
                entry["detached"] = {"sales": int(det_sales[idx].replace(",", ""))}
            except (ValueError, IndexError):
                pass

        if att_sales and idx < len(att_sales):
            try:
                entry.setdefault("townhome", {})["sales"] = int(att_sales[idx].replace(",", ""))
            except (ValueError, IndexError):
                pass

        if apt_sales and idx < len(apt_sales):
            try:
                entry.setdefault("apartment", {})["sales"] = int(apt_sales[idx].replace(",", ""))
            except (ValueError, IndexError):
                pass

        # Median prices
        if det_prices and idx < len(det_prices) and det_prices[idx]:
            entry.setdefault("detached", {})["medianSellingPrice"] = det_prices[idx]

        if att_prices and idx < len(att_prices) and att_prices[idx]:
            entry.setdefault("townhome", {})["medianSellingPrice"] = att_prices[idx]

        if apt_prices and idx < len(apt_prices) and apt_prices[idx]:
            entry.setdefault("apartment", {})["medianSellingPrice"] = apt_prices[idx]

        if entry:
            result[area] = entry

    return result


def _parse_horizontal_listings(text: str, column_areas: list) -> dict:
    """Parse the LISTINGS Facts horizontal table."""
    result = {}

    # Find LISTINGS section
    m = re.search(
        r'MLS.*?LISTINGS\s+Facts(.*?)(?:Residential Average|Listing\s*&\s*Sales|\Z)',
        text, re.DOTALL | re.IGNORECASE,
    )
    if not m:
        return result

    listings_text = m.group(1)

    # Get current month listing counts
    det_listings, att_listings, apt_listings = _find_data_rows(listings_text, "numbers")

    # Get sales-to-listings ratios
    det_ratio, att_ratio, apt_ratio = _find_data_rows(listings_text, "pcts")

    # Map to areas
    for idx, area in enumerate(column_areas):
        if area == "Islands - Gulf":
            continue
        entry = {}

        if det_listings and idx < len(det_listings):
            try:
                entry["detached"] = {"newListings": int(det_listings[idx].replace(",", ""))}
            except (ValueError, IndexError):
                pass

        if att_listings and idx < len(att_listings):
            try:
                entry.setdefault("townhome", {})["newListings"] = int(att_listings[idx].replace(",", ""))
            except (ValueError, IndexError):
                pass

        if apt_listings and idx < len(apt_listings):
            try:
                entry.setdefault("apartment", {})["newListings"] = int(apt_listings[idx].replace(",", ""))
            except (ValueError, IndexError):
                pass

        # Sales-to-listings ratio
        if det_ratio and idx < len(det_ratio) and det_ratio[idx] is not None:
            entry.setdefault("detached", {})["salesToListingsRatio"] = det_ratio[idx]

        if att_ratio and idx < len(att_ratio) and att_ratio[idx] is not None:
            entry.setdefault("townhome", {})["salesToListingsRatio"] = att_ratio[idx]

        if apt_ratio and idx < len(apt_ratio) and apt_ratio[idx] is not None:
            entry.setdefault("apartment", {})["salesToListingsRatio"] = apt_ratio[idx]

        if entry:
            result[area] = entry

    return result


# ---------------------------------------------------------------------------
# Improved benchmark parsing: direct approach
# ---------------------------------------------------------------------------

def parse_benchmarks_direct(text: str) -> dict:
    """
    Direct approach: scan text line by line, detect property type section,
    match area names, extract price + index + change percentages.

    This handles both old and new PDF formats.
    """
    result = {}
    lines = text.split("\n")

    current_type = None
    all_areas = set(AREAS_ORDERED)

    # Phase 1: find all property type section boundaries
    sections = []  # (type_key, start_line, end_line)
    type_starts = []

    for i, line in enumerate(lines):
        if re.search(r"Residential\s*/?\s*Composite", line):
            type_starts.append(("composite", i))
        elif re.search(r"Single\s+Family\s+Detached", line):
            type_starts.append(("detached", i))
        elif re.search(r"Townho(?:me|use)\b", line) and i < len(lines) - 1:
            # Check it's a section header, not data
            if "Price" in line or "Property" in line or re.match(r'^\s*Townho', line):
                type_starts.append(("townhome", i))

    # Phase 2: for each section, parse data
    for si, (type_key, start) in enumerate(type_starts):
        end = type_starts[si + 1][1] if si + 1 < len(type_starts) else len(lines)

        for i in range(start, end):
            line = lines[i]

            # Find area name
            area_found = None
            for area in AREAS_MATCH_ORDER:
                if area in line:
                    area_found = area
                    break

            if area_found is None:
                continue

            # Find dollar price
            price_match = re.search(r"\$([\d,]+)", line)
            if not price_match:
                continue

            price = int(price_match.group(1).replace(",", ""))

            # Find all floating point numbers after the price
            after_price = line[price_match.end():]
            nums = re.findall(r"(-?\d+\.?\d*)", after_price)

            if not nums:
                continue

            index_val = float(nums[0])
            changes = []
            for n in nums[1:]:
                try:
                    changes.append(float(n))
                except ValueError:
                    break

            if area_found not in result:
                result[area_found] = {}

            change_dict = {}
            change_keys = ["1m", "3m", "6m", "1y", "3y", "5y", "10y"]
            for j, key in enumerate(change_keys):
                if j < len(changes):
                    change_dict[key] = changes[j]

            result[area_found][type_key] = {
                "benchmarkPrice": price,
                "priceIndex": index_val,
                "change": change_dict,
            }

    # Phase 3: handle page 2 (townhome + apartment)
    # Find the second "Property Type" header
    page2_markers = list(re.finditer(r"Property Type\b", text))
    if len(page2_markers) >= 2:
        page2_text = text[page2_markers[1].start():]
        # Find "HOW TO READ" to bound page 2
        how_end = re.search(r"HOW TO READ", page2_text)
        if how_end:
            page2_text = page2_text[:how_end.start()]

        page2_lines = page2_text.split("\n")

        # Collect all data rows with area names and prices
        data_entries = []
        for line in page2_lines:
            for area in AREAS_MATCH_ORDER:
                if area in line:
                    price_match = re.search(r"\$([\d,]+)", line)
                    if price_match:
                        price = int(price_match.group(1).replace(",", ""))
                        after_price = line[price_match.end():]
                        nums = re.findall(r"(-?\d+\.?\d*)", after_price)
                        if nums:
                            index_val = float(nums[0])
                            changes = [float(n) for n in nums[1:]]
                            data_entries.append((area, price, index_val, changes))
                    break

        # Split into townhome and apartment
        if data_entries:
            gv_indices = [i for i, d in enumerate(data_entries) if d[0] == "Greater Vancouver"]

            if len(gv_indices) >= 2:
                split = gv_indices[1]
            else:
                # Find where areas start repeating
                seen = set()
                split = len(data_entries)
                for i, d in enumerate(data_entries):
                    if d[0] in seen:
                        split = i
                        break
                    seen.add(d[0])

            townhome_entries = data_entries[:split]
            apartment_entries = data_entries[split:]

            for area, price, index_val, changes in townhome_entries:
                if area not in result:
                    result[area] = {}
                change_dict = {}
                change_keys = ["1m", "3m", "6m", "1y", "3y", "5y", "10y"]
                for j, key in enumerate(change_keys):
                    if j < len(changes):
                        change_dict[key] = changes[j]
                result[area]["townhome"] = {
                    "benchmarkPrice": price,
                    "priceIndex": index_val,
                    "change": change_dict,
                }

            for area, price, index_val, changes in apartment_entries:
                if area not in result:
                    result[area] = {}
                change_dict = {}
                change_keys = ["1m", "3m", "6m", "1y", "3y", "5y", "10y"]
                for j, key in enumerate(change_keys):
                    if j < len(changes):
                        change_dict[key] = changes[j]
                result[area]["apartment"] = {
                    "benchmarkPrice": price,
                    "priceIndex": index_val,
                    "change": change_dict,
                }

    # Phase 4: fix interleaved data for older PDFs
    # In older PDFs, composite section has interleaved detached continuation rows
    # Detect this: if detached entries exist but have <= 2 change values
    has_short_detached = any(
        "detached" in types and len(types["detached"].get("change", {})) <= 2
        for types in result.values()
    )

    if has_short_detached:
        result = merge_interleaved_detached(text, result)

    return result


def merge_interleaved_detached(text: str, benchmark_data: dict) -> dict:
    """
    For older PDFs where composite and detached are interleaved:
    - Parse the "extra" rows between composite area entries
    - These contain the detached 6m-10y values

    Pattern:
    Composite row:  Area  $price  index  1m%  3m%  6m%  1y%  3y%  5y%  10y%
    Detached extra:                              6m%  1y%  3y%  5y%  10y%
    """
    lines = text.split("\n")

    # Find composite section
    in_composite = False
    last_area = None
    areas_with_extras = {}

    for line in lines:
        if re.search(r"Residential\s*/?\s*Composite", line):
            in_composite = True
            continue
        if re.search(r"Single\s+Family\s+Detached", line):
            break
        if re.search(r"HOW TO READ", line):
            break

        if not in_composite:
            continue

        # Check if line has an area name with data
        area_found = None
        for area in AREAS_MATCH_ORDER:
            if area in line and "$" in line:
                area_found = area
                break

        if area_found:
            last_area = area_found
            continue

        if area_found is None and "Lower Mainland" in line and "$" in line:
            last_area = "__skip__"
            continue

        # Check for orphan percentage rows
        stripped = line.strip()
        if not stripped or last_area is None or last_area == "__skip__":
            continue

        pcts = re.findall(r"(-?\d+\.?\d*)%", stripped)
        if len(pcts) >= 4:
            areas_with_extras[last_area] = [float(p) for p in pcts]
            last_area = None

    # Merge extra values into detached change data
    for area, extra_vals in areas_with_extras.items():
        if area in benchmark_data and "detached" in benchmark_data[area]:
            det = benchmark_data[area]["detached"]
            existing = det.get("change", {})
            change_keys = ["6m", "1y", "3y", "5y", "10y"]
            for j, key in enumerate(change_keys):
                if j < len(extra_vals):
                    existing[key] = extra_vals[j]
            det["change"] = existing

    return benchmark_data


# ---------------------------------------------------------------------------
# Main parse function
# ---------------------------------------------------------------------------

def parse_pdf(pdf_path: str, yyyymm: str) -> dict:
    """Parse a single PDF and return structured data."""
    text = extract_text(pdf_path)

    year = yyyymm[:4]
    month = yyyymm[4:6]
    date_str = f"{year}-{month}"

    # 1. Parse summary
    summary = parse_summary(text, yyyymm)

    # 2. Parse benchmark tables
    benchmark_data = parse_benchmarks_direct(text)

    # 2b. Fill in composite benchmark price from table if not in summary
    if "compositeBenchmarkPrice" not in summary:
        gv_comp = benchmark_data.get("Greater Vancouver", {}).get("composite", {})
        if gv_comp.get("benchmarkPrice"):
            summary["compositeBenchmarkPrice"] = gv_comp["benchmarkPrice"]

    # 3. Parse activity tables
    activity_data = parse_activity_tables(text)

    # 4. Build output
    areas = []
    for area_name in AREAS_ORDERED:
        slug = slugify(area_name)
        activity_group = ACTIVITY_GROUP_MAP.get(area_name, area_name)

        area_entry = {
            "name": area_name,
            "slug": slug,
            "activityGroup": activity_group,
            "types": {},
            "activity": None,
        }

        # Add benchmark data
        if area_name in benchmark_data:
            for type_key in ["composite", "detached", "townhome", "apartment"]:
                if type_key in benchmark_data[area_name]:
                    area_entry["types"][type_key] = benchmark_data[area_name][type_key]

        # Add activity data (mapped through activity group)
        if activity_group in activity_data:
            area_entry["activity"] = activity_data[activity_group]

        areas.append(area_entry)

    return {
        "date": date_str,
        "board": "gvr",
        "summary": summary,
        "areas": areas,
    }


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

def verify_202602(data: dict) -> list:
    """Verify expected values for 202602.pdf."""
    errors = []

    def check(path, expected, actual):
        if actual != expected:
            errors.append(f"  {path}: expected {expected}, got {actual}")

    s = data.get("summary", {})
    check("summary.totalSales", 1648, s.get("totalSales"))
    check("summary.compositeBenchmarkPrice", 1100300, s.get("compositeBenchmarkPrice"))
    check("summary.newListings", 4734, s.get("newListings"))
    check("summary.activeListings", 13545, s.get("activeListings"))

    # Find Greater Vancouver area
    gv = None
    richmond = None
    for a in data.get("areas", []):
        if a["name"] == "Greater Vancouver":
            gv = a
        if a["name"] == "Richmond":
            richmond = a

    if gv:
        comp = gv.get("types", {}).get("composite", {})
        check("GV.composite.benchmarkPrice", 1100300, comp.get("benchmarkPrice"))
        check("GV.composite.priceIndex", 314.7, comp.get("priceIndex"))
    else:
        errors.append("  Greater Vancouver area not found")

    if richmond:
        det = richmond.get("types", {}).get("detached", {})
        check("Richmond.detached.benchmarkPrice", 1987200, det.get("benchmarkPrice"))
    else:
        errors.append("  Richmond area not found")

    return errors


def verify_201601(data: dict) -> list:
    """Verify expected values for 201601.pdf."""
    errors = []

    def check(path, expected, actual):
        if actual != expected:
            errors.append(f"  {path}: expected {expected}, got {actual}")

    s = data.get("summary", {})
    check("summary.totalSales", 2519, s.get("totalSales"))
    check("summary.compositeBenchmarkPrice", 775300, s.get("compositeBenchmarkPrice"))

    return errors


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    project_root = Path(__file__).resolve().parent.parent
    pdf_dir = project_root / "gvr-market-reports"
    out_dir = project_root / "data" / "gvr"
    out_dir.mkdir(parents=True, exist_ok=True)

    verify_mode = "--verify" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("-")]

    if args:
        pdfs = [pdf_dir / f"{args[0]}.pdf"]
    else:
        pdfs = sorted(pdf_dir.glob("*.pdf"))

    success = 0
    fail = 0
    warnings = 0

    for pdf_path in pdfs:
        yyyymm = pdf_path.stem
        if not re.match(r"^\d{6}$", yyyymm):
            continue

        try:
            data = parse_pdf(str(pdf_path), yyyymm)

            # Validate: must have some benchmark data
            areas_with_data = sum(
                1 for a in data["areas"] if a["types"]
            )

            if areas_with_data < 10:
                print(f"WARN {yyyymm}: only {areas_with_data} areas with benchmark data")
                warnings += 1

            # Write output
            out_path = out_dir / f"{yyyymm}.json"
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            # Verification
            if verify_mode or len(pdfs) == 1:
                if yyyymm == "202602":
                    errs = verify_202602(data)
                    if errs:
                        print(f"VERIFY FAIL {yyyymm}:")
                        for e in errs:
                            print(e)
                    else:
                        print(f"VERIFY OK {yyyymm}")
                elif yyyymm == "201601":
                    errs = verify_201601(data)
                    if errs:
                        print(f"VERIFY FAIL {yyyymm}:")
                        for e in errs:
                            print(e)
                    else:
                        print(f"VERIFY OK {yyyymm}")

            success += 1
            if len(pdfs) > 1:
                print(f"OK   {yyyymm} — {areas_with_data} areas")

        except Exception as e:
            fail += 1
            print(f"FAIL {yyyymm}: {e}")

    print(f"\n--- Results: {success} success, {fail} fail, {warnings} warnings out of {len(pdfs)} PDFs ---")


if __name__ == "__main__":
    main()
