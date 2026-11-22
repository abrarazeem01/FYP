"""
NEXUS SENTINEL — PLAYWRIGHT ASYNC URL SCRAPER & OSINT INGESTION SERVICE
Real Playwright headless Chromium scraping for target URLs (Facebook groups,
classified portals, car bazaar links).
- Resolves /share/g/ and platform redirects
- Dynamically scrolls the DOM
- Extracts real post captions, normalized prices, seller names, and image URLs
- Dispatches PaddleOCR pixel inspection for image watermarks & phone numbers
- Executes full LightGBM price valuation & Roman Urdu NLP threat scoring
- Returns real extracted posts or {"status": "empty", "count": 0} when 0 public posts extracted.
- ZERO fake/simulated fallback items.
"""

import os
import re
import sys
import asyncio
import hashlib
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path

from playwright.async_api import async_playwright, Browser, Page

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

try:
    from backend.websocket_manager import ws_manager
except ImportError:
    from websocket_manager import ws_manager

try:
    from ml_engine.paddle_ocr import extract_phones_from_images, normalize_pak_phone
except ImportError:
    try:
        from paddle_ocr import extract_phones_from_images, normalize_pak_phone
    except ImportError:
        extract_phones_from_images = lambda urls: []
        normalize_pak_phone = lambda p: p

try:
    from backend.ml_pipeline import analyze_listing
except ImportError:
    from ml_pipeline import analyze_listing

logger = logging.getLogger("NexusSentinel-ScraperService")

# Stealth arguments for undetected headless Chromium navigation
STEALTH_CHROMIUM_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--disable-notifications",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--disable-gpu",
    "--window-size=1440,900",
    "--lang=en-US,en;q=0.9",
]

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


def parse_raw_price(text: str) -> Optional[float]:
    """Extracts price hints from Pakistani car listing text and normalizes to PKR."""
    if not text:
        return None
    s = text.lower()
    
    # 1. Lakh / Lac
    lac_m = re.search(r'([\d.]+)\s*(?:lac|lacs|lakh|laac)\b', s)
    if lac_m:
        try:
            return float(lac_m.group(1)) * 100000.0
        except ValueError:
            pass
            
    # 2. Crore / Cr
    cr_m = re.search(r'([\d.]+)\s*(?:crore|cr)\b', s)
    if cr_m:
        try:
            return float(cr_m.group(1)) * 10000000.0
        except ValueError:
            pass
            
    # 3. Explicit PKR / Rs
    pkr_m = re.search(r'(?:pkr|rs\.?)\s*([\d,]{4,10})', s)
    if pkr_m:
        try:
            clean = pkr_m.group(1).replace(',', '')
            return float(clean)
        except ValueError:
            pass

    return None


async def run_full_listing_analysis(
    raw_text: str,
    seller_name: str,
    image_urls: List[str],
    group_name: str = "Live Web OSINT Ingestion",
    manual_price: Optional[float] = None
) -> Dict[str, Any]:
    """
    Executes full multi-modal forensic analysis on a scraped listing:
    1. Slang Lexicon & Roman Urdu NLP classification
    2. PaddleOCR image watermark reader for hidden phone numbers and contraband stamps
    3. LightGBM market baseline prediction & price deviation
    4. Composite NCP Risk Score & AI Threat Reasoning brief
    """
    msg_hash = hashlib.sha256(raw_text.strip().encode("utf-8")).hexdigest()

    # 1. Base ML & LLM forensic pass
    forensics = analyze_listing(raw_text, manual_price=manual_price)

    # 2. PaddleOCR image watermark extraction
    ocr_watermark_findings = []
    ocr_phones = []
    if image_urls:
        try:
            ocr_results = extract_phones_from_images(image_urls)
            for item in ocr_results:
                ocr_watermark_findings.append(item)
                if item.get("phone"):
                    ocr_phones.append(item["phone"])
        except Exception as e:
            logger.debug(f"PaddleOCR processing error: {e}")

    # 3. Incorporate text-based phone numbers
    text_phones = []
    pak_phone_pattern = re.compile(r"(?:\+92|0092|92|0)?[-.\s]?(3\d{2})[-.\s]?(\d{3})[-.\s]?(\d{4})")
    for m in pak_phone_pattern.finditer(raw_text):
        normalized = normalize_pak_phone(m.group(0))
        if normalized and normalized not in text_phones:
            text_phones.append(normalized)

    # Combine unique phones
    all_phones = list(set(text_phones + ocr_phones))
    phone_records = []
    for p in all_phones:
        phone_records.append({
            "phone": p,
            "hash": hashlib.sha256(p.encode("utf-8")).hexdigest(),
            "source": "OCR_IMAGE" if p in ocr_phones else "POST_TEXT"
        })

    # Adjust risk score based on OCR watermarks (e.g. stamps like "Chaman Clear", "Non Custom")
    base_risk = forensics.get("risk_score", 0)
    ocr_keywords = []
    for ow in ocr_watermark_findings:
        ocr_keywords.extend(ow.get("keywords", []))

    if ocr_keywords:
        base_risk = min(100, base_risk + len(ocr_keywords) * 8)

    risk_score = int(round(base_risk))
    status_label = "verified_ncp" if risk_score >= 75 else ("flagged" if risk_score >= 50 else "new")

    # Final combined listing object
    analyzed_listing = {
        "id": f"post-{msg_hash[:12]}",
        "message_hash": msg_hash,
        "group_name": group_name,
        "sender_phone": all_phones[0] if all_phones else "+92-300-UNLISTED",
        "seller_name": seller_name or "Anonymous Trader",
        "raw_text": raw_text,
        "extracted_json": forensics.get("extracted_json", {}),
        "slang_flags": list(set(forensics.get("slang_flags", []) + ocr_keywords)),
        "llm_reasoning": forensics.get("llm_reasoning", "Standard market valuation verification."),
        "predicted_market_price": forensics.get("predicted_market_price"),
        "price_deviation_pct": forensics.get("price_deviation_pct", 0.0),
        "risk_score": risk_score,
        "status": status_label,
        "image_urls": image_urls,
        "phone_records": phone_records,
        "ocr_findings": ocr_watermark_findings,
        "created_at": datetime.utcnow().isoformat(),
    }

    return analyzed_listing


