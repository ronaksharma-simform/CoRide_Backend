import { Router } from "express";
import { registration } from "@/controllers/auth.controller";
import { asyncHandler } from "@/utils/asyncHandler";
const route = Router();

route.post("/registration", asyncHandler(registration));
route.post("/register", asyncHandler(registration));

export default route;
