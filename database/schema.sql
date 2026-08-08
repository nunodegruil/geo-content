-- Base de dados: geo_content
-- Sistema: PostgreSQL + PostGIS

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE utilizadores (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    palavra_passe TEXT,
    tipo_utilizador TEXT DEFAULT 'comum',
    data_registo TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE localizacoes (
    id SERIAL PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOGRAPHY(POINT, 4326) NOT NULL,
    morada_opcional TEXT
);

CREATE INDEX idx_localizacoes_geom
ON localizacoes
USING GIST (geom);

CREATE TABLE conteudos (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT,
    url_externa TEXT,
    visibilidade TEXT DEFAULT 'publico',
    estado_moderacao TEXT DEFAULT 'pendente',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_moderacao TIMESTAMP,
    id_utilizador INTEGER REFERENCES utilizadores(id),
    id_localizacao INTEGER REFERENCES localizacoes(id)
);

CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL
);

CREATE TABLE conteudo_tags (
    id_conteudo INTEGER NOT NULL REFERENCES conteudos(id) ON DELETE CASCADE,
    id_tag INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (id_conteudo, id_tag)
);