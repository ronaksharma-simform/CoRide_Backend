import { AuthService } from "@/services/auth.services";
import { RequestHandler } from "express";

export const registration: RequestHandler = async (req, res) => {
  const responseData = await AuthService.register(req.body);
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: responseData.userData,
    accessToken: responseData.accessToken,
  });
};
