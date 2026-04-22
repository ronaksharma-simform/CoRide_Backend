import bcrypt from "bcryptjs";

async function generateHash(data: string) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(data, salt);
  return hash;
}
export default generateHash;
