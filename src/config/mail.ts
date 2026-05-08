import { config } from "@/utils/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,

  auth: { user: config.email.user, pass: config.email.password },
});

export default transporter;
