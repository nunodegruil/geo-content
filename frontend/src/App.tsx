import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

type Conteudo = {
  id: number;
  titulo: string;
  descricao: string | null;
  tipo: string | null;
  url_externa: string | null;
  visibilidade: "publico" | "privado";
  estado_moderacao: string;
  id_utilizador?: number;
  latitude: number;
  longitude: number;
  geom?: string;
  distancia_metros?: number;
  tags?: string[];
};

type Utilizador = {
  id: number;
  nome: string;
  email: string;
  tipo_utilizador: "admin" | "comum";
};

type CoordenadasSelecionadas = {
  lat: number;
  lng: number;
};

type FormConteudo = {
  titulo: string;
  descricao: string;
  tipo: string;
  url_externa: string;
  visibilidade: "publico" | "privado";
  tags: string;
};

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ onClick }: any) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

function App() {
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);

  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const [utilizador, setUtilizador] = useState<Utilizador | null>(() => {
    const dados = localStorage.getItem("utilizador");
    return dados ? JSON.parse(dados) : null;
  });

  const [emailLogin, setEmailLogin] = useState("nuno@teste.com");
  const [passwordLogin, setPasswordLogin] = useState("");

  const [coordenadasSelecionadas, setCoordenadasSelecionadas] =
    useState<CoordenadasSelecionadas | null>(null);

  const [formConteudo, setFormConteudo] = useState<FormConteudo>({
    titulo: "",
    descricao: "",
    tipo: "link",
    url_externa: "",
    visibilidade: "publico",
    tags: "",
  });

  const [aObterMetadata, setAObterMetadata] = useState(false);

  const [mensagem, setMensagem] = useState("");

  const [proximidadeLat, setProximidadeLat] = useState("38.7223");
  const [proximidadeLng, setProximidadeLng] = useState("-9.1393");
  const [proximidadeRaio, setProximidadeRaio] = useState("50000");
  const [modoProximidade, setModoProximidade] = useState(false);

  const [filtroSearch, setFiltroSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroTag, setFiltroTag] = useState("");
  const [filtroVisibilidade, setFiltroVisibilidade] = useState("");
  const [filtroEstadoModeracao, setFiltroEstadoModeracao] = useState("");
  const [modoFiltros, setModoFiltros] = useState(false);

  const carregarConteudos = () => {
    const headers: HeadersInit = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    fetch("http://localhost:3000/conteudos", {
      headers,
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setConteudos(data);
        } else {
          console.error("Resposta inesperada da API:", data);
          setConteudos([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setConteudos([]);
      });
  };

  const procurarPorProximidade = async () => {
    setMensagem("");

    const lat = Number(proximidadeLat);
    const lng = Number(proximidadeLng);
    const raio = Number(proximidadeRaio);

    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(raio)) {
      setMensagem("Latitude, longitude e raio devem ser valores numéricos.");
      return;
    }

    if (lat < -90 || lat > 90) {
      setMensagem("A latitude deve estar entre -90 e 90.");
      return;
    }

    if (lng < -180 || lng > 180) {
      setMensagem("A longitude deve estar entre -180 e 180.");
      return;
    }

    if (raio <= 0) {
      setMensagem("O raio deve ser superior a 0.");
      return;
    }

    const headers: HeadersInit = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const resposta = await fetch(
        `http://localhost:3000/conteudos/proximos?lat=${lat}&lng=${lng}&raio=${raio}`,
        {
          headers,
        }
      );

      const data = await resposta.json();

      if (!resposta.ok) {
        setMensagem(data.error || "Erro ao pesquisar por proximidade.");
        return;
      }

      if (Array.isArray(data)) {
        setConteudos(data);
        setModoProximidade(true);
        setMensagem(`Pesquisa por proximidade concluída. Resultados: ${data.length}`);
      } else {
        setMensagem("Resposta inesperada da API.");
      }
    } catch (error) {
      console.error(error);
      setMensagem("Erro de ligação ao servidor.");
    }
  };

  const mostrarTodosConteudos = () => {
    setModoProximidade(false);
    setModoFiltros(false);
    carregarConteudos();
    setMensagem("A apresentar todos os conteúdos disponíveis.");
  };

  const aplicarFiltros = async () => {
    setMensagem("");

    const params = new URLSearchParams();

    if (filtroSearch.trim()) {
      params.append("search", filtroSearch.trim());
    }

    if (filtroTipo) {
      params.append("tipo", filtroTipo);
    }

    if (filtroTag.trim()) {
      params.append("tag", filtroTag.trim().toLowerCase());
    }

    if (utilizador?.tipo_utilizador === "admin" && filtroVisibilidade) {
      params.append("visibilidade", filtroVisibilidade);
    }

    if (utilizador?.tipo_utilizador === "admin" && filtroEstadoModeracao) {
      params.append("estado_moderacao", filtroEstadoModeracao);
    }

    const headers: HeadersInit = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const resposta = await fetch(
        `http://localhost:3000/conteudos?${params.toString()}`,
        {
          headers,
        }
      );

      const data = await resposta.json();

      if (!resposta.ok) {
        setMensagem(data.error || "Erro ao aplicar filtros.");
        return;
      }

      if (Array.isArray(data)) {
        setConteudos(data);
        setModoFiltros(true);
        setModoProximidade(false);
        setMensagem(`Filtros aplicados. Resultados: ${data.length}`);
      } else {
        setMensagem("Resposta inesperada da API.");
      }
    } catch (error) {
      console.error(error);
      setMensagem("Erro de ligação ao servidor.");
    }
  };

  const limparFiltros = () => {
    setFiltroSearch("");
    setFiltroTipo("");
    setFiltroTag("");
    setFiltroVisibilidade("");
    setFiltroEstadoModeracao("");
    setModoFiltros(false);
    setModoProximidade(false);
    carregarConteudos();
    setMensagem("Filtros removidos.");
  };

  useEffect(() => {
    carregarConteudos();
  }, [token]);

  const fazerLogin = async () => {
    setMensagem("");

    try {
      const resposta = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailLogin,
          password: passwordLogin,
        }),
      });

      const data = await resposta.json();

      if (!resposta.ok) {
        setMensagem(data.error || "Erro ao fazer login");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("utilizador", JSON.stringify(data.utilizador));

      setToken(data.token);
      setUtilizador(data.utilizador);
      setMensagem("Login efetuado com sucesso.");
    } catch (error) {
      console.error(error);
      setMensagem("Erro de ligação ao servidor.");
    }
  };

  const fazerLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("utilizador");

    setToken(null);
    setUtilizador(null);
    setMensagem("Logout efetuado.");
  };

  const selecionarLocalizacao = (latlng: CoordenadasSelecionadas) => {
    if (!token) {
      setMensagem("É necessário fazer login para criar conteúdos.");
      return;
    }

    setCoordenadasSelecionadas(latlng);
    setMensagem("Localização selecionada. Preencha o formulário.");
  };

  const obterMetadata = async () => {
    if (!formConteudo.url_externa.trim()) {
      setMensagem("Insere uma URL antes de obter metadados.");
      return;
    }

    try {
      setAObterMetadata(true);
      setMensagem("A obter metadados da página...");

      const resposta = await fetch("http://localhost:3000/metadata/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formConteudo.url_externa.trim(),
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setMensagem(dados.erro || "Erro ao obter metadados.");
        return;
      }

      setFormConteudo({
        ...formConteudo,
        titulo: dados.titulo || formConteudo.titulo,
        descricao: dados.descricao || formConteudo.descricao,
        url_externa: dados.url || formConteudo.url_externa,
      });

      setMensagem("Metadados obtidos com sucesso.");
    } catch (error) {
      console.error("Erro ao obter metadados:", error);
      setMensagem("Erro ao comunicar com o servidor de metadados.");
    } finally {
      setAObterMetadata(false);
    }
  };

  const criarConteudo = async () => {
    setMensagem("");

    if (!token) {
      setMensagem("É necessário fazer login para criar conteúdos.");
      return;
    }

    if (!coordenadasSelecionadas) {
      setMensagem("Selecione uma localização no mapa.");
      return;
    }

    if (!formConteudo.titulo.trim()) {
      setMensagem("O título é obrigatório.");
      return;
    }

    try {
      const resposta = await fetch("http://localhost:3000/conteudos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: formConteudo.titulo,
          descricao: formConteudo.descricao,
          tipo: formConteudo.tipo,
          url_externa: formConteudo.url_externa,
          visibilidade: formConteudo.visibilidade,
          latitude: coordenadasSelecionadas.lat,
          longitude: coordenadasSelecionadas.lng,
          tags: formConteudo.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0),
        }),
      });

      const data = await resposta.json();

      if (!resposta.ok) {
        setMensagem(data.error || "Erro ao criar conteúdo.");
        return;
      }

      setMensagem("Conteúdo criado com sucesso.");

      setFormConteudo({
        titulo: "",
        descricao: "",
        tipo: "link",
        url_externa: "",
        visibilidade: "publico",
        tags: "",
      });

      setCoordenadasSelecionadas(null);
      carregarConteudos();
    } catch (error) {
      console.error(error);
      setMensagem("Erro de ligação ao servidor.");
    }
  };

  const cancelarCriacao = () => {
    setCoordenadasSelecionadas(null);
    setFormConteudo({
      titulo: "",
      descricao: "",
      tipo: "link",
      url_externa: "",
      visibilidade: "publico",
      tags: "",
    });
    setMensagem("Criação cancelada.");
  };

  const moderarConteudo = async (
    id: number,
    estado: "aprovado" | "rejeitado"
  ) => {
    setMensagem("");

    if (!token) {
      setMensagem("É necessário estar autenticado.");
      return;
    }

    if (utilizador?.tipo_utilizador !== "admin") {
      setMensagem("Apenas administradores podem moderar conteúdos.");
      return;
    }

    try {
      const resposta = await fetch(
        `http://localhost:3000/conteudos/${id}/moderacao`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            estado_moderacao: estado,
          }),
        }
      );

      const data = await resposta.json();

      if (!resposta.ok) {
        setMensagem(data.error || "Erro ao moderar conteúdo.");
        return;
      }

      setMensagem(`Conteúdo ${estado} com sucesso.`);
      carregarConteudos();
    } catch (error) {
      console.error(error);
      setMensagem("Erro de ligação ao servidor.");
    }
  };

  const estilos = {
    pagina: {
      display: "flex",
      height: "100vh",
      width: "100vw",
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f4f6f8",
    } as React.CSSProperties,

    painel: {
      width: "360px",
      padding: "16px",
      backgroundColor: "#ffffff",
      borderRight: "1px solid #ddd",
      overflowY: "auto",
      boxShadow: "2px 0 6px rgba(0,0,0,0.08)",
      zIndex: 1000,
    } as React.CSSProperties,

    mapa: {
      flex: 1,
      height: "100vh",
    } as React.CSSProperties,

    titulo: {
      marginTop: 0,
      marginBottom: "8px",
      color: "#1f2937",
    } as React.CSSProperties,

    subtitulo: {
      marginTop: "20px",
      marginBottom: "8px",
      color: "#374151",
      borderBottom: "1px solid #e5e7eb",
      paddingBottom: "4px",
    } as React.CSSProperties,

    input: {
      width: "100%",
      padding: "8px",
      marginBottom: "8px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      boxSizing: "border-box",
      backgroundColor: "#ffffff",
      color: "#111827",
    } as React.CSSProperties,

    botao: {
      width: "100%",
      padding: "8px",
      marginBottom: "8px",
      border: "none",
      borderRadius: "4px",
      backgroundColor: "#2563eb",
      color: "#ffffff",
      cursor: "pointer",
      fontWeight: "bold",
    } as React.CSSProperties,

    botaoSecundario: {
      width: "100%",
      padding: "8px",
      marginBottom: "8px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      backgroundColor: "#f9fafb",
      color: "#111827",
      cursor: "pointer",
    } as React.CSSProperties,

    botaoPerigo: {
      padding: "6px 8px",
      marginRight: "6px",
      border: "none",
      borderRadius: "4px",
      backgroundColor: "#dc2626",
      color: "#ffffff",
      cursor: "pointer",
    } as React.CSSProperties,

    botaoSucesso: {
      padding: "6px 8px",
      marginRight: "6px",
      border: "none",
      borderRadius: "4px",
      backgroundColor: "#16a34a",
      color: "#ffffff",
      cursor: "pointer",
    } as React.CSSProperties,

    mensagem: {
      padding: "8px",
      marginBottom: "12px",
      backgroundColor: "#eef2ff",
      border: "1px solid #c7d2fe",
      borderRadius: "4px",
      fontSize: "14px",
    } as React.CSSProperties,

    cartao: {
      padding: "10px",
      marginBottom: "10px",
      backgroundColor: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: "6px",
    } as React.CSSProperties,

    badge: {
      display: "inline-block",
      padding: "2px 6px",
      marginLeft: "4px",
      borderRadius: "999px",
      fontSize: "12px",
      backgroundColor: "#e5e7eb",
      color: "#374151",
    } as React.CSSProperties,
  };

  return (
    <div style={estilos.pagina}>
      <div style={estilos.painel}>
        <h2 style={estilos.titulo}>GeoContent</h2>

        <p style={{ marginTop: 0, color: "#6b7280", fontSize: "14px" }}>
          Plataforma interativa de conteúdos georreferenciados.
        </p>

        {mensagem && <div style={estilos.mensagem}>{mensagem}</div>}

        {!utilizador ? (
          <div>
            <h3 style={estilos.subtitulo}>Login</h3>

            <label>Email</label>
            <input
              type="email"
              value={emailLogin}
              onChange={(e) => setEmailLogin(e.target.value)}
              style={estilos.input}
            />

            <label>Password</label>
            <input
              type="password"
              value={passwordLogin}
              onChange={(e) => setPasswordLogin(e.target.value)}
              style={estilos.input}
            />

            <button onClick={fazerLogin} style={estilos.botao}>
              Entrar
            </button>
          </div>
        ) : (
          <div>
            <p>
              Autenticado como:
              <br />
              <strong>{utilizador.nome}</strong>
              <br />
              {utilizador.email}
            </p>

              <button onClick={fazerLogout} style={estilos.botaoSecundario}>
              Terminar sessão
            </button>
          </div>
        )}

        <hr />

        <h3 style={estilos.subtitulo}>Criar conteúdo</h3>

        {!utilizador && (
          <p>Faça login para criar conteúdos georreferenciados.</p>
        )}

        {utilizador && !coordenadasSelecionadas && (
          <p>Clique no mapa para selecionar uma localização.</p>
        )}

        {utilizador && coordenadasSelecionadas && (
          <div>
            <p>
              Localização selecionada:
              <br />
              Lat: {coordenadasSelecionadas.lat.toFixed(6)}
              <br />
              Lng: {coordenadasSelecionadas.lng.toFixed(6)}
            </p>

            <label>Título *</label>
            <input
              type="text"
              value={formConteudo.titulo}
              onChange={(e) =>
                setFormConteudo({
                  ...formConteudo,
                  titulo: e.target.value,
                })
              }
              style={estilos.input}
            />

            <label>Descrição</label>
            <textarea
              value={formConteudo.descricao}
              onChange={(e) =>
                setFormConteudo({
                  ...formConteudo,
                  descricao: e.target.value,
                })
              }
              style={{
                ...estilos.input,
                minHeight: "70px",
                resize: "vertical",
              }}
            />

            <label>Tipo</label>
            <select
              value={formConteudo.tipo}
              onChange={(e) =>
                setFormConteudo({
                  ...formConteudo,
                  tipo: e.target.value,
                })
              }
              style={estilos.input}
            >
              <option value="link">Link</option>
              <option value="texto">Texto</option>
              <option value="imagem">Imagem</option>
              <option value="video">Vídeo</option>
            </select>

            <label>URL externa</label>
            <input
              type="text"
              value={formConteudo.url_externa}
              onChange={(e) =>
                setFormConteudo({
                  ...formConteudo,
                  url_externa: e.target.value,
                })
              }
              style={estilos.input}
            />

            <button
              onClick={obterMetadata}
              disabled={aObterMetadata || !formConteudo.url_externa.trim()}
              style={estilos.botao}
            >
              {aObterMetadata ? "A obter metadados..." : "Obter metadados"}
            </button>

            <label>Visibilidade</label>
            <select
              value={formConteudo.visibilidade}
              onChange={(e) =>
                setFormConteudo({
                  ...formConteudo,
                  visibilidade: e.target.value as "publico" | "privado",
                })
              }
              style={estilos.input}
            >
              <option value="publico">Público</option>
              <option value="privado">Privado</option>
            </select>

            <label>Tags</label>
            <input
              type="text"
              value={formConteudo.tags}
              onChange={(e) =>
                setFormConteudo({
                  ...formConteudo,
                  tags: e.target.value,
                })
              }
              placeholder="Ex: turismo, lisboa, história"
              style={estilos.input}
            />

            <button onClick={criarConteudo} style={estilos.botao}>
              Guardar conteúdo
            </button>

            <button
              onClick={cancelarCriacao}
              style={estilos.botaoSecundario}
            >
              Cancelar
            </button>
          </div>
        )}

        {utilizador?.tipo_utilizador === "admin" && (
          <>
            <hr />

            <h3 style={estilos.subtitulo}>Moderação</h3>

            {conteudos.filter((c) => c.estado_moderacao === "pendente").length === 0 ? (
              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                Não existem conteúdos pendentes.
              </p>
            ) : (
              conteudos
                .filter((c) => c.estado_moderacao === "pendente")
                .map((c) => (
                  <div key={c.id} style={estilos.cartao}>
                    <strong>{c.titulo}</strong>
                    <span style={estilos.badge}>Pendente</span>

                    <p style={{ margin: "6px 0", fontSize: "14px" }}>
                      {c.descricao || "Sem descrição"}
                    </p>

                    <small>
                      Tipo: {c.tipo || "N/A"} | Visibilidade: {c.visibilidade}
                    </small>

                    {c.tags && c.tags.length > 0 && (
                      <>
                        <br />
                        <small>Tags: {c.tags.join(", ")}</small>
                      </>
                    )}

                    <div style={{ marginTop: "8px" }}>
                      <button
                        onClick={() => moderarConteudo(c.id, "aprovado")}
                        style={estilos.botaoSucesso}
                      >
                        Aprovar
                      </button>

                      <button
                        onClick={() => moderarConteudo(c.id, "rejeitado")}
                        style={estilos.botaoPerigo}
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))
            )}
          </>
        )}
        
        <hr />

        <h3 style={estilos.subtitulo}>Pesquisa e filtros</h3>

        <label>Pesquisar</label>
        <input
          type="text"
          value={filtroSearch}
          onChange={(e) => setFiltroSearch(e.target.value)}
          placeholder="Título ou descrição"
          style={estilos.input}
        />

        <label>Tipo</label>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          style={estilos.input}
        >
          <option value="">Todos</option>
          <option value="link">Link</option>
          <option value="texto">Texto</option>
          <option value="imagem">Imagem</option>
          <option value="video">Vídeo</option>
        </select>

        <label>Tag</label>
        <input
          type="text"
          value={filtroTag}
          onChange={(e) => setFiltroTag(e.target.value)}
          placeholder="Ex: turismo"
          style={estilos.input}
        />

        {utilizador?.tipo_utilizador === "admin" && (
          <>
            <label>Visibilidade</label>
            <select
              value={filtroVisibilidade}
              onChange={(e) => setFiltroVisibilidade(e.target.value)}
              style={estilos.input}
            >
              <option value="">Todas</option>
              <option value="publico">Público</option>
              <option value="privado">Privado</option>
            </select>

            <label>Estado de moderação</label>
            <select
              value={filtroEstadoModeracao}
              onChange={(e) => setFiltroEstadoModeracao(e.target.value)}
              style={estilos.input}
            >
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="rejeitado">Rejeitado</option>
            </select>
          </>
        )}

        <button onClick={aplicarFiltros} style={estilos.botao}>
          Aplicar filtros
        </button>

        {modoFiltros && (
          <button
            onClick={limparFiltros}
            style={estilos.botaoSecundario}
          >
            Limpar filtros
          </button>
        )}

        <hr />

        <h3 style={estilos.subtitulo}>Pesquisa por proximidade</h3>

        <label>Latitude</label>
        <input
          type="text"
          value={proximidadeLat}
          onChange={(e) => setProximidadeLat(e.target.value)}
          style={estilos.input}
        />

        <label>Longitude</label>
        <input
          type="text"
          value={proximidadeLng}
          onChange={(e) => setProximidadeLng(e.target.value)}
          style={estilos.input}
        />

        <label>Raio em metros</label>
        <input
          type="text"
          value={proximidadeRaio}
          onChange={(e) => setProximidadeRaio(e.target.value)}
          style={estilos.input}
        />

        <button onClick={procurarPorProximidade} style={estilos.botao}>
          Procurar próximos
        </button>

        {modoProximidade && (
          <button
            onClick={mostrarTodosConteudos}
            style={estilos.botaoSecundario}
          >
            Mostrar todos
          </button>
        )}

        <hr />

        <h3 style={estilos.subtitulo}>Conteúdos carregados</h3>
        <p>Total: {conteudos.length}</p>
      </div>

      <div style={{ flex: 1 }}>
        <MapContainer
          center={[39.5, -8]}
          zoom={6}
          style={estilos.mapa}
        >
          <ClickHandler onClick={selecionarLocalizacao} />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {conteudos.map((c) => (
            <Marker key={c.id} position={[c.latitude, c.longitude]}>
              <Popup>
                <strong>{c.titulo}</strong>
                <br />
                {c.descricao || "Sem descrição"}
                <br />
                <small>Visibilidade: {c.visibilidade}</small>
                <br />
                <small>Estado: {c.estado_moderacao}</small>

                {c.tags && c.tags.length > 0 && (
                  <>
                    <br />
                    <small>Tags: {c.tags.join(", ")}</small>
                  </>
                )}

                {typeof c.distancia_metros === "number" && (
                  <>
                    <br />
                    <small>
                      Distância: {Math.round(c.distancia_metros)} metros
                    </small>
                  </>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;