import chromedriver from 'chromedriver';
import { Builder, WebDriver, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { CommonSteps, CommonData } from './common';

// npm test -- test_UI/municipality_usage.test.ts

const demoWaitDefault = !process.env.CI;
jest.setTimeout(demoWaitDefault ? 250000 : 60000);

describe('Municipality usages: ', () => {
  let driver: WebDriver;
  let steps: CommonSteps;

  let demoWait = demoWaitDefault;

  beforeAll(async () => {
    const options = new chrome.Options();
        
    options.addArguments(
      '--disable-password-manager-reauthentication',
      '--disable-save-password-bubble',
      '--disable-notifications',
      '--start-maximized'
    );

    if (!demoWait) {
      options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage');
    }

    const service = new chrome.ServiceBuilder(chromedriver.path);

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(service)
      .build();

      steps = new CommonSteps(driver, demoWait);

  }, 120000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  
  test('Accept report', async () => {
    await steps.login(CommonData.USER_MUNICIPAL_PUBLIC_RELATIONS_OFFICER);
    await steps.assertExists(By.id("report-table"));
    const noDataPresent = await steps.driver.findElements(By.id("no-data-in-table"));
    expect(noDataPresent.length).toBe(0);

    const firstRow = By.css("#report-table tbody tr:first-child");
    await steps.custumClick(firstRow);

    await steps.custumClick(By.id("acceptAssignAction"));
    await steps.scrollToElementGlobal(By.id("submmitChoice"));

    const select = By.id("technician-select");
    const selectEl = await steps.driver.findElement(select);
    const options = await selectEl.findElements(By.tagName("option"));
    const firstValue = await options[0].getAttribute("value");
    await steps.selectDropdownByValue(select, firstValue);

    await steps.custumClick(By.id("submmitChoice"));
  
    await steps.assertExists(By.id('toast_message_success'));
    await steps.demoSleep();
    await steps.scrollToTop();
    await steps.custumClick(By.id("gotoDashboardBtn"));
    
    await steps.demoSleep();
    await steps.selectDropdownByValue(By.id("status-filter"), "all");
    await steps.demoSleep();
    await steps.demoSleep();
    await steps.custumClick(By.id("logoutBtn"));
    await steps.demoSleep();
  }, 60000);
      

  test('Reject report', async () => {
    await steps.login(CommonData.USER_MUNICIPAL_PUBLIC_RELATIONS_OFFICER);
    await steps.assertExists(By.id("report-table"));
    
    const noData = await steps.driver.findElements(By.id("no-data-in-table"));
    expect(noData.length).toBe(0);
    await steps.custumClick(By.css("#report-table tbody tr:first-child"));

    await steps.demoSleep();
    await steps.custumClick(By.id("rejectAction"));
    await steps.scrollToElementGlobal(By.id("submmitChoice"));

    await steps.custumSendKeys(By.id("rejectReasonInput"), "Issue already reported, maintenance in progress");
    await steps.custumClick(By.id("submmitChoice"));
    await steps.scrollToTop();
    await steps.custumClick(By.id("gotoDashboardBtn"));

    await steps.demoSleep();
    await steps.selectDropdownByValue(By.id("status-filter"), "all");

    await steps.demoSleep();
    await steps.custumClick(By.id("logoutBtn"));
    await steps.demoSleep();
  }, 60000);


  test('Assign report to mainteiners', async () => {
    await steps.login(CommonData.USER_MUNICIPAL_INFRASTRUCTURE_TECHNICIAN);
    await steps.assertExists(By.id("report-table"));
    
    const noData = await steps.driver.findElements(By.id("no-data-in-table"));
    expect(noData.length).toBe(0);
    await steps.custumClick(By.css("#report-table tbody tr:first-child"));

    await steps.demoSleep();
    await steps.custumClick(By.id("assignMaintainerAction"));
    await steps.demoSleep();

    await steps.scrollToElementGlobal(By.id("assignMaintainer"));

    const select = By.id("maintainer-dropdown");
    const selectEl = await steps.driver.findElement(select);
    const options = await selectEl.findElements(By.tagName("option"));
    const firstValue = await options[0].getAttribute("value");
    await steps.selectDropdownByValue(select, firstValue);
    await steps.demoSleep();
    
    await steps.custumClick(By.id("assignMaintainer"));
    await steps.assertExists(By.id('toast_message_success'));
    await steps.scrollToTop();
    await steps.custumClick(By.id("gotoDashboardBtn"));

    await steps.demoSleep();
    await steps.selectDropdownByValue(By.id("status-filter"), "all");

    await steps.demoSleep();
    await steps.custumClick(By.id("logoutBtn"));
    await steps.demoSleep();
    
  }, 60000);


  test('Add comment to report', async () => {
    await steps.login(CommonData.USER_MUNICIPAL_INFRASTRUCTURE_TECHNICIAN);
    await steps.assertExists(By.id("report-table"));
    
    const noData = await steps.driver.findElements(By.id("no-data-in-table"));
    expect(noData.length).toBe(0);
    await steps.custumClick(By.css("#report-table tbody tr:first-child"));

    await steps.demoSleep();
    await steps.custumClick(By.id("toggleComments"));
    await steps.demoSleep();

    
    await steps.custumSendKeys(By.id("newCommentInput"), "Urgent fix");
    await steps.demoSleep();

    await steps.custumClick(By.id("newCommentSave"));
    await steps.demoSleep();
    
    await steps.assertExists(By.id('toast_message_success'));
    
    await steps.demoSleep();
    await steps.custumClick(By.id("logoutBtn"));
    await steps.demoSleep();
    
  }, 60000);


  test('Mainteiners update status report', async () => {
    await steps.login(CommonData.USER_MUNICIPAL_ROADS_MAINTAINER);
    await steps.assertExists(By.id("report-table"));
    
    const noData = await steps.driver.findElements(By.id("no-data-in-table"));
    expect(noData.length).toBe(0);
    await steps.custumClick(By.css("#report-table tbody tr:first-child"));

    await steps.custumClick(By.id("markResolved"));
    await steps.demoSleep();
    await steps.custumClick(By.id("logoutBtn"));
    await steps.demoSleep();
    
  }, 60000);

});
