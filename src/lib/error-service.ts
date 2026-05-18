export interface AppError {
  code: string;
  userMessage: string;
  developerMessage?: string;
  detail?: string;
  path?: string;
  incidentId?: string;
  timestamp?: string;
}

// GraphQL AppErrorType from backend
export interface GraphQLAppError {
  code: string;
  userMessage: string;
  developerMessage?: string;
  detail?: string;
  path?: string;
  incidentId: string;
  timestamp: string;
  __typename?: string;
}

type ErrorHandler = (error: AppError) => void;

let currentHandler: ErrorHandler | null = null;

export function setErrorHandler(handler: ErrorHandler | null) {
  currentHandler = handler;
}

export function notifyError(error: AppError) {
  currentHandler?.(error);
}

/**
 * Convierte un error de GraphQL (AppErrorType) a AppError
 */
export function fromGraphQLError(graphQLError: GraphQLAppError): AppError {
  return {
    code: graphQLError.code,
    userMessage: graphQLError.userMessage,
    developerMessage: graphQLError.developerMessage,
    detail: graphQLError.detail,
    path: graphQLError.path,
    incidentId: graphQLError.incidentId,
    timestamp: graphQLError.timestamp,
  };
}

/**
 * Convierte un error genérico (Error, string, etc.) a AppError
 */
export function fromGenericError(
  error: unknown,
  defaultMessage: string = "Ha ocurrido un error inesperado"
): AppError {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    "userMessage" in error
  ) {
    return error as AppError;
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    code: "UNKNOWN_ERROR",
    userMessage: message || defaultMessage,
    developerMessage: error instanceof Error ? error.stack : String(error),
    incidentId: `temp-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Procesa errores de una respuesta GraphQL y los notifica
 */
export function processGraphQLErrors(errors?: GraphQLAppError[] | null) {
  if (!errors || errors.length === 0) return;

  errors.forEach((error) => {
    notifyError(fromGraphQLError(error));
  });
}
