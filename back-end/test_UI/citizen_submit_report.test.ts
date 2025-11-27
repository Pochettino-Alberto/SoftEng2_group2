import chromedriver from 'chromedriver';
import { Builder, WebDriver, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { CommonSteps } from './steps';

jest.setTimeout(180000); // 3 minutes for the entire test file

describe('Citizen usage', () => {
  let driver: WebDriver;
  let steps: CommonSteps;

  const demoWaitEnabled = true;
  beforeAll(async () => {
    const options = new chrome.Options();
        
    options.addArguments(
      '--disable-password-manager-reauthentication',
      '--disable-save-password-bubble',
      '--disable-notifications',
      '--start-maximized'
    );
    if (process.env.CI) {
      options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage');
    }

    const service = new chrome.ServiceBuilder(chromedriver.path);

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(service)
      .build();

        steps = new CommonSteps(driver, demoWaitEnabled);
    }, 120000); // 2 minutes timeout

    afterAll(async () => {
        if (driver) await driver.quit();
    });

  test('Citizen usage submitting report', async () => {
    const user = { username: "demo_citizen", password: "YOOO_demo_!", type: "citizen" }
    await steps.login(user);

    await steps.custumClick(By.xpath('//button[text()="Create Your First Report"]'))
    await steps.clickRandomInMiddle();
    await steps.selectDropdownByValue(By.id('reportType'), '3');
    await steps.custumSendKeys(By.id('title'), 'Sewer Issue in Downtown');
    await steps.custumClick(By.xpath('//button[text()="Create Report"]'));
    
    await steps.assertExists(By.xpath('//div[text()="Report sent successfully!"]'));
    
    await steps.demoSleep()
  }, 30000);
});
