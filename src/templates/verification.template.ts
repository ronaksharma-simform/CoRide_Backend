import { config } from "@/utils/config";

export const verificationTemplate = (
  name: string,
  verificationUrl: string,
): string => {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Email Verification</title>
    </head>

    <body
      style="
        margin: 0;
        padding: 0;
        background-color: #f4f7fb;
        font-family: Arial, Helvetica, sans-serif;
      "
    >
      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="padding: 40px 20px"
      >
        <tr>
          <td align="center">
            <table
              width="600"
              cellpadding="0"
              cellspacing="0"
              border="0"
              style="
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
              "
            >
              <!-- Header -->
              <tr>
                <td
                  align="center"
                  style="
                    background-color: #111827;
                    padding: 32px 20px;
                  "
                >
                  <h1
                    style="
                      color: #ffffff;
                      margin: 0;
                      font-size: 32px;
                      letter-spacing: 1px;
                    "
                  >
                    CoRide
                  </h1>

                  <p
                    style="
                      color: #d1d5db;
                      margin-top: 10px;
                      font-size: 14px;
                    "
                  >
                    Smart Ride Sharing Platform
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 40px 32px">
                  <h2
                    style="
                      margin: 0 0 20px;
                      color: #111827;
                      font-size: 24px;
                    "
                  >
                    Verify Your Email Address
                  </h2>

                  <p
                    style="
                      margin: 0 0 16px;
                      color: #4b5563;
                      font-size: 16px;
                      line-height: 1.7;
                    "
                  >
                    Hello ${name},
                  </p>

                  <p
                    style="
                      margin: 0 0 24px;
                      color: #4b5563;
                      font-size: 16px;
                      line-height: 1.7;
                    "
                  >
                    Your CoRide account has been created successfully.
                    Verify your email address to activate your account
                    and access all platform features.
                  </p>

                  <!-- Button -->
                  <table
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    align="center"
                    style="margin: 32px auto"
                  >
                    <tr>
                      <td align="center" bgcolor="#111827" style="border-radius: 8px">
                        <a
                          href="${verificationUrl}"
                          target="_blank"
                          style="
                            display: inline-block;
                            padding: 14px 28px;
                            color: #ffffff;
                            text-decoration: none;
                            font-size: 16px;
                            font-weight: bold;
                          "
                        >
                          Verify Email
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p
                    style="
                      margin: 24px 0 12px;
                      color: #6b7280;
                      font-size: 14px;
                      line-height: 1.6;
                    "
                  >
                    If the button above does not work, use the link below:
                  </p>

                  <p
                    style="
                      word-break: break-word;
                      font-size: 14px;
                      color: #2563eb;
                      line-height: 1.6;
                    "
                  >
                    <a
                      href="${verificationUrl}"
                      target="_blank"
                      style="
                        color: #2563eb;
                        text-decoration: none;
                      "
                    >
                      ${verificationUrl}
                    </a>
                  </p>

                  <p
                    style="
                      margin-top: 32px;
                      color: #9ca3af;
                      font-size: 13px;
                      line-height: 1.6;
                    "
                  >
                    This verification link will expire in ${config.jwt.verification.expiry} minutes.
                    If you did not create this account, this email can be ignored.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td
                  align="center"
                  style="
                    background-color: #f9fafb;
                    padding: 24px;
                    border-top: 1px solid #e5e7eb;
                  "
                >
                  <p
                    style="
                      margin: 0;
                      color: #6b7280;
                      font-size: 13px;
                    "
                  >
                    © ${new Date().getFullYear()} CoRide. All rights reserved.
                  </p>

                  <p
                    style="
                      margin-top: 8px;
                      color: #9ca3af;
                      font-size: 12px;
                    "
                  >
                    Secure • Reliable • Smart Mobility
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};
