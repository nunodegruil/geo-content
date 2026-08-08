import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  utilizador?: {
    id: number;
    email: string;
    nome?: string;
    tipo_utilizador?: string;
  };
}

export function autenticarToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Token não fornecido",
    });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      error: "Formato de token inválido",
    });
  }

  const token = parts[1];

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        error: "JWT_SECRET não está definido",
      });
    }

    const decoded = jwt.verify(token, secret) as {
      id: number;
      email: string;
      nome?: string;
      tipo_utilizador?: string;
    };

    req.utilizador = {
      id: decoded.id,
      email: decoded.email,
      nome: decoded.nome,
      tipo_utilizador: decoded.tipo_utilizador,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Token inválido ou expirado",
    });
  }
}

export function autenticarTokenOpcional(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return next();
  }

  const token = parts[1];

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return next();
    }

    const decoded = jwt.verify(token, secret) as {
      id: number;
      email: string;
      nome?: string;
      tipo_utilizador?: string;
    };

    req.utilizador = {
      id: decoded.id,
      email: decoded.email,
      nome: decoded.nome,
      tipo_utilizador: decoded.tipo_utilizador,
    };

    return next();
  } catch (error) {
    return next();
  }
}