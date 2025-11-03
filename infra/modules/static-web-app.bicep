@description('Deployment settings for the Azure Static Web App.')
type StaticWebAppConfig = {
  name: string
  location: string
  sku: {
    name: string
    tier: string
  }
  repositoryUrl: string
  branch: string
  build: {
    appLocation: string
    apiLocation: string
    outputLocation: string
  }
  tags: object
}

@description('Configuration for the Azure Static Web App.')
param config StaticWebAppConfig

@secure()
@description('GitHub token used for linking the repository to the static web app build pipeline.')
param repositoryToken string

resource staticSite 'Microsoft.Web/staticSites@2022-09-01' = {
  name: config.name
  location: config.location
  sku: config.sku
  tags: config.tags
  properties: {
    repositoryUrl: config.repositoryUrl
    branch: config.branch
    repositoryToken: repositoryToken
    buildProperties: {
      appLocation: config.build.appLocation
      apiLocation: config.build.apiLocation
      outputLocation: config.build.outputLocation
    }
  }
}

output id string = staticSite.id
output defaultHostname string = staticSite.properties.defaultHostname
