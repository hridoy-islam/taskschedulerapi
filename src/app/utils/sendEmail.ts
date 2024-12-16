import nodemailer from 'nodemailer';
import ejs from 'ejs';
import config from '../config';

export const sendEmail = async (to: string, template: string, subject: string, username: string, otp?: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com.',
    port: 587,
    secure: config.NODE_ENV === 'production',
    auth: {
      // TODO: replace `user` and `pass` values from <https://forwardemail.net>
      user: 'me.mrsajib@gmail.com',
      pass: 'rkckfvlpmfgajypa',
    },
  });

  ejs.renderFile(__dirname + "/../static/email_template/" + template + ".ejs", { name: username, next_action: "https://taskplanner.co.uk/login", support_url: "https://taskplanner.co.uk", action_url: "https://taskplanner.co.uk/login", login_url: "https://taskplanner.co.uk/login", username, otp }, function (err :any, data: any) {
    if (err) {
      console.log(err);
    } else {
      var mainOptions = {
        from: "me.mrsajib@gmail.com",
        to,
        subject,
        html: data,
      };
      transporter.sendMail(mainOptions, function (err, info) {
        if (err) {
          console.log(err);
        } else {
          console.log("Message sent: " + info.response);
        }
      });
    }
  });

  // await transporter.sendMail({
  //   from: 'hridoy4t@gmail.com', // sender address
  //   to, // list of receivers
  //   subject: 'Reset your password within ten mins!', // Subject line
  //   text: '', // plain text body
  //   html, // html body
  // });
};
