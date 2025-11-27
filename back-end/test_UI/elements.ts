import { By } from 'selenium-webdriver';

export class CommonElements {


  static readonly SignInLink = By.css('a[href="/auth/account"]');
  static readonly LoginSelectCitizen = By.css('a[href="/auth/login/citizen"]');

  static readonly LogoutButton = By.xpath('//button[text()="Logout"]');
  
  //static readonly ;
}
