import bcrypt from "bcrypt";
import crypto from "crypto";
const generateHash = async (data: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(data, salt);
  return hash;
};
export const generateHashToken = (): {
  rawToken: string;
  hashedToken: string;
} => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  return { rawToken, hashedToken };
};
export default generateHash;
