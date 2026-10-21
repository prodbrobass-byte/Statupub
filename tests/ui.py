"""Test de l'interface : parcours annonceur, admin, diffuseur dans un vrai navigateur."""
import subprocess, time, sys, os
from playwright.sync_api import sync_playwright

WEB = os.path.join(os.path.dirname(__file__), "..", "web")
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/shots"
os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8765", "-d", WEB], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
errors = []

def login(page, email):
    page.goto("http://localhost:8765/#/connexion")
    page.fill("#f-email", email); page.fill("#f-pass", "TestPass!2026")
    page.click("#auth-btn")
    page.wait_for_selector(".page-head", timeout=20000)

def shot(page, name):
    page.wait_for_timeout(700)
    page.screenshot(path=f"{OUT}/{name}.png", full_page=True)

try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        for theme, vp in [("light", {"width": 1280, "height": 800}), ("dark", {"width": 390, "height": 844})]:
            ctx = b.new_context(viewport=vp, color_scheme=theme)
            page = ctx.new_page()
            page.on("console", lambda m: m.type == "error" and errors.append(m.text))
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto("http://localhost:8765/")
            page.wait_for_selector(".hero")
            shot(page, f"accueil-{theme}")
            overflow = page.evaluate("document.documentElement.scrollWidth > window.innerWidth")
            if overflow: errors.append(f"débordement horizontal accueil ({theme})")
            if theme == "light":
                login(page, "test.annonceur@example.com"); shot(page, "annonceur")
                page.click("#b-new"); page.wait_for_selector("#nc-form"); shot(page, "annonceur-nouvelle")
                page.fill("#nc-title", "Boubous Tabaski"); page.fill("#nc-msg", "🐑 -20 % sur tous les boubous chez Awa Mode !")
                page.fill("#nc-url", "https://example.com/awa"); page.fill("#nc-cpc", "40"); page.fill("#nc-budget", "4000")
                page.click("#nc-btn"); page.wait_for_selector(".toast"); page.wait_for_timeout(1500)
                page.click(".grid.g2 a.card"); page.wait_for_selector(".chart, .empty"); shot(page, "annonceur-campagne")
                page.click("#logout"); page.wait_for_selector(".hero")
                login(page, "test.admin@example.com"); shot(page, "admin")
                page.click("[data-ok]"); page.wait_for_selector(".toast"); page.wait_for_timeout(1500)
                page.click("[data-t=diffuseurs]"); page.wait_for_selector("table"); shot(page, "admin-diffuseurs")
                page.click("[data-t=clics]"); page.wait_for_selector("table"); page.wait_for_timeout(500); shot(page, "admin-clics")
                page.click("#logout"); page.wait_for_selector(".hero")
            else:
                login(page, "test.diffuseur2@example.com"); shot(page, "diffuseur-mobile-onboarding")
                if page.query_selector("#ob-save"):
                    page.check("#ob-joined"); page.fill("#ob-views", "450"); page.click("#ob-save"); page.wait_for_timeout(2500)
                btn = page.query_selector("[data-link]")
                if btn: btn.click(); page.wait_for_selector(".linkbox", timeout=15000)
                shot(page, "diffuseur-mobile")
                overflow = page.evaluate("document.documentElement.scrollWidth > window.innerWidth")
                if overflow: errors.append("débordement horizontal espace diffuseur (mobile)")
            ctx.close()
        b.close()
finally:
    srv.terminate()
print("ERREURS:", errors if errors else "aucune")
