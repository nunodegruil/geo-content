import { Router } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { z } from "zod";

const router = Router();

const metadataSchema = z.object({
    url: z.string().url("URL inválida"),
});

router.post("/preview", async (req, res) => {
    try {
        const resultado = metadataSchema.safeParse(req.body);

        if (!resultado.success) {
            return res.status(400).json({
                erro: "Dados inválidos",
                detalhes: resultado.error.flatten(),
            });
        }

        const { url } = resultado.data;

        const resposta = await axios.get(url, {
            timeout: 8000,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (compatible; GeoContentBot/1.0; +http://localhost)",
            },
        });

        const $ = cheerio.load(resposta.data);

        const titulo =
            $('meta[property="og:title"]').attr("content") ||
            $("title").text() ||
            "";

        const descricao =
            $('meta[property="og:description"]').attr("content") ||
            $('meta[name="description"]').attr("content") ||
            "";

        const imagem =
            $('meta[property="og:image"]').attr("content") ||
            "";

        const urlFinal =
            $('meta[property="og:url"]').attr("content") ||
            url;

        res.json({
            url: urlFinal,
            titulo: titulo.trim(),
            descricao: descricao.trim(),
            imagem: imagem.trim(),
        });
    } catch (error) {
        console.error("Erro ao obter metadados:", error);

        res.status(500).json({
            erro: "Erro ao obter metadados da página",
        });
    }
});

export default router;