import { prisma } from "@/config/prisma";
import { Vehicle } from "@/generated/prisma/client";
import AppError from "@/utils/customErrorClass";
import { TVehicleRegisterSchema } from "@/validations/vehicle.validations";

export class VehicleService {
  static readonly registerVehicle = async (
    vehicleRegisterData: TVehicleRegisterSchema,
    userId: string,
  ): Promise<Vehicle> => {
    const vehicleWithExistingNumber = await prisma.vehicle.findUnique({
      where: {
        plateNumber: vehicleRegisterData.plateNumber,
      },
    });
    if (vehicleWithExistingNumber) {
      throw new AppError("VEHICLE_PLATE_ALREADY_REGISTERED");
    }
    const userWithExistingId = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!userWithExistingId) {
      throw new AppError("AUTH_USER_NOT_FOUND");
    }
    const vehicle = await prisma.vehicle.create({
      data: { ...vehicleRegisterData, userId: userId },
    });
    return vehicle;
  };
  static readonly deleteVehicle = async (id: string): Promise<void> => {
    const vehicleWithExistingId = await prisma.vehicle.findUnique({
      where: { id },
    });
    if (!vehicleWithExistingId) {
      throw new AppError("VEHICLE_NOT_FOUND");
    }
    await prisma.vehicle.delete({
      where: { id },
    });
  };
  static readonly getVehicleById = async (id: string): Promise<Vehicle> => {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });
    if (!vehicle) {
      throw new AppError("VEHICLE_NOT_FOUND");
    }
    return vehicle;
  };
  static readonly getUserVehicles = async (
    userId: string,
  ): Promise<Vehicle[]> => {
    const userWithExistingId = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!userWithExistingId) {
      throw new AppError("AUTH_USER_NOT_FOUND");
    }
    const vehicleData = await prisma.vehicle.findMany({
      where: { userId },
    });
    return vehicleData;
  };
}
