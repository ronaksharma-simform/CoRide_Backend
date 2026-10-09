import { prisma } from "@/config/prisma";
import { Payment, User } from "@/generated/prisma/client";
import { paymentGateway } from "@/services/paymentGateway";
import AppError from "@/utils/customErrorClass";
import { calculateFare, surgeFor } from "@/utils/fare";

export const PAYMENT_TIMEOUT_MS = 15 * 60 * 1000;

type Actor = Pick<User, "id" | "role">;
type PaymentWithRide = Payment & { ride: { providerId: string } };

const withRide = { ride: { select: { providerId: true } } } as const;

export class PaymentService {
  static readonly createPayment = async (
    rideId: string,
    rider: Actor,
  ): Promise<Payment> => {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new AppError("RIDE_NOT_FOUND");
    if (ride.status !== "COMPLETED") {
      throw new AppError("PAYMENT_RIDE_NOT_COMPLETED");
    }
    if (ride.providerId === rider.id) {
      throw new AppError("RIDE_CANNOT_JOIN_OWN_RIDE");
    }
    const existing = await prisma.payment.findUnique({
      where: { rideId_riderId: { rideId, riderId: rider.id } },
    });
    if (existing) throw new AppError("PAYMENT_ALREADY_EXISTS");

    // Fare inputs come from stored ride data, never from the request.
    const [{ meters }] = await prisma.$queryRaw<{ meters: number }[]>`
      SELECT ST_Length("route") AS meters FROM "Ride" WHERE "id" = ${rideId}::uuid`;
    const distanceMeters = Math.round(Number(meters));
    const durationMinutes = Math.max(
      1,
      Math.round(
        (ride.updatedAt.getTime() - ride.departureTime.getTime()) / 60_000,
      ),
    );
    const surgeMultiplier = surgeFor(ride.totalSeats, ride.availableSeats);
    const fare = calculateFare({
      distanceMeters,
      durationMinutes,
      surgeMultiplier,
    });

    try {
      return await prisma.payment.create({
        data: {
          rideId,
          riderId: rider.id,
          distanceMeters,
          durationMinutes,
          surgeMultiplier,
          ...fare,
        },
      });
    } catch (error) {
      // Lost a race with a parallel request for the same ride and rider.
      if ((error as { code?: string }).code === "P2002") {
        throw new AppError("PAYMENT_ALREADY_EXISTS");
      }
      throw error;
    }
  };

  static readonly confirmPayment = async (
    id: string,
    rider: Actor,
  ): Promise<Payment> => {
    const payment = await this.findOrThrow(id);
    if (payment.riderId !== rider.id) throw new AppError("AUTH_FORBIDDEN");
    if (payment.status !== "PENDING" && payment.status !== "FAILED") {
      throw new AppError("PAYMENT_INVALID_STATE");
    }
    const from = payment.status;
    if (
      from === "PENDING" &&
      Date.now() - payment.createdAt.getTime() > PAYMENT_TIMEOUT_MS
    ) {
      await this.transition(id, from, { status: "TIMED_OUT" });
      throw new AppError("PAYMENT_TIMED_OUT");
    }

    let result;
    try {
      result = await paymentGateway.charge({
        amount: payment.amount,
        currency: payment.currency,
        idempotencyKey: payment.id,
      });
    } catch {
      result = { ok: false as const, reason: "Payment gateway unavailable" };
    }
    return this.transition(
      id,
      from,
      result.ok
        ? {
            status: "SUCCEEDED",
            gatewayRef: result.reference,
            failureReason: null,
            paidAt: new Date(),
          }
        : { status: "FAILED", failureReason: result.reason },
    );
  };

  static readonly refundPayment = async (
    id: string,
    reason: string,
  ): Promise<Payment> => {
    const payment = await this.findOrThrow(id);
    if (payment.status !== "SUCCEEDED") {
      throw new AppError("PAYMENT_INVALID_STATE");
    }
    return this.transition(id, "SUCCEEDED", {
      status: "REFUNDED",
      refundReason: reason,
      refundedAt: new Date(),
    });
  };

  static readonly getPayment = async (
    id: string,
    user: Actor,
  ): Promise<Payment> => {
    const payment = await this.findOrThrow(id);
    const allowed =
      user.role === "ADMIN" ||
      payment.riderId === user.id ||
      payment.ride.providerId === user.id;
    if (!allowed) throw new AppError("AUTH_FORBIDDEN");
    return payment;
  };

  static readonly listPayments = async (user: Actor): Promise<Payment[]> => {
    const where =
      user.role === "ADMIN"
        ? {}
        : user.role === "DRIVER"
          ? { ride: { providerId: user.id } }
          : { riderId: user.id };
    return prisma.payment.findMany({ where, orderBy: { createdAt: "desc" } });
  };

  private static readonly findOrThrow = async (
    id: string,
  ): Promise<PaymentWithRide> => {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: withRide,
    });
    if (!payment) throw new AppError("PAYMENT_NOT_FOUND");
    return payment;
  };

  // Compare-and-set on the status we read, so two parallel requests cannot
  // both move the same payment.
  private static readonly transition = async (
    id: string,
    from: Payment["status"],
    data: Partial<Payment>,
  ): Promise<Payment> => {
    const { count } = await prisma.payment.updateMany({
      where: { id, status: from },
      data: { ...data, updatedAt: new Date() },
    });
    if (count === 0) throw new AppError("PAYMENT_INVALID_STATE");
    return (await this.findOrThrow(id)) as Payment;
  };
}
