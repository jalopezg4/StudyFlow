import { expect, test } from "@playwright/test";
import { gotoForm, registerAndLandOnDashboard, uniqueEmail } from "./helpers";

const PASSWORD = "TestPass123";

async function expectIndependentFieldErrorClearing(
  page: import("@playwright/test").Page,
  path: "/login" | "/register",
) {
  await gotoForm(page, path);
  await page
    .getByRole("button", { name: path === "/login" ? "Log in" : "Register" })
    .click();

  const fieldErrors = page.locator("p.text-red-600");
  await expect(fieldErrors).toHaveCount(2);

  await page.getByLabel("Email").fill("student@example.com");
  await expect(fieldErrors).toHaveCount(1);

  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await expect(fieldErrors).toHaveCount(0);
}

test.describe("Form feedback and page metadata polish", () => {
  test("shows live subject edit counters for initial and changed values (AC06)", async ({
    page,
  }) => {
    await registerAndLandOnDashboard(page);

    const subjectName = "Counter subject";
    const description = "Initial notes";
    const response = await page.request.post("/api/subjects", {
      data: { name: subjectName, description },
    });
    expect(response.ok()).toBeTruthy();

    await gotoForm(page, "/subjects");
    const subjectItem = page.getByRole("listitem").first();
    await expect(subjectItem).toBeVisible();
    await subjectItem.getByRole("button", { name: "Edit" }).click();

    await expect(
      subjectItem.getByText(`${subjectName.length}/100`, { exact: true }),
    ).toBeVisible();
    await expect(
      subjectItem.getByText(`${description.length}/500`, { exact: true }),
    ).toBeVisible();

    const nameInput = subjectItem.getByLabel("Name");
    const descriptionInput = subjectItem.getByLabel("Description (optional)");
    await nameInput.fill("Updated");
    await descriptionInput.fill("Changed");

    await expect(subjectItem.getByText("7/100", { exact: true })).toBeVisible();
    await expect(subjectItem.getByText("7/500", { exact: true })).toBeVisible();
  });

  test("clears only the edited validation field on registration (AC07)", async ({
    page,
  }) => {
    await expectIndependentFieldErrorClearing(page, "/register");
  });

  test("clears only the edited validation field on login (AC07)", async ({
    page,
  }) => {
    await expectIndependentFieldErrorClearing(page, "/login");
  });

  test("uses StudyFlow as the document title (AC08)", async ({ page }) => {
    await gotoForm(page, "/login");
    await expect(page).toHaveTitle("StudyFlow");
  });

  test("keeps form-level authentication feedback separate from field errors (AC07)", async ({
    page,
  }) => {
    const email = uniqueEmail();
    await registerAndLandOnDashboard(page, email);

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await gotoForm(page, "/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("WrongPassword999");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    await page.getByLabel("Email").fill(`${email}.updated`);
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  });
});
