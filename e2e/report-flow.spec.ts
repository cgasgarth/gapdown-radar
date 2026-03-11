import { expect, test } from "@playwright/test";

test("renders the local report workflow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Find the break/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Breakbook" })).toBeVisible();

  await page.getByLabel("Seed ticker").fill("TQHC");
  await page.getByRole("button", { name: "Refresh Reports" }).click();

  await expect(page.getByText("Seed TQHC")).toBeVisible();
  await expect(page.locator(".list-card").first()).toBeVisible();

  await page.locator(".list-card").first().click();

  await expect(page.locator(".detail h2")).toContainText(/drives the|break/i);
  await expect(
    page.getByRole("heading", { name: /Relative short setup|Monitor for renewed downside/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Structured stress view" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Near-term triggers" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Broken versus watched names" })).toBeVisible();
  await page.getByRole("tab", { name: "Research" }).click();
  await expect(page.getByRole("heading", { name: "Sequence of the break" })).toBeVisible();
  await page.getByRole("tab", { name: "Evidence" }).click();
  await expect(page.getByRole("heading", { name: "Citations" })).toBeVisible();
  await expect(page.getByText(/Local fixture source|Open source document/i).first()).toBeVisible();

  await page.getByLabel("Name").fill("Fixture credit basket");
  await page.getByLabel("Tickers").fill("TQHC,CLYN,FLXN,NCHL");
  await page.getByRole("button", { name: "Save Universe" }).click();

  await expect(
    page.locator(".universe-card").filter({ hasText: "Fixture credit basket" }).first(),
  ).toBeVisible();
  await expect(page.getByLabel("Active universe")).toHaveValue(/.+/);
});
