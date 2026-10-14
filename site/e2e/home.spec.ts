import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("hero CTAs link to the résumé and an email", async ({ page }) => {
  const ctas = page.locator(".hero__actions a");
  await expect(ctas).toHaveCount(3);
  await expect(ctas.nth(0)).toHaveAttribute("href", /^mailto:/);
  await expect(ctas.nth(1)).toHaveAttribute("href", "/resume/");
  await expect(ctas.nth(2)).toHaveAttribute("href", "/tech-stack/");
});

test("every focus card has a non-empty heading", async ({ page }) => {
  const cards = page.locator(".card");
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(cards.nth(i).locator(".card__title")).not.toBeEmpty();
  }
});

test('"Elsewhere" list links to the résumé, tech-stack, blog, and external profiles', async ({
  page,
}) => {
  const hrefs = await page
    .locator(".link-row")
    .evaluateAll((els) => els.map((el) => el.getAttribute("href")));

  expect(hrefs).toContain("/resume/");
  expect(hrefs).toContain("/tech-stack/");
  expect(hrefs).toContain("/blog/");
  expect(hrefs.some((h) => h?.includes("github.com"))).toBe(true);
  expect(hrefs.some((h) => h?.includes("linkedin.com"))).toBe(true);
  expect(hrefs.some((h) => h?.startsWith("mailto:"))).toBe(true);
});

test('"Blog" section previews the latest post and links to the full directory', async ({
  page,
}) => {
  const preview = page.locator('a.post-card[href="/blog/system-1-ai/"]');
  await expect(preview).toBeVisible();
  await expect(preview.locator(".post-card__title")).not.toBeEmpty();

  const seeMore = page.getByRole("link", { name: "See more" });
  await expect(seeMore).toHaveAttribute("href", "/blog/");
});

test('"Built" section features the flagship repo and is linked from its focus card', async ({
  page,
}) => {
  const built = page.locator("section#built");
  await expect(built.getByRole("heading", { level: 2 })).toBeVisible();

  const repo = /^https:\/\/github\.com\/salishseawolf\/k3s-service-cluster(\/|$)/;
  const hrefs = await built
    .getByRole("link")
    .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(0);
  expect(hrefs.every((h) => repo.test(h ?? ""))).toBe(true);

  const cardLink = page.locator('.card__title a[href="#built"]');
  await expect(cardLink).toHaveCount(1);
  await cardLink.click();
  await expect(page).toHaveURL(/#built$/);
  await expect(built).toBeInViewport();
});