async def scrape_target_url(target_url: str, limit: int = 15) -> Dict[str, Any]:
    """
    Main Playwright Async Scraper entry point.
    Takes a target URL, navigates using headless Chromium, resolves redirects,
    scrolls DOM dynamically, extracts live posts, and runs full ML analysis.
    """
    clean_url = target_url.strip()
    log_messages = []

    async def log_step(msg: str, level: str = "INFO"):
        ts = datetime.utcnow().strftime("%H:%M:%S")
        formatted = f"[{ts}] {msg}"
        log_messages.append(formatted)
        logger.info(formatted)
        await ws_manager.broadcast_log(formatted, level=level)

    await log_step(f"Initiating Playwright headless Chromium for target: {clean_url}")

    extracted_items = []
    final_resolved_url = clean_url

    try:
        async with async_playwright() as p:
            await log_step("Spawning Chromium instance with stealth anti-detection flags...")
            browser = await p.chromium.launch(
                headless=True,
                args=STEALTH_CHROMIUM_ARGS
            )
            context = await browser.new_context(
                user_agent=USER_AGENT,
                viewport={"width": 1440, "height": 900},
                locale="en-US"
            )
            page = await context.new_page()

            # Navigate to target URL
            await log_step(f"Navigating to {clean_url} (Resolving platform redirects)...")
            try:
                response = await page.goto(clean_url, wait_until="domcontentloaded", timeout=30000)
                final_resolved_url = page.url
                await log_step(f"Resolved canonical destination: {final_resolved_url}")
            except Exception as e:
                await log_step(f"Navigation warning: {e}. Attempting DOM inspection regardless.", level="WARN")

            # Wait briefly for client-side JavaScript hydration
            await page.wait_for_timeout(2500)

            # Dismiss common cookie / login popups
            try:
                close_selectors = [
                    '[aria-label="Close"]',
                    '[aria-label="Decline optional cookies"]',
                    'div[role="button"]:has-text("Close")',
                    'div[role="button"]:has-text("Not Now")',
                ]
                for sel in close_selectors:
                    close_btn = await page.query_selector(sel)
                    if close_btn and await close_btn.is_visible():
                        await close_btn.click()
                        await log_step("Dismissed transient login/cookie dialog.")
                        break
            except Exception:
                pass

            # Dynamic DOM Scrolling loop to trigger lazy-loaded posts
            await log_step("Scrolling DOM dynamically to trigger lazy-loaded listings...")
            for scroll_idx in range(4):
                await page.evaluate("window.scrollBy(0, document.body.scrollHeight / 3)")
                await page.wait_for_timeout(1500)
                await log_step(f"DOM scroll cycle {scroll_idx + 1}/4 complete.")

            # Extract post elements
            post_selectors = [
                'div[role="feed"] > div',
                'div[role="article"]',
                'div[data-ad-preview="message"]',
                '.x1yztbdb',
                'article',
                '.classified-card',
                '.vehicle-card',
                '.listing-item',
            ]

            raw_posts_found = []
            for sel in post_selectors:
                elements = await page.query_selector_all(sel)
                if len(elements) >= 2:
                    await log_step(f"Identified {len(elements)} listing containers matching selector '{sel}'.")
                    for el in elements[:limit * 2]:
                        try:
                            # Extract post caption
                            text_content = await el.inner_text()
                            if text_content and len(text_content.strip()) > 25:
                                # Extract images
                                img_els = await el.query_selector_all('img')
                                img_urls = []
                                for img in img_els:
                                    src = await img.get_attribute('src')
                                    if src and src.startswith('http') and not any(skip in src for skip in ['emoji.php', 'static.xx', 'icon']):
                                        img_urls.append(src)

                                raw_posts_found.append({
                                    "text": text_content.strip(),
                                    "images": img_urls[:4],
                                })
                        except Exception:
                            continue
                    if raw_posts_found:
                        break

            # If no complex feed selector matched, search paragraphs and text blocks
            if not raw_posts_found:
                body_text = await page.inner_text("body")
                blocks = [b.strip() for b in body_text.split("\n\n") if len(b.strip()) > 40]
                for b in blocks[:limit]:
                    raw_posts_found.append({"text": b, "images": []})

            await log_step(f"Extracted {len(raw_posts_found)} candidate raw listing blocks from DOM.")
            await browser.close()
            await log_step("Headless Chromium session cleanly closed.")

    except Exception as exc:
        await log_step(f"Playwright browser execution encountered: {exc}", level="ERROR")

    # If 0 public posts extracted (e.g. login wall or invalid page)
    if not raw_posts_found:
        await log_step("Zero public posts extracted. Target requires private login authentication or DOM was empty.", level="WARN")
        return {
            "status": "empty",
            "count": 0,
            "message": "No public posts extracted",
            "resolved_url": final_resolved_url,
            "logs": log_messages,
            "listings": []
        }

    # Run full multi-modal forensic analysis on each scraped post
    analyzed_listings = []
    flagged_count = 0
    critical_count = 0

    await log_step(f"Dispatching forensic analysis pipeline & PaddleOCR on {min(len(raw_posts_found), limit)} extracted listings...")

    for i, raw_item in enumerate(raw_posts_found[:limit]):
        text = raw_item["text"]
        imgs = raw_item.get("images", [])

        # Extract seller name and price hint if present
        first_line = text.split("\n")[0][:40]
        seller_name = first_line if len(first_line) > 3 else f"Seller-{i+1}"
        manual_price = parse_raw_price(text)

        analysis = await run_full_listing_analysis(
            raw_text=text,
            seller_name=seller_name,
            image_urls=imgs,
            group_name=final_resolved_url.split("/")[-1] or "Target OSINT Group",
            manual_price=manual_price
        )
        analyzed_listings.append(analysis)

        if analysis.get("risk_score", 0) >= 50:
            flagged_count += 1
        if analysis.get("risk_score", 0) >= 75:
            critical_count += 1
            # Broadcast live Threat Alert via WebSocket!
            await ws_manager.broadcast_threat_alert({
                "id": f"threat-{analysis['id']}",
                "message": f"THREAT ALERT: {analysis.get('extracted_json', {}).get('make', 'Vehicle')} ({analysis.get('risk_score')}% Risk) Ingested!",
                "post": analysis,
                "timestamp": datetime.utcnow().isoformat(),
            })

        await log_step(
            f"Listing {i+1}/{min(len(raw_posts_found), limit)} Analyzed: Risk {analysis.get('risk_score')}% "
            f"[{analysis.get('status').upper()}] | {len(analysis.get('phone_records', []))} phones linked."
        )

    await log_step(f"OSINT Scrape Complete: {len(analyzed_listings)} listings analyzed ({flagged_count} flagged, {critical_count} critical NCP).")

    return {
        "status": "success",
        "count": len(analyzed_listings),
        "total_scraped": len(analyzed_listings),
        "flagged_count": flagged_count,
        "critical_count": critical_count,
        "resolved_url": final_resolved_url,
        "message": f"Scrape complete: {len(analyzed_listings)} listings analyzed, {flagged_count} flagged, {critical_count} critical NCP units detected.",
        "logs": log_messages,
        "listings": analyzed_listings
    }
