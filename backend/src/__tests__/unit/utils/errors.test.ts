import { AppError, ErrorCode } from '../../../utils/errors';

describe('AppError', () => {
  it('crée une erreur 400 via badRequest', () => {
    const err = AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Données invalides');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Données invalides');
  });

  it('crée une erreur 401 via unauthorized', () => {
    const err = AppError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('crée une erreur 403 via forbidden', () => {
    const err = AppError.forbidden();
    expect(err.statusCode).toBe(403);
  });

  it('crée une erreur 404 via notFound', () => {
    const err = AppError.notFound(ErrorCode.BOOKING_NOT_FOUND, 'Réservation introuvable');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('BOOKING_NOT_FOUND');
  });

  it('crée une erreur 409 via conflict', () => {
    const err = AppError.conflict(ErrorCode.AUTH_EMAIL_TAKEN, 'Email pris');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('AUTH_EMAIL_TAKEN');
  });

  it('crée une erreur 500 via internal', () => {
    const err = AppError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('SERVER_ERROR');
  });

  it('conserve les details', () => {
    const details = [{ field: 'email', message: 'requis' }];
    const err = new AppError(422, ErrorCode.VALIDATION_ERROR, 'Erreur', details);
    expect(err.details).toEqual(details);
  });
});
