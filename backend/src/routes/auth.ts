import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../db/pool";

const router = Router();

const registerSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A password deve ter pelo menos 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "A password é obrigatória"),
});

function gerarToken(utilizador: {
  id: number;
  email: string;
  nome: string;
  tipo_utilizador: string;
}) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET não está definido no ficheiro .env");
  }

  return jwt.sign(
    {
      id: utilizador.id,
      email: utilizador.email,
      nome: utilizador.nome,
      tipo_utilizador: utilizador.tipo_utilizador,
    },
    secret,
    {
      expiresIn: "1d",
    }
  );
}

// POST /auth/register
router.post("/register", async (req, res) => {
  const validacao = registerSchema.safeParse(req.body);

  if (!validacao.success) {
    return res.status(400).json({
      error: "Dados inválidos",
      detalhes: validacao.error.flatten().fieldErrors,
    });
  }

  const { nome, email, password } = validacao.data;

  try {
    const utilizadorExistente = await pool.query(
      "SELECT id FROM utilizadores WHERE email = $1",
      [email]
    );

    if (utilizadorExistente.rows.length > 0) {
      return res.status(409).json({
        error: "Já existe um utilizador com este email",
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      `
      INSERT INTO utilizadores (nome, email, palavra_passe)
      VALUES ($1, $2, $3)
      RETURNING id, nome, email, tipo_utilizador, data_registo
      `,
      [nome, email, passwordHash]
    );

    const utilizador = result.rows[0];

    return res.status(201).json({
      message: "Utilizador registado com sucesso",
      utilizador,
    });
  } catch (error) {
    console.error("Erro ao registar utilizador:", error);

    return res.status(500).json({
      error: "Erro ao registar utilizador",
    });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const validacao = loginSchema.safeParse(req.body);

  if (!validacao.success) {
    return res.status(400).json({
      error: "Dados inválidos",
      detalhes: validacao.error.flatten().fieldErrors,
    });
  }

  const { email, password } = validacao.data;

  try {
    const result = await pool.query(
      `
      SELECT id, nome, email, palavra_passe, tipo_utilizador
      FROM utilizadores
      WHERE email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    const utilizador = result.rows[0];

    const passwordCorreta = await bcrypt.compare(
      password,
      utilizador.palavra_passe
    );

    if (!passwordCorreta) {
      return res.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    const token = gerarToken({
      id: utilizador.id,
      nome: utilizador.nome,
      email: utilizador.email,
      tipo_utilizador: utilizador.tipo_utilizador,
    });

    return res.json({
      message: "Login efetuado com sucesso",
      token,
      utilizador: {
        id: utilizador.id,
        nome: utilizador.nome,
        email: utilizador.email,
        tipo_utilizador: utilizador.tipo_utilizador,
      }, 
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);

    return res.status(500).json({
      error: "Erro ao fazer login",
    });
  }
});

export default router;