export const ErrorCode = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_TAKEN:         'AUTH_EMAIL_TAKEN',
  AUTH_PHONE_TAKEN:         'AUTH_PHONE_TAKEN',
  AUTH_ACCOUNT_SUSPENDED:   'AUTH_ACCOUNT_SUSPENDED',
  AUTH_ACCOUNT_BANNED:      'AUTH_ACCOUNT_BANNED',
  AUTH_ACCOUNT_PENDING:     'AUTH_ACCOUNT_PENDING',
  AUTH_OTP_EXPIRED:         'AUTH_OTP_EXPIRED',
  AUTH_OTP_INVALID:         'AUTH_OTP_INVALID',
  AUTH_TOKEN_INVALID:       'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED:       'AUTH_TOKEN_EXPIRED',
  // Provider
  PROVIDER_NOT_VERIFIED:    'PROVIDER_NOT_VERIFIED',
  PROVIDER_NOT_AVAILABLE:   'PROVIDER_NOT_AVAILABLE',
  PROVIDER_NOT_FOUND:       'PROVIDER_NOT_FOUND',
  PROVIDER_SERVICE_MISSING: 'PROVIDER_SERVICE_MISSING',
  // Booking
  BOOKING_SLOT_UNAVAILABLE: 'BOOKING_SLOT_UNAVAILABLE',
  BOOKING_NOT_FOUND:        'BOOKING_NOT_FOUND',
  BOOKING_CANNOT_CANCEL:    'BOOKING_CANNOT_CANCEL',
  BOOKING_CANNOT_START:     'BOOKING_CANNOT_START',
  BOOKING_CANNOT_COMPLETE:  'BOOKING_CANNOT_COMPLETE',
  BOOKING_WRONG_PROVIDER:   'BOOKING_WRONG_PROVIDER',
  // Payment
  PAYMENT_FAILED:           'PAYMENT_FAILED',
  PAYMENT_GATEWAY_ERROR:    'PAYMENT_GATEWAY_ERROR',
  PAYMENT_ALREADY_PAID:     'PAYMENT_ALREADY_PAID',
  // Earnings
  INSUFFICIENT_BALANCE:     'INSUFFICIENT_BALANCE',
  // Review
  REVIEW_ALREADY_EXISTS:    'REVIEW_ALREADY_EXISTS',
  REVIEW_NOT_FOUND:         'REVIEW_NOT_FOUND',
  REVIEW_MISSION_INCOMPLETE:'REVIEW_MISSION_INCOMPLETE',
  // Generic
  VALIDATION_ERROR:         'VALIDATION_ERROR',
  UNAUTHORIZED:             'UNAUTHORIZED',
  FORBIDDEN:                'FORBIDDEN',
  NOT_FOUND:                'NOT_FOUND',
  SERVER_ERROR:             'SERVER_ERROR',
  CONFLICT:                 'CONFLICT',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCodeType,
    message: string,
    public readonly details?: unknown[],
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(code: ErrorCodeType, message: string, details?: unknown[]): AppError {
    return new AppError(400, code, message, details);
  }
  static unauthorized(code: ErrorCodeType = ErrorCode.UNAUTHORIZED, message = 'Non authentifié'): AppError {
    return new AppError(401, code, message);
  }
  static forbidden(code: ErrorCodeType = ErrorCode.FORBIDDEN, message = 'Accès interdit'): AppError {
    return new AppError(403, code, message);
  }
  static notFound(code: ErrorCodeType = ErrorCode.NOT_FOUND, message = 'Ressource introuvable'): AppError {
    return new AppError(404, code, message);
  }
  static conflict(code: ErrorCodeType, message: string): AppError {
    return new AppError(409, code, message);
  }
  static internal(message = 'Erreur interne du serveur'): AppError {
    return new AppError(500, ErrorCode.SERVER_ERROR, message);
  }
}
