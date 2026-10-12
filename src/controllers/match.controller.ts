import { HTTP_STATUS_CODES } from "@/constants/httpCodes";
import { MatchService } from "@/services/match.services";
import { RequestHandler } from "express";

export const requestMatch: RequestHandler = async (req, res) => {
  const data = await MatchService.request(req.user.id, req.body);
  res.status(HTTP_STATUS_CODES.CREATED).json({
    success: true,
    message:
      data.status === "NO_DRIVERS"
        ? "No drivers available nearby"
        : "Ride request matched",
    data,
  });
};
export const acceptMatch: RequestHandler = async (req, res) => {
  const data = await MatchService.accept(req.body.id, req.user.id);
  res
    .status(HTTP_STATUS_CODES.OK)
    .json({ success: true, message: "Ride request updated", data });
};
export const rejectMatch: RequestHandler = async (req, res) => {
  const data = await MatchService.reject(req.body.id, req.user.id);
  res
    .status(HTTP_STATUS_CODES.OK)
    .json({ success: true, message: "Ride request reassigned", data });
};
export const cancelMatch: RequestHandler = async (req, res) => {
  const data = await MatchService.cancel(req.body.id, req.user.id);
  res
    .status(HTTP_STATUS_CODES.OK)
    .json({ success: true, message: "Ride request cancelled", data });
};
