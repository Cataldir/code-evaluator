# code-evaluator

Full-stack platform for orchestrating code-quality evaluations across GitHub repositories.

## Project layout

- `src/backend/`: FastAPI backend integrated with Azure Cosmos DB and Azure AI Foundry agents.
- `src/frontend/`: Next.js 14 UI (App Router) with Tailwind CSS and an atomic component structure.
- `infra/`: Bicep templates for provisioning the Azure infrastructure footprint.

## Backend (FastAPI + uv)

1. Install [uv](https://github.com/astral-sh/uv) and Python 3.13.
1. Copy `src/backend/.env` and adjust the values for your environment:

```env
COSMOS_ENDPOINT=... # Cosmos DB SQL endpoint
COSMOS_DATABASE=code-evaluator
COSMOS_CHALLENGES_CONTAINER=challenges
COSMOS_CRITERIA_CONTAINER=criteria
COSMOS_REPOSITORIES_CONTAINER=repositories
COSMOS_EVALUATIONS_CONTAINER=evaluations
AZURE_AI_ENDPOINT=...
AZURE_AI_PROJECT_NAME=code-evaluator-project
AZURE_AI_AGENT_NAME=code-quality-agent
GITHUB_TOKEN=... # optional, improves GitHub rate limits
```

1. Install dependencies and run the API:

```powershell
cd src/backend
uv sync --all-extras --dev
uv run uvicorn app.main:app --reload
```

## Frontend (Next.js + Tailwind)

1. Install Node.js 20+.
1. Install dependencies and start the dev server:

```powershell
cd src/frontend
npm install
npm run dev
```

1. Ensure `NEXT_PUBLIC_API_BASE_URL` points to the backend (create `.env.local` in `src/frontend` if needed).

## Key features

- Challenge management with dynamic evaluation criteria and repository mapping.
- Live ranking dashboard polling the backend for evaluation progress.
- Azure AI agent integration using repository snapshots (download + unzip) during evaluations.

## GitHub Actions: backend image publishing

The workflow in `.github/workflows/publish-backend-image.yml` builds the backend Docker image and pushes it to `codevaluator.azurecr.io`. Prepare the Azure credentials once before enabling the workflow.

### 1. Sign in

Run `az login` and verify you have `AcrPush` rights on the target registry.

### 2. Create (or reuse) the service principal

```powershell
az ad sp create-for-rbac `
  --name code-publisher `
  --role AcrPush `
  --scopes /subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.ContainerRegistry/registries/codevaluator
```

Note the `appId`, `tenant`, and `subscriptionId` values in the output. Azure reuses the app if it already exists.

### 3. Add a short-lived credential

```powershell
az ad app credential reset `
  --id <appId> `
  --append `
  --display-name gha-acr `
  --end-date 2025-12-01T00:00:00Z `
  -o json
```

The JSON response contains `password`, which becomes the client secret.

### 4. Store the GitHub secret

Create (or update) the repository secret `AZURE_CREDENTIALS` using:

```json
{
  "clientId": "<appId>",
  "clientSecret": "<password>",
  "subscriptionId": "<subscription-id>",
  "tenantId": "<tenant>"
}
```

Rotate the secret before the `end-date` is reached.

### 5. Optional validation

Authenticate to the registry (`az acr login --name codevaluator`) and run `scripts/publish_backend_image.sh` to confirm the image builds and pushes successfully.

## Infrastructure as Code (Bicep)

The `infra/` folder contains composable Bicep modules plus an orchestrating `main.bicep` template that provisions the Azure resources shown in the reference architecture:

- Linux App Service plan and App Service for the FastAPI backend (system + user-assigned managed identity).
- Azure Static Web App for the Next.js frontend (GitHub repository integration via parameters).
- Azure Cosmos DB account with an optional secondary region (failover priority configurable).
- Azure AI Foundry account + project for working with evaluation agents.
- Azure Container Registry for artefacts and build images.
- User-assigned managed identity shared across services.

### Deploy

```powershell
cd infra
az deployment group create `
  --resource-group <resource-group-name> `
  --template-file main.bicep `
  --parameters @main.bicepparam `
  --parameters staticWebAppRepositoryToken=<GitHub_PAT_or_federated_token>
```

Update `main.bicepparam` (and override parameters at deploy time as needed) before running the deployment. Avoid committing real secrets—the sample parameter file ships with placeholders only.
