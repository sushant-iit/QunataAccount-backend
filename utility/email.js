const nodemailer = require('nodemailer');
const fs = require('fs');

const emailTemplate = fs.readFileSync(
  `${__dirname}/../templates/emailTemplate.html`,
  {
    encoding: 'utf-8',
  }
);

module.exports = class Email {
  constructor(user, url, baseURL) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0].toUpperCase();
    this.url = url;
    this.baseURL = baseURL;
    this.from = `<krsushant.sk@gmail.com>`;
  }

  newTransport() {
    const config = {
      host: null,
      port: null,
      user: null,
      password: null,
    };

    //SETTING CONFIGURATION--Using mailtrap if environment is 'development' else using SendInBlue service for 'production'
    if (process.env.NODE_ENV === 'production') {
      config.host = process.env.SENDINBLUE_HOST;
      config.port = process.env.SENDINBLUE_PORT;
      config.user = process.env.SENDINBLUE_USER;
      config.password = process.env.SENDINBLUE_PASSWORD;
    } else if (process.env.NODE_ENV === 'development') {
      config.host = process.env.MAILTRAP_HOST;
      config.port = process.env.MAILTRAP_PORT;
      config.user = process.env.MAILTRAP_USER;
      config.password = process.env.MAILTRAP_PASSWORD;
    }

    //Creating Transport and returning
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
  }

  async send(buttonText, mainDescription, subject, bodyHeader) {
    //1)Creating required html page from the template:
    const html = emailTemplate
      .replace('%FIRST_NAME%', this.firstName)
      .replace('%BASE_URL%', this.baseURL)
      .replace('%URL%', this.url)
      .replace('%BUTTON_TEXT%', buttonText)
      .replace('%MAIN_DESCRIPTION%', mainDescription)
      .replace('%BODY_HEADER%', bodyHeader)
      .replace(
        '%BODY_TITLE%',
        'Or, Alternatively! You can copy and paste the below link in your browser to do so:'
      )
      .replace('%BODY_DESCRIPTION%', this.url);

    //2)Setting email Options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
    };

    //3)Sending the actual email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendActivationEmail() {
    this.send(
      'Activate Now',
      'Click on the below button to activate your account',
      'Activate your QuantaAccount',
      'Hi there! You are just one step to go.'
    );
  }
};
