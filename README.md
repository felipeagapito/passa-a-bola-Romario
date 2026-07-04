# SAEL Copa Intelligence — Auto Update v0.2

Dashboard estático da Copa do Mundo com atualização diária via GitHub Actions e publicação via GitHub Pages.

## O que este projeto faz

- Publica um link acessível por amigos via GitHub Pages.
- Roda um robô diário pelo GitHub Actions.
- Atualiza `data/copa.json` antes do deploy.
- Usa API-Football/API-Sports se `API_FOOTBALL_KEY` estiver configurada.
- Se a chave não estiver configurada, mantém o seed local e publica normalmente.

## Estrutura

```txt
.
├── index.html
├── styles.css
├── app.js
├── data/copa.json
├── scripts/update_data.py
├── requirements.txt
├── .nojekyll
└── .github/workflows/daily-update-and-deploy.yml
```

## Como publicar pelo celular

1. Crie um repositório no GitHub, por exemplo: `sael-copa-intelligence`.
2. Envie todos os arquivos deste ZIP para o repositório.
3. Entre em **Settings > Pages**.
4. Em **Build and deployment**, selecione **GitHub Actions**.
5. Entre em **Actions** e rode manualmente `Daily Copa Intelligence Update & Deploy` pela primeira vez.
6. O GitHub vai gerar um link parecido com:

```txt
https://SEU_USUARIO.github.io/sael-copa-intelligence/
```

## Como ativar atualização real por API

1. Crie uma conta gratuita em API-Football/API-Sports.
2. Copie sua API key.
3. No GitHub, vá em **Settings > Secrets and variables > Actions**.
4. Em **Secrets**, crie:

```txt
API_FOOTBALL_KEY = sua_chave_aqui
```

5. Em **Variables**, crie:

```txt
API_FOOTBALL_LEAGUE_ID = 1
API_FOOTBALL_SEASON = 2026
```

> Observação: confirme no painel/documentação da API se o `league_id` da Copa do Mundo 2026 é o mesmo na sua conta/cobertura. O script está pronto para trocar esse valor sem mexer no código.

## Frequência

O workflow está configurado para rodar todos os dias às 09:00 no fuso `America/Sao_Paulo`.

```yaml
schedule:
  - cron: '0 9 * * *'
    timezone: 'America/Sao_Paulo'
```

## Segurança

- A API key fica no GitHub Secret.
- A chave não aparece no navegador.
- O site publicado no GitHub Pages é público para quem tiver o link.
- Não use este projeto para dados sensíveis.

## Próximas melhorias sugeridas

- Página de senha simples para validação fechada com amigos.
- Histórico diário do Power Index.
- Export automático para carrossel.
- Integração com Vercel Cron se quiser evoluir para app Next.js.
- Estatísticas avançadas: posse, finalizações, xG, cartões, lesões e forma recente.
