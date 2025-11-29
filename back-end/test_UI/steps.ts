import { WebDriver, until, By, error, WebElement  } from 'selenium-webdriver';

export class CommonSteps {
  driver: WebDriver;
  demoWait: boolean;

  constructor(driver: WebDriver, demoWait = false) {
    this.driver = driver;
    this.demoWait = demoWait;
  }

  async demoSleep(ms = 2000) {
    if (this.demoWait) {
      await this.driver.sleep(ms);
    }
  }

  async custumClick(element: any) {
    const tag = await this.driver.wait(
      until.elementLocated(element),
      10000,
      `Element not found: ${element.toString()} found, could not click`
    );
    
    await this.demoSleep(500);
    if (this.demoWait) {
      await this.driver.actions().move({ origin: tag }).perform();
    }
    await this.demoSleep(1000);
    await tag.click();
    await this.demoSleep(500);
  }

  async custumSendKeys(element: any, text: string) {
    const tag = await this.driver.wait(
      until.elementLocated(element),
      5000,
      `Element not found: ${element.toString()} found, could not type`
    );
    
    await tag.click();
    await this.demoSleep(500);
    await tag.sendKeys(text);
    await this.demoSleep(200);
  }

  async selectDropdownByValue(selectElement: any, value: string) {
    const select = await this.driver.wait(
      until.elementLocated(selectElement),
      5000,
      `Dropdown not found: ${selectElement.toString()}`
    ) as WebElement;

    const options = await select.findElements(By.tagName('option'));
    for (const option of options) {
      const optionValue = await option.getAttribute('value');
      if (optionValue === value) {
        await option.click();
        await this.demoSleep(200);
        break;
      }
    }
  }
  
  async assertExists(element: any) {
    await this.driver.wait(
      until.elementLocated(element),
      10000,
      `Element not found: ${element.toString()}`
    );

    // Now wait until the element is actually visible
    await this.driver.wait(async () => {
      try {
        const freshElement = await this.driver.findElement(element);
        return await freshElement.isDisplayed();
      } catch {
        return false; // Handles stale element by retrying
      }
    }, 10000);

    // Final assertion
    const finalElement = await this.driver.findElement(element);
    const isDisplayed = await finalElement.isDisplayed();
    expect(isDisplayed).toBe(true);
  }

  async clickRandomInMiddle() {
    const size = await this.driver.executeScript<{ width: number; height: number }>(() => {
      return { width: window.innerWidth, height: window.innerHeight };
    });

    const { width, height } = size!; // non-null assertion

    const actions = this.driver.actions({ bridge: true });
    const x = Math.floor(width / 2 + (Math.random() * 20 - 10)); // +/- 10px jitter
    const y = Math.floor(height / 2 + (Math.random() * 20 - 10));

    await this.demoSleep();
    await actions.move({ x, y }).click().perform();
    await this.demoSleep();
  }

  async uploadPhotos(element: any, filePaths: string[]) {
    // Selenium requires absolute paths
    const absolutePaths = filePaths.map(p => require("path").resolve(p));

    const fileInput = await this.driver.wait(
      until.elementLocated(element),
      5000,
      `File input not found: ${element.toString()}`
    );

    await this.demoSleep(500);
    await fileInput.sendKeys(absolutePaths.join('\n'));
    await this.demoSleep(500);
  }

  
  async login(user: { username: string; password: string; type: string }) {
    // Navigate to homepage
    await this.driver.get('http://localhost:5173');

    // Click main Sign In / Sign Up link
    await this.custumClick(By.id('SignIn_SignUp'));

    // Select citizen login if needed
    if (user.type === 'citizen') {
      await this.custumClick(By.id('SignIn_citizen'));
    } else {
      await this.custumClick(By.id('SignIn_admin'));
    }

    // Fill username and password
    await this.custumSendKeys(
      By.id('InputUsername'),
      user.username
    );
    await this.custumSendKeys(
      By.id('InputPassword'),
      user.password
    );

    // Click sign-in button
    await this.custumClick(By.id('loginBtnSubmit'));
  }

}
