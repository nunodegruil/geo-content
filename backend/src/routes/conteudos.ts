import { Router } from "express";
import { pool } from "../db/pool";
import { z } from "zod";
import {
  autenticarToken,
  autenticarTokenOpcional,
  AuthRequest,
} from "../middleware/authMiddleware";

const router = Router();

// GET /conteudos
// GET /conteudos
router.get("/", autenticarTokenOpcional, async (req: AuthRequest, res) => {
  try {
    const utilizador = req.utilizador;

    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";

    const tipo =
      typeof req.query.tipo === "string" ? req.query.tipo.trim() : "";

    const tag =
      typeof req.query.tag === "string" ? req.query.tag.trim().toLowerCase() : "";

    const visibilidade =
      typeof req.query.visibilidade === "string"
        ? req.query.visibilidade.trim()
        : "";

    const estadoModeracao =
      typeof req.query.estado_moderacao === "string"
        ? req.query.estado_moderacao.trim()
        : "";

    const valores: any[] = [];
    const condicoes: string[] = [];

    if (utilizador?.tipo_utilizador === "admin") {
      // Admin pode ver todos os conteúdos
    } else if (utilizador) {
      valores.push(utilizador.id);
      condicoes.push(
        "((c.visibilidade = 'publico' AND c.estado_moderacao = 'aprovado') OR c.id_utilizador = $1)"
      );
    } else {
      condicoes.push(
        "(c.visibilidade = 'publico' AND c.estado_moderacao = 'aprovado')"
      );
    }

    if (search) {
      valores.push(`%${search}%`);
      const index = valores.length;

      condicoes.push(
        `(c.titulo ILIKE $${index} OR c.descricao ILIKE $${index})`
      );
    }

    if (tipo) {
      valores.push(tipo);
      const index = valores.length;

      condicoes.push(`c.tipo = $${index}`);
    }

    if (tag) {
      valores.push(tag);
      const index = valores.length;

      condicoes.push(`
        EXISTS (
          SELECT 1
          FROM conteudo_tags ct_filter
          JOIN tags t_filter ON t_filter.id = ct_filter.id_tag
          WHERE ct_filter.id_conteudo = c.id
          AND t_filter.nome = $${index}
        )
      `);
    }

    if (utilizador?.tipo_utilizador === "admin" && visibilidade) {
      valores.push(visibilidade);
      const index = valores.length;

      condicoes.push(`c.visibilidade = $${index}`);
    }

    if (utilizador?.tipo_utilizador === "admin" && estadoModeracao) {
      valores.push(estadoModeracao);
      const index = valores.length;

      condicoes.push(`c.estado_moderacao = $${index}`);
    }

    const whereClause =
      condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";

    const query = `
      SELECT
        c.id,
        c.titulo,
        c.descricao,
        c.tipo,
        c.url_externa,
        c.visibilidade,
        c.estado_moderacao,
        c.id_utilizador,
        l.latitude,
        l.longitude,
        ST_AsText(l.geom::geometry) AS geom,
        COALESCE(
          ARRAY_AGG(t.nome) FILTER (WHERE t.nome IS NOT NULL),
          '{}'
        ) AS tags
      FROM conteudos c
      JOIN localizacoes l ON c.id_localizacao = l.id
      LEFT JOIN conteudo_tags ct ON ct.id_conteudo = c.id
      LEFT JOIN tags t ON t.id = ct.id_tag
      ${whereClause}
      GROUP BY 
        c.id,
        l.id
      ORDER BY c.id ASC
    `;

    const result = await pool.query(query, valores);

    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao obter conteúdos:", error);
    res.status(500).json({ error: "Erro ao obter conteúdos" });
  }
});

