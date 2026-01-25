import { test as base } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Extend base test with custom fixtures
interface CustomFixtures {
  makeAxeBuilder: () => AxeBuilder;
}

export const test = base.extend<CustomFixtures>({
  makeAxeBuilder: async ({ page }, use) => {
    const createAxeBuilder = () => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(createAxeBuilder);
  },
});

export { expect } from "@playwright/test";
