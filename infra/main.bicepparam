using './main.bicep'

// Update the values below before deploying. Secrets such as repository tokens should
// be supplied securely via deployment parameters or Azure Key Vault references.

param staticWebAppRepositoryToken = 'REPLACE_WITH_GITHUB_TOKEN'

param staticWebAppRepositoryUrl = 'https://github.com/<org>/<repo>'

param appServiceSettings = [
  {
    name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
    value: ''
  }
]
