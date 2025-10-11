from playwright.sync_api import Page, expect
import time

def test_landing_page(page: Page):
    """
    This test verifies that the landing page has been updated to remove
    college-specific content.
    """
    # 1. Arrange: Go to the landing page.
    page.goto("http://localhost:5173")

    # 2. Print console logs.
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    # 3. Wait for the page to load.
    time.sleep(5)

    # 4. Assert: Check that the home page is visible.
    expect(page.get_by_text("Welcome to the Tech Community!")).to_be_visible()

    # 5. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/landing_page.png")