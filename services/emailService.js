const nodemailer = require('nodemailer');

// Configure your email transport
const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: process.env.SENDER_EMAIL_ID, // Your email
    pass:  process.env.SENDER_APP_PASSWORD, // Your email password or app password
  },
});

async function notifyUser(job) {
  const mailOptions = {
    from: process.env.SENDER_EMAIL_ID,
    to: process.env.SENDER_EMAIL_ID,
    subject: `Job Failure Notification: Job ID ${job.id}`,
    text: `Dear User,\n\nThe job with ID ${job.id} has failed after maximum retries.\n\nDetails:\nType: ${job.type}\nParameters: ${JSON.stringify(job.parameters)}\n\nPlease check the job and take necessary action.\n\nBest Regards,\nYour System`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`User notified about job failure: ${job.id}`);
  } catch (error) {
    console.error(`Failed to send notification for job ${job.id}:`, error);
  }
}

// Email sending logic
async function sendEmail(params) {
    const transporter = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: process.env.SENDER_EMAIL_ID, 
          pass: process.env.SENDER_APP_PASSWORD,
        },
      });
      const mailOptions = {
        from: process.env.SENDER_APP_PASSWORD,
        to: params[0].param_value,
        subject: params[1].param_value,
        text: params[2].param_value
      };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to: ${params.to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

module.exports = {notifyUser,sendEmail};
