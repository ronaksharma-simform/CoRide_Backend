import jwt from "jsonwebtoken";
import { config } from "./config";

export interface ITokenData {
  id: string;
}
export const generateAccessToken = (
  data: ITokenData,
): { accessToken: string } => {
  const secret: string = config.jwt.access.secret;
  const rawExpiry = parseInt(process.env.ACCESS_TOKEN_EXPIRY ?? "");
  const accessTokenExpiry = isNaN(rawExpiry) ? "30m" : rawExpiry;
  const accessToken = jwt.sign(data, secret, {
    expiresIn: accessTokenExpiry,
  });
  return { accessToken: accessToken };
};

export const generateRefreshToken = (
  data: ITokenData,
): { refreshToken: string } => {
  const secret: string = process.env.REFRESH_TOKEN_SECRET ?? "secret";
  // const refreshTokenExpiry  = process.env.REFRESH_TOKEN_EXPIRY ?? "30m";
  const refreshToken = jwt.sign(data, secret, { expiresIn: "7d" });
  return { refreshToken: refreshToken };
};
