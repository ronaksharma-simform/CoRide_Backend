import transporter from "@/config/mail";
import { config } from "@/utils/config";

class MailService {
  static sendMail = async (
    to: string,
    subject: string,
    template: string,
  ): Promise<void> => {
    await transporter.sendMail({
      from: config.email.user,
      to,
      subject,
      html: template,
    });
  };
}
export default MailService;
