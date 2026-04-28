import jwt from "jsonwebtoken";
export interface ITokenData {
  id: string;
}
export const generateAccessToken = (data: ITokenData) => {
  const secret: string = process.env.ACCESS_TOKEN_SECRET ?? "secret";
  // const accessTokenExpiry  = process.env.ACCESS_TOKEN_EXPIRY ?? "30m";
  const accessToken = jwt.sign(data, secret, { expiresIn: "30m" });
  console.log(accessToken);
  return { accessToken: accessToken };
};

export const generateRefreshToken = (data: ITokenData) => {
  const secret: string = process.env.REFRESH_TOKEN_SECRET ?? "secret";
  // const refreshTokenExpiry  = process.env.REFRESH_TOKEN_EXPIRY ?? "30m";
  const refreshToken = jwt.sign(data, secret, { expiresIn: "7d" });
  return { refreshToken: refreshToken };
};
