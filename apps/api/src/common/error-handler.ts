import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public statusCode: number, message: string, public details?: unknown) {
    super(message);
  }
}

export function errorHandler(err: FastifyError | Error, _req: FastifyRequest, reply: FastifyReply) {
  if (err instanceof ZodError) {
    return reply.status(400).send({
      error: 'validation_error',
      message: 'Datos inválidos',
      details: err.flatten(),
    });
  }
  if (err instanceof HttpError) {
    return reply.status(err.statusCode).send({
      error: 'error',
      message: err.message,
      details: err.details,
    });
  }
  console.error(err);
  return reply.status(500).send({
    error: 'internal_error',
    message: 'Error interno',
  });
}
