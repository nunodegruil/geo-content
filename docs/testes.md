# Testes Manuais do Sistema

Este documento apresenta os testes manuais realizados à plataforma interativa de conteúdos georreferenciados.  
Os testes têm como objetivo validar as principais funcionalidades implementadas, incluindo autenticação, permissões, criação de conteúdos, moderação, pesquisa, tags, consulta por proximidade e extração de metadados externos.

## Ambiente de Teste

| Elemento | Valor |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Frontend | React + TypeScript + Vite |
| Base de dados | PostgreSQL + PostGIS |
| Ferramenta de testes API | Thunder Client |
| URL backend | http://localhost:3000 |
| URL frontend | http://localhost:5173 |

## Utilizadores de Teste

| Utilizador | Email | Tipo |
|---|---|---|
| Nuno Almeida | nuno@teste.com | Administrador |
| Outro Utilizador | outro@teste.com | Utilizador comum |

## Casos de Teste

| Nº | Funcionalidade | Ação realizada | Resultado esperado | Resultado obtido | Estado |
|---|---|---|---|---|---|
| 1 | Autenticação | Login com email e palavra-passe válidos | O sistema devolve um token JWT e os dados do utilizador | O token foi devolvido corretamente | Aprovado |
| 2 | Autenticação | Login com palavra-passe incorreta | O sistema rejeita o login | Foi devolvido erro 401 | Aprovado |
| 3 | Registo | Registo de novo utilizador com dados válidos | O utilizador é criado na base de dados | O utilizador foi criado corretamente | Aprovado |
| 4 | Registo | Registo com email já existente | O sistema impede duplicação de email | Foi devolvido erro de email já existente | Aprovado |
| 5 | Criação de conteúdo | Criar conteúdo autenticado no backend | O conteúdo é criado associado ao utilizador autenticado | O conteúdo foi criado com id_utilizador correto | Aprovado |
| 6 | Criação de conteúdo | Criar conteúdo sem token | O sistema bloqueia a criação | Foi devolvido erro 401 | Aprovado |
| 7 | Permissões | Aceder sem login aos conteúdos | Apenas conteúdos públicos e aprovados são apresentados | Conteúdos privados/pendentes não aparecem | Aprovado |
| 8 | Permissões | Aceder como utilizador comum | O utilizador vê conteúdos públicos aprovados e os seus próprios conteúdos | Permissões aplicadas corretamente | Aprovado |
| 9 | Permissões | Aceder como administrador | O administrador vê todos os conteúdos | Todos os conteúdos foram apresentados | Aprovado |
| 10 | Moderação | Criar novo conteúdo | O conteúdo deve ficar pendente | O conteúdo ficou com estado pendente | Aprovado |
| 11 | Moderação | Aprovar conteúdo como administrador | O conteúdo passa a aprovado | O estado foi atualizado corretamente | Aprovado |
| 12 | Moderação | Rejeitar conteúdo como administrador | O conteúdo passa a rejeitado | O estado foi atualizado corretamente | Aprovado |
| 13 | Moderação | Tentar moderar como utilizador comum | O sistema bloqueia a operação | Foi devolvido erro 403 | Aprovado |
| 14 | Pesquisa por proximidade | Pesquisar conteúdos num raio definido | O sistema devolve conteúdos dentro do raio indicado | Os conteúdos próximos foram apresentados | Aprovado |
| 15 | Filtros | Filtrar conteúdos por texto | O sistema devolve conteúdos cujo título ou descrição correspondem à pesquisa | O filtro funcionou corretamente | Aprovado |
| 16 | Filtros | Filtrar conteúdos por tipo | O sistema devolve apenas conteúdos do tipo selecionado | O filtro funcionou corretamente | Aprovado |
| 17 | Filtros | Filtrar conteúdos por visibilidade como administrador | O sistema devolve conteúdos públicos ou privados conforme o filtro | O filtro funcionou corretamente | Aprovado |
| 18 | Filtros | Filtrar conteúdos por estado de moderação como administrador | O sistema devolve conteúdos pendentes, aprovados ou rejeitados | O filtro funcionou corretamente | Aprovado |
| 19 | Tags | Criar conteúdo com tags | As tags são criadas/associadas ao conteúdo | As tags foram guardadas corretamente | Aprovado |
| 20 | Tags | Consultar conteúdos com tags | O sistema devolve o array de tags associado ao conteúdo | As tags foram devolvidas corretamente | Aprovado |
| 21 | Tags | Filtrar por tag | O sistema devolve apenas conteúdos associados à tag indicada | O filtro por tag funcionou corretamente | Aprovado |
| 22 | Metadados externos | Obter metadados de URL válida | O sistema devolve título, descrição e imagem quando disponíveis | Os metadados foram devolvidos corretamente | Aprovado |
| 23 | Metadados externos | Obter metadados de URL inválida | O sistema rejeita a URL | Foi devolvido erro 400 | Aprovado |
| 24 | Frontend | Criar conteúdo através do mapa | O formulário permite criar conteúdo na localização selecionada | O conteúdo foi criado corretamente | Aprovado |
| 25 | Frontend | Visualizar tags no popup | O popup mostra as tags associadas ao conteúdo | As tags apareceram corretamente | Aprovado |
| 26 | Frontend | Aplicar filtros na interface | A lista/mapa é atualizada conforme os filtros escolhidos | Os filtros funcionaram corretamente | Aprovado |
| 27 | Frontend | Obter metadados através do botão | O título e descrição são preenchidos automaticamente | O preenchimento automático funcionou corretamente | Aprovado |

## Testes de API Realizados

Além dos testes funcionais gerais, foram também realizados testes diretos à API através do Thunder Client.

| Método | Endpoint | Objetivo | Resultado esperado | Estado |
|---|---|---|---|---|
| POST | /auth/login | Autenticar utilizador | Devolve token JWT | Aprovado |
| POST | /auth/register | Criar novo utilizador | Regista utilizador na base de dados | Aprovado |
| GET | /conteudos | Listar conteúdos disponíveis | Devolve conteúdos conforme permissões | Aprovado |
| POST | /conteudos | Criar conteúdo autenticado | Cria conteúdo associado ao utilizador | Aprovado |
| GET | /conteudos?tag=turismo | Filtrar conteúdos por tag | Devolve apenas conteúdos com a tag indicada | Aprovado |
| GET | /conteudos?search=... | Filtrar conteúdos por texto | Devolve conteúdos correspondentes à pesquisa | Aprovado |
| GET | /conteudos/proximos | Consultar conteúdos próximos | Devolve conteúdos dentro do raio indicado | Aprovado |
| PATCH | /conteudos/:id/moderacao | Alterar estado de moderação | Atualiza conteúdo como aprovado/rejeitado/pendente | Aprovado |
| POST | /metadata/preview | Obter metadados externos | Devolve título, descrição e imagem da página | Aprovado |

## Observações dos Testes

Durante os testes foram verificados cenários de sucesso e de erro, incluindo credenciais inválidas, ausência de token, tentativa de moderação por utilizador comum, criação de conteúdos pendentes e validação de URLs inválidas na extração de metadados.

Os testes permitiram confirmar que as regras principais de segurança e autorização foram corretamente aplicadas.

## Conclusão dos Testes

Os testes realizados permitiram validar as principais funcionalidades da aplicação.  
O sistema demonstrou capacidade para gerir utilizadores autenticados, associar conteúdos aos respetivos autores, aplicar regras de visibilidade, permitir moderação por administradores, pesquisar conteúdos por filtros e proximidade geográfica, gerir tags e obter metadados externos a partir de URLs.

Todos os testes funcionais principais foram concluídos com sucesso.