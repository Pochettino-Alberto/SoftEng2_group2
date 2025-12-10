import chromedriver from 'chromedriver';
import { Builder, WebDriver, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { CommonSteps, CommonData } from './common';

// npm test -- test_UI/citizen_usage.test.ts


const demoWaitDefault = !process.env.CI;
jest.setTimeout(demoWaitDefault ? 180000 : 60000);

describe('Citizen usages: ', () => {
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
    await steps.custumClick(By.id("logoutBtn"));
    if (driver) await driver.quit();
  });

  
  test('Register citizen', async () => {
    const user = {
      username: "angryCitizen_"+String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
      firstName: "Mario",
      lastName: "Rossi",
      email: "Mario.Rossi@email.it",
      password: "SE2_group2_password!"
    };

    driver.get(CommonData.BASE_URL_FE+"/auth/register");
    await steps.custumSendKeys(
      By.id('InputUsername'),
      user.username
    );
    await steps.custumSendKeys(
      By.id('InputFirstName'),
      user.firstName
    );
    await steps.custumSendKeys(
      By.id('InputLastName'),
      user.lastName
    );
    await steps.custumSendKeys(
      By.id('InputEmail'),
      user.email
    );
    
    await steps.custumSendKeys(
      By.id('InputPassword'),
      user.password
    );
    
    await steps.custumSendKeys(
      By.id('InputPasswordConfirm'),
      user.password
    );

    // Click sign-in button
    await steps.custumClick(By.id('registerBtnSubmit'));

    await steps.demoSleep()
    
  }, 60000);


  test('Citizen usage submitting report', async () => {
    await steps.login(CommonData.USER_CITIZEN, false);

    await steps.custumClick(By.id('createNewReportBtn'))
    
    await steps.scrollBySteps(By.id('mapReport'), [30, -50]);
    if(demoWait){
      await steps.custumClick(By.css('.leaflet-control-zoom-out'));
      await steps.custumClick(By.css('.leaflet-control-zoom-in'));
      await steps.custumClick(By.css('.leaflet-control-zoom-in'));
      const maxMoveRand = 500;
      const deltaX = Math.floor(Math.random() * (maxMoveRand *2 + 1)) - maxMoveRand;
      const deltaY = Math.floor(Math.random() * (maxMoveRand *2 + 1)) - maxMoveRand;
      await steps.moveMap(By.id('mapReport'), deltaX, deltaY)
    }
    await steps.clickRandomInMiddle();
    await steps.selectDropdownByValue(By.id('reportType'), '3');
    await steps.custumSendKeys(By.id('title'), 'Sewer Issue in Downtown');
    await steps.custumSendKeys(By.id('description'), 'Sewer leacking in Downtown');
  
    await steps.scrollToElement(By.id('scrollableFormSubmitReport'), By.id('submitReportBtn'))
    
    await steps.uploadPhotos(
      By.css('input[type="file"][name="photos"]'),
      [CommonData.getImg("gas_leak.jpg"),]
    );

    await steps.scrollToElement(By.id('scrollableFormSubmitReport'), By.id('submitReportBtn'))
    await steps.custumClick(By.id('submitReportBtn'));
    
    await steps.assertExists(By.id('toast_message_success'));
    
    await steps.demoSleep()
  }, 60000);


});
