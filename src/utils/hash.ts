import bcrypt from "bcrypt";

const generateHash = async (data: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(data, salt);
  return hash;
};
export default generateHash;
