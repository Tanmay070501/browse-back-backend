import nodeMailer from "nodemailer"
import Mail from "nodemailer/lib/mailer";
export const sendMail = async (email: string, subject: string,text: string, props: Mail.Options = {}) => {
    const transporter = nodeMailer.createTransport({
        host: process.env.host,
        service: process.env.service,
        port: Number(process.env.email_port),
        auth:{
            user: process.env.app_email,
            pass: process.env.app_password,
        }
    });
    await transporter.sendMail({
        from: process.env.app_email,
        to: email,
        subject,
        text,
        ...props,
    })
}
