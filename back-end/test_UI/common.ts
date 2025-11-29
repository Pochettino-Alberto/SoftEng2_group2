import { WebDriver, until, By, error, WebElement  } from 'selenium-webdriver';


export class CommonData {
  
  static readonly BASE_URL_FE = 'http://localhost:5173';
  
  static getImg(fileName: string): string {
    return "./test_UI/img/"+fileName;
  }

  static readonly USER_CITIZEN = {
    username: "demo_citizen",
    password: "YOOO_demo_!",
    type: "citizen"
  };

}



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

  async custumClick(element: By) {
    const tag = await this.driver.wait(
      until.elementLocated(element),
      10000,
      `Element not found: ${element.toString()}, could not click`
    );
    
    await this.demoSleep(500);
    if (this.demoWait) {
      await this.driver.actions().move({ origin: tag }).perform();
    }
    await this.demoSleep(750);
    await tag.click();
    await this.demoSleep(500);
  }

  async custumSendKeys(element: By, text: string) {
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

  async selectDropdownByValue(selectElement: By, value: string) {
    const select = await this.driver.wait(
      until.elementLocated(selectElement),
      5000,
      `Dropdown not found: ${selectElement.toString()}`
    ) as WebElement;

    await select.click();
    await this.demoSleep(350);

    const options = await select.findElements(By.tagName('option'));
    for (const option of options) {
      const optionValue = await option.getAttribute('value');
      if (optionValue === value) {
        if(this.demoWait)
          await this.driver.executeScript("arguments[0].scrollIntoView(true);", option);
        await this.demoSleep(150);
        await option.click();
        await this.demoSleep(200)
        break;
      }
    }
  }
  
  async assertExists(element: By, timeout: number = 10000) {
    const el = await this.driver.wait<WebElement>(async () => {
      try {
        const candidate = await this.driver.findElement(element);
        return (await candidate.isDisplayed()) ? candidate : false;
      } catch {
        return false; // Retry if not found or stale
      }
    }, timeout, `Element not found or not visible: ${element.toString()}`);

    // Final assertion
    expect(await el.isDisplayed()).toBe(true);
  }


  async clickRandomInMiddle() {
    const size = await this.driver.executeScript<{ width: number; height: number }>(() => {
      return { width: window.innerWidth, height: window.innerHeight };
    });

    const { width, height } = size!; // non-null assertion

    const actions = this.driver.actions({ bridge: true });
    const x = Math.floor(width / 2 + (Math.random() * 50 - 25)); // +/- 10px jitter
    const y = Math.floor(height / 2 + (Math.random() * 50 - 25));

    await this.demoSleep();
    await actions.move({ x, y }).click().perform();
    await this.demoSleep();
  }

  async uploadPhotos(element: By, filePaths: string[]) {
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

  async scrollBySteps(scrollableElement: By, steps: number[], msSleep: number = 100) {
    if (!this.demoWait) return;
    const scrollable = await this.driver.wait(
      until.elementLocated(scrollableElement),
      5000,
      `Scrollable element not found: ${scrollableElement.toString()}`
    ) as WebElement;

    for (const step of steps) {
      await this.driver.executeScript(`arguments[0].scrollBy(0, ${step});`, scrollable);
      await this.demoSleep(msSleep);
    }
  }

  async scrollToElement(scrollableElement: By, targetElement: By, msSleep: number = 200) {
    if (!this.demoWait) return;
    const scrollable = await this.driver.wait(
      until.elementLocated(scrollableElement),
      5000,
      `Scrollable element not found: ${scrollableElement.toString()}`
    ) as WebElement;

    const target = await this.driver.wait(
      until.elementLocated(targetElement),
      5000,
      `Target element not found: ${targetElement.toString()}`
    ) as WebElement;

    // Scroll the container so the target element is visible within it
    await this.driver.executeScript(`
      const container = arguments[0];
      const target = arguments[1];
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const offset = targetRect.top - containerRect.top - (containerRect.height / 2) + (targetRect.height / 2);
      container.scrollBy({ top: offset, behavior: 'smooth' });
    `, scrollable, target);

    await this.demoSleep(msSleep);
  }
    
  async moveMap(
    movableElement: By,
    deltaX: number,
    deltaY: number,
    steps: number = 50,
    delay: number = 8
  ) {
    const el = await this.driver.wait(
      until.elementLocated(movableElement),
      5000,
      `Element ${movableElement} not found`
    );

    const stepX = deltaX / steps;
    const stepY = deltaY / steps;

    await this.driver.executeScript(`
      const element = arguments[0];
      const steps = arguments[1];
      const stepX = arguments[2];
      const stepY = arguments[3];
      const delay = arguments[4];

      function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

      async function simulateDrag() {
        const rect = element.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        const evtInit = { bubbles: true, cancelable: true, view: window };

        element.dispatchEvent(new MouseEvent('mousedown', {
          ...evtInit, clientX: startX, clientY: startY
        }));

        let x = startX;
        let y = startY;

        for (let i = 0; i < steps; i++) {
          x += stepX;
          y += stepY;

          element.dispatchEvent(new MouseEvent('mousemove', {
            ...evtInit, clientX: x, clientY: y
          }));

          await sleep(delay); // smooth movement
        }

        element.dispatchEvent(new MouseEvent('mouseup', {
          ...evtInit, clientX: x, clientY: y
        }));
      }

      return simulateDrag();
    `, el, steps, stepX, stepY, delay);
  }

  
  async login(user: { username: string; password: string; type: string }, is_fast=false) {

    if(is_fast && this.demoWait){
      if (user.type === 'citizen') {
        await this.driver.get(CommonData.BASE_URL_FE+"/auth/login/citizen");
      } else {
        await this.driver.get(CommonData.BASE_URL_FE+"/auth/login/admin");
      }
    } else {
      // Navigate to homepage

      await this.driver.get(CommonData.BASE_URL_FE);

      const homePageElementLocator = By.id('homePage')

      const parent = await this.driver.wait(
        until.elementLocated(homePageElementLocator),
        5000,
        `Parent element not found: ${homePageElementLocator.toString()}`
      ) as WebElement;
      const sections = await parent.findElements(By.css(':scope > section'));
      
      for (const section of sections) {
        await this.driver.executeScript(
          `arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });`,
          section
        );
        await this.demoSleep(300);
      }
      
      // Click main Sign In / Sign Up link
      await this.custumClick(By.id('SignIn_SignUp'));

      // Select citizen login if needed
      if (user.type === 'citizen') {
        await this.custumClick(By.id('SignIn_citizen'));
      } else {
        await this.custumClick(By.id('SignIn_admin'));
      }
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

