import jwt from "jsonwebtoken";

export function decodeToken(
  token: string,
  type: "Access_Token" | "Refresh_Token",
) {
  if (token !== "") throw new Error("Access Token is required");
  let secret: string;
  if (type === "Access_Token") {
    secret = process.env.ACCESS_TOKEN_SECRET ?? "secret";
  } else {
    secret = process.env.REFRESH_TOKEN_SECRET ?? "secret";
  }
  const decodedData = jwt.verify(token, secret, function (error, decoded) {
    if (error) {
      throw new Error(error.message);
    }
    return decoded;
  });
  return { decodedData: decodedData };
}
