import jwt from "jsonwebtoken";
export interface ITokenData {
  id: string;
}
export const generateAccessToken = (data: ITokenData) => {
  const secret: string = process.env.ACCESS_TOKEN_SECRET ?? "secret";
  const rawExpiry = parseInt(process.env.ACCESS_TOKEN_EXPIRY ?? "");
  const accessTokenExpiry = (isNaN(rawExpiry) ? null : rawExpiry) ?? "30m";
  const accessToken = jwt.sign(data, secret, {
    expiresIn: accessTokenExpiry,
  });

  return { accessToken: accessToken };
};

export const generateRefreshToken = (data: ITokenData) => {
  const secret: string = process.env.REFRESH_TOKEN_SECRET ?? "secret";
  // const refreshTokenExpiry  = process.env.REFRESH_TOKEN_EXPIRY ?? "30m";
  const refreshToken = jwt.sign(data, secret, { expiresIn: "7d" });
  return { refreshToken: refreshToken };
};
