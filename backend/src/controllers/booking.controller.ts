import { Request, Response, NextFunction } from 'express';
import * as bookingService from '../services/booking.service';
import { ok, created, paginated, buildPagination } from '../utils/response';

export async function createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const booking = await bookingService.createBooking(req.userId, req.body);
    created(res, booking, 'Réservation créée');
  } catch (err) { next(err); }
}

export async function listBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.validatedQuery;
    const { items, total } = await bookingService.listBookings(req.userId, req.userRole, q);
    paginated(res, items, buildPagination(total, q.page, q.limit));
  } catch (err) { next(err); }
}

export async function getBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.userId, req.userRole);
    ok(res, booking);
  } catch (err) { next(err); }
}

export async function confirmBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const booking = await bookingService.confirmBooking(req.params.id, req.userId);
    ok(res, booking, 'Réservation confirmée');
  } catch (err) { next(err); }
}

export async function declineBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const booking = await bookingService.declineBooking(req.params.id, req.userId, req.body.reason as string);
    ok(res, booking, 'Réservation refusée');
  } catch (err) { next(err); }
}

export async function startBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const booking = await bookingService.startBooking(req.params.id, req.userId);
    ok(res, booking, 'Mission démarrée');
  } catch (err) { next(err); }
}

export async function completeBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const booking = await bookingService.completeBooking(req.params.id, req.userId);
    ok(res, booking, 'Mission terminée');
  } catch (err) { next(err); }
}

export async function cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.userId, req.body.reason as string);
    ok(res, booking, 'Réservation annulée');
  } catch (err) { next(err); }
}

export async function getQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.validatedQuery;
    const quote = await bookingService.calculateQuote(q.providerId, q.serviceType, q.durationHours);
    ok(res, quote);
  } catch (err) { next(err); }
}
