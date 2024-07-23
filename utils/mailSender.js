const nodemailer = require('nodemailer');





const fromUser = 'suryakant.webdeveloper@gmail.com';
const password = 'mmke dvcj eily twap';


// Create a reusable transporter object
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: fromUser, 
    pass: password
  }
});

// Function to send email notification
const sendEmail = (recipient, htmlTemplate, subject) => {
  const mailOptions = {
    from: fromUser, // Replace with your Gmail email
    to: recipient,
    subject: subject,
    html: htmlTemplate,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

module.exports = sendEmail;