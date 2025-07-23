import nodemailer from "nodemailer";
import ejs from "ejs";
import config from "../config";
require("dotenv").config();
const { google } = require("googleapis");

export const sendEmail = async (
  to: string,
  template: string,
  subject: string,
  username: string,
  otp?: string
) => {

  console.log("[sendEmail] Function called");
  console.log(`[sendEmail] To: ${to}, Subject: ${subject}, Template: ${template}`);



  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  // const transporter = nodemailer.createTransport({
  //   host: "smtp-relay.gmail.com",
  //   port: 587,
  //   secure: false,

  //   auth: {
  //     // TODO: replace `user` and `pass` values from <https://forwardemail.net>
  //     user: "noreply@taskplanner.co.uk",
  //     pass: "ddgc rryi lucp ckwx",
  //   },
  //   tls: {
  //     rejectUnauthorized: false,
  //   },
  // });

  const transporter = nodemailer.createTransport({
    // host: "smtp.ionos.co.uk",
    // port: 587,
    // secure: false,
    service: "Gmail",
    auth: {
      type: "OAuth2",
      user: process.env.SENDER_EMAIL,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: process.env.GOOGLE_ACCESS_TOKEN,
    },
  });

  ejs.renderFile(
    __dirname + "/../static/email_template/" + template + ".ejs",
    {
      name: username,
      next_action: "https://taskplanner.co.uk/login",
      support_url: "https://taskplanner.co.uk",
      action_url: "https://taskplanner.co.uk/login",
      login_url: "https://taskplanner.co.uk/login",
      username,
      otp,
    },
    function (err: any, data: any) {
      if (err) {
        console.log(err);
      } else {
        var mainOptions = {
          from: process.env.SENDER_EMAIL,
          to,
          subject,
          html: data,
        };
        console.log("[sendEmail] Sending email...");
        transporter.sendMail(mainOptions, function (err, info) {
          if (err) {
            console.log(err);
          } else {
            console.log("Message sent: " + info.response);
          }
        });
      }
    }
  );
};
