import chromedriver from 'chromedriver'
import { Builder, WebDriver, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import { CommonSteps, CommonData } from './common'

const demoWaitDefault = !process.env.CI
jest.setTimeout(demoWaitDefault ? 250000 : 90000)

describe('Citizen usages: ', () => {
  let driver: WebDriver
  let steps: CommonSteps
  let demoWait = demoWaitDefault

  beforeAll(async () => {
    const options = new chrome.Options()

    options.addArguments(
        '--disable-password-manager-reauthentication',
        '--disable-save-password-bubble',
        '--disable-notifications',
        '--start-maximized'
    )

    if (!demoWait) {
      options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage')
    }

    const service = new chrome.ServiceBuilder(chromedriver.path)

    driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .setChromeService(service)
        .build()

    steps = new CommonSteps(driver, demoWait)
  }, 120000)

  afterAll(async () => {
    if (driver) await driver.quit()
  })

  test('Register citizen', async () => {
    const user = {
      username: 'angryCitizen_' + Math.floor(Math.random() * 100000),
      firstName: 'Mario',
      lastName: 'Rossi',
      email: 'Mario.Rossi@email.it',
      password: 'SE2_group2_password!'
    }

    await driver.get(CommonData.BASE_URL_FE + '/auth/register')

    await steps.custumSendKeys(By.id('InputUsername'), user.username)
    await steps.custumSendKeys(By.id('InputFirstName'), user.firstName)
    await steps.custumSendKeys(By.id('InputLastName'), user.lastName)
    await steps.custumSendKeys(By.id('InputEmail'), user.email)
    await steps.custumSendKeys(By.id('InputPassword'), user.password)
    await steps.custumSendKeys(By.id('InputPasswordConfirm'), user.password)

    await steps.custumClick(By.id('registerBtnSubmit'))

    await driver.wait(
        until.elementLocated(By.id('logoutBtn')),
        15000
    )

    await steps.custumClick(By.id('logoutBtn'))

    await driver.wait(
        until.elementLocated(By.id('SignIn_SignUp')),
        15000
    )
  }, 60000)

  test('Citizen usage submitting report', async () => {
    await steps.login(CommonData.USER_CITIZEN, false)

    await driver.wait(
        until.elementLocated(By.id('createNewReportBtn')),
        15000
    )

    await steps.custumClick(By.id('createNewReportBtn'))

    await driver.wait(
        until.elementLocated(By.id('mapReport')),
        15000
    )

    await steps.scrollBySteps(By.id('mapReport'), [30, -50])

    await steps.clickRandomInMiddle()

    await steps.selectDropdownByValue(By.id('reportType'), '3')
    await steps.custumSendKeys(By.id('title'), 'Sewer Issue in Downtown')
    await steps.custumSendKeys(By.id('description'), 'Sewer leaking in Downtown')

    await steps.uploadPhotos(
        By.css('input[type="file"][name="photos"]'),
        [CommonData.getImg('gas_leak.jpg')]
    )

    await steps.scrollToElement(
        By.id('scrollableFormSubmitReport'),
        By.id('submitReportBtn')
    )

    await steps.custumClick(By.id('submitReportBtn'))

    await driver.wait(
        until.elementLocated(By.id('toast_message_success')),
        20000
    )

    await steps.custumClick(By.id('logoutBtn'))

    await driver.wait(
        until.elementLocated(By.id('SignIn_SignUp')),
        15000
    )
  }, 90000)

  test('Citizen view submitted reports', async () => {
    await steps.login(CommonData.USER_CITIZEN)

    await driver.wait(
        until.elementLocated(By.id('mapReport')),
        15000
    )

    await steps.scrollToElementGlobal(By.id('mapReport'))
    await steps.scrollBySteps(By.id('mapReport'), [30, -50])

    await driver.wait(
        until.elementLocated(By.css('.report_circle_1')),
        15000
    )

    await steps.custumClick(By.css('.report_circle_1'))

    await steps.custumClick(By.id('logoutBtn'))

    await driver.wait(
        until.elementLocated(By.id('SignIn_SignUp')),
        15000
    )
  }, 60000)
})
