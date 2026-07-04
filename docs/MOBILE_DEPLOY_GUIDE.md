# Guia rápido pelo celular

## 1. Ativar GitHub Pages

1. Abra o repositório no navegador do celular.
2. Vá em **Settings > Pages**.
3. Em **Build and deployment**, selecione **GitHub Actions**.
4. Salve.

## 2. Configurar API opcional

1. Vá em **Settings > Secrets and variables > Actions**.
2. Em **Secrets**, crie `API_FOOTBALL_KEY`.
3. Em **Variables**, crie:
   - `API_FOOTBALL_LEAGUE_ID`
   - `API_FOOTBALL_SEASON`

## 3. Rodar manualmente

1. Vá em **Actions**.
2. Abra `Daily Copa Intelligence Update & Deploy`.
3. Toque em **Run workflow**.
4. Aguarde o deploy.
5. O link aparecerá no resumo do workflow e em **Settings > Pages**.

## Observação

Sem API key, o site ainda publica normalmente usando o seed local.
