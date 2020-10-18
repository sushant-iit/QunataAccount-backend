const nodemailer = require('nodemailer');
const fs = require('fs');

const emailTemplate = fs.readFileSync(
  `${__dirname}/../templates/emailTemplate.html`,
  {
    encoding: 'utf-8',
  }
);

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0].toUpperCase();
    this.url = url;
    this.baseURL = process.env.BASE_URL_EMAIL;
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

  send(buttonText, mainDescription, subject, bodyHeader) {
    //1)Creating required html page from the template:
    const html = emailTemplate
      .replace(/%FIRST_NAME%/g, this.firstName)
      .replace(/%BASE_URL%/g, process.env.BASE_URL_EMAIL)
      .replace(/%URL%/g, this.url)
      .replace(/%BUTTON_TEXT%/g, buttonText)
      .replace(/%MAIN_DESCRIPTION%/g, mainDescription)
      .replace(/%BODY_HEADER%/g, bodyHeader)
      .replace('%BODY_TITLE%', `Hola!! ${this.firstName}`)
      .replace('%BODY_DESCRIPTION%', "We're glad to have you in the ride!");

    //2)Setting email Options:
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
    };

    //3)Returning the promise so that the error can be caught in the higher order calling functions and processing can be done:
    return this.newTransport().sendMail(mailOptions);
  }

  sendActivationEmail() {
    const sendActivationEmail = this.send(
      'Activate Now',
      'Click on the below button to activate your account',
      'Activate your QuantaAccount',
      'Hi there! You are just one step to go.'
    );
    //Receiving the promise and forwarding it to the higher order functions calling it:
    return sendActivationEmail;
  }

  sendPasswordResetEmail() {
    const sendPasswordResetEmail = this.send(
      'Reset Now',
      'Click on the button below to reset your Password',
      'Reset your QuantaAccountPassword',
      'If not initiated by you, you can safely ignore.'
    );
    return sendPasswordResetEmail;
  }
};