// POST /conteudos
const criarConteudoSchema = z.object({
  titulo: z.string().min(1, "O título é obrigatório"),
  descricao: z.string().optional(),
  tipo: z.string().optional(),
  url_externa: z.string().url("URL inválida").optional().or(z.literal("")),
  visibilidade: z.enum(["publico", "privado"]).optional(),
  estado_moderacao: z.enum(["pendente", "aprovado", "rejeitado"]).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  morada_opcional: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const moderacaoSchema = z.object({
  estado_moderacao: z.enum(["aprovado", "rejeitado", "pendente"]),
});

router.post("/", autenticarToken, async (req: AuthRequest, res) => {

  const utilizador = req.utilizador;

  if (!utilizador) {
    return res.status(401).json({
      error: "Utilizador não autenticado",
    });
  }

  const validacao = criarConteudoSchema.safeParse(req.body);

  if (!validacao.success) {
    return res.status(400).json({
      error: "Dados inválidos",
      detalhes: validacao.error.flatten().fieldErrors,
    });
  }

  const {
    titulo,
    descricao,
    tipo,
    url_externa,
    visibilidade,
    latitude,
    longitude,
    morada_opcional,
    tags,
  } = validacao.data;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const localizacaoResult = await client.query(
      `
      INSERT INTO localizacoes (
        latitude,
        longitude,
        geom,
        morada_opcional
      )
      VALUES (
        $1,
        $2,
        ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
        $3
      )
      RETURNING id
      `,
      [latitude, longitude, morada_opcional || null]
    );

    const idLocalizacao = localizacaoResult.rows[0].id;

    const conteudoResult = await client.query(
      `
      INSERT INTO conteudos (
        titulo,
        descricao,
        tipo,
        url_externa,
        visibilidade,
        estado_moderacao,
        id_utilizador,
        id_localizacao
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        titulo,
        descricao || null,
        tipo || "link",
        url_externa || null,
        visibilidade || "publico",
        "pendente",
        utilizador.id,
        idLocalizacao,
      ]
    );

    const idConteudo = conteudoResult.rows[0].id;

    if (tags && tags.length > 0) {
      for (const tag of tags) {
        const nomeTag = tag.trim().toLowerCase();

        if (!nomeTag) {
          continue;
        }

        const tagResult = await client.query(
          `
      INSERT INTO tags (nome)
      VALUES ($1)
      ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome
      RETURNING id
      `,
          [nomeTag]
        );

        const idTag = tagResult.rows[0].id;

        await client.query(
          `
      INSERT INTO conteudo_tags (id_conteudo, id_tag)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
          [idConteudo, idTag]
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Conteúdo criado com sucesso",
      conteudo: conteudoResult.rows[0],
      localizacao: {
        id: idLocalizacao,
        latitude,
        longitude,
        morada_opcional: morada_opcional || null,
      },
      utilizador: {
        id: utilizador.id,
        email: utilizador.email,
        nome: utilizador.nome,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    res.status(500).json({
      error: "Erro ao criar conteúdo",
    });
  } finally {
    client.release();
  }
});

// GET /conteudos/proximos?lat=...&lng=...&raio=...
router.get("/proximos", async (req, res) => {
  const { lat, lng, raio } = req.query;

  if (!lat || !lng || !raio) {
    return res.status(400).json({
      error: "Os parâmetros lat, lng e raio são obrigatórios",
    });
  }

  const latitude = Number(lat);
  const longitude = Number(lng);
  const raioMetros = Number(raio);

  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    Number.isNaN(raioMetros)
  ) {
    return res.status(400).json({
      error: "Os parâmetros lat, lng e raio devem ser numéricos",
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        c.id,
        c.titulo,
        c.descricao,
        c.tipo,
        c.url_externa,
        c.visibilidade,
        c.estado_moderacao,
        l.latitude,
        l.longitude,
        ST_Distance(
          l.geom,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
        ) AS distancia_metros
      FROM conteudos c
      JOIN localizacoes l ON c.id_localizacao = l.id
      WHERE ST_DWithin(
        l.geom,
        ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
        $3
      )
      ORDER BY distancia_metros ASC
      `,
      [latitude, longitude, raioMetros]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: "Erro ao obter conteúdos por proximidade",
    });
  }
});

// PATCH /conteudos/:id/moderacao
router.patch(
  "/:id/moderacao",
  autenticarToken,
  async (req: AuthRequest, res) => {
    const utilizador = req.utilizador;

    if (!utilizador) {
      return res.status(401).json({
        error: "Utilizador não autenticado",
      });
    }

    if (utilizador.tipo_utilizador !== "admin") {
      return res.status(403).json({
        error: "Apenas administradores podem moderar conteúdos",
      });
    }

    const idConteudo = Number(req.params.id);

    if (Number.isNaN(idConteudo)) {
      return res.status(400).json({
        error: "ID de conteúdo inválido",
      });
    }

    const validacao = moderacaoSchema.safeParse(req.body);

    if (!validacao.success) {
      return res.status(400).json({
        error: "Dados inválidos",
        detalhes: validacao.error.flatten().fieldErrors,
      });
    }

    const { estado_moderacao } = validacao.data;

    try {
      const result = await pool.query(
        `
        UPDATE conteudos
        SET 
          estado_moderacao = $1,
          data_moderacao = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [estado_moderacao, idConteudo]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Conteúdo não encontrado",
        });
      }

      return res.json({
        message: "Estado de moderação atualizado com sucesso",
        conteudo: result.rows[0],
      });
    } catch (error) {
      console.error("Erro ao moderar conteúdo:", error);

      return res.status(500).json({
        error: "Erro ao moderar conteúdo",
      });
    }
  }
);

export default router;