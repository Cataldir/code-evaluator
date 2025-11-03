targetScope = 'resourceGroup'

@description('Primary location for regional resources.')
param location string = resourceGroup().location

@description('Secondary region for geo-redundant services (Cosmos DB failover).')
param secondaryLocation string = 'westus2'

@description('Global tags applied across deployed resources.')
param globalTags object = {
  project: 'code-evaluator'
}

type NameValuePair = {
  name: string
  value: string
}

@description('Resource names for the deployment.')
type ResourceNames = {
  appServicePlan: string
  appService: string
  staticWebApp: string
  cosmosAccount: string
  aiFoundryAccount: string
  aiFoundryProject: string
  containerRegistry: string
  userAssignedIdentity: string
}

@description('Override resource names if needed.')
param names ResourceNames = {
  appServicePlan: 'ASP-nextcodeevaluator-aaf1'
  appService: 'code-evaluator-project'
  staticWebApp: 'code-evaluator-project-ui'
  cosmosAccount: 'code-evaluator'
  aiFoundryAccount: 'code-evaluator-project'
  aiFoundryProject: 'code-evaluator-project'
  containerRegistry: 'codeevaluator'
  userAssignedIdentity: 'ua-id-84ea'
}

@description('App Service runtime stack (LinuxFx string).')
param appServiceLinuxFxVersion string = 'PYTHON|3.13'

@description('Windows runtime (leave empty when deploying Linux).')
param appServiceWindowsFxVersion string = ''

@description('App settings injected into the App Service.')
param appServiceSettings NameValuePair[] = []

@description('Static Web App repository URL (GitHub).')
param staticWebAppRepositoryUrl string = 'https://github.com/<org>/<repo>'

@description('Branch used for the static web app build pipeline.')
param staticWebAppBranch string = 'main'

@secure()
@description('GitHub token used to link the static web app build pipeline.')
param staticWebAppRepositoryToken string

// User-assigned managed identity
module managedIdentity './modules/user-assigned-identity.bicep' = {
  params: {
    config: {
      name: names.userAssignedIdentity
      location: location
      tags: globalTags
    }
  }
}

var userAssignedIdentityMap = {
  '${managedIdentity.outputs.id}': {}
}

// App Service plan
module appServicePlan './modules/app-service-plan.bicep' = {
  params: {
    location: location
    config: {
      name: names.appServicePlan
      kind: 'linux'
      perSiteScaling: false
      reserved: true
      zoneRedundant: false
      tags: globalTags
      sku: {
        name: 'P1v3'
        tier: 'PremiumV3'
        capacity: 1
      }
    }
  }
}

// App Service hosting the backend API
module appService './modules/app-service.bicep' = {
  params: {
    location: location
    config: {
      name: names.appService
      kind: 'app,linux'
      serverFarmId: appServicePlan.outputs.id
      httpsOnly: true
      alwaysOn: true
      linuxFxVersion: appServiceLinuxFxVersion
      windowsFxVersion: appServiceWindowsFxVersion
      appSettings: appServiceSettings
      identity: {
        type: 'SystemAssigned, UserAssigned'
        userAssignedIdentities: userAssignedIdentityMap
      }
      tags: globalTags
    }
  }
}

// Azure Static Web App for the frontend
module staticWebApp './modules/static-web-app.bicep' = {
  params: {
    config: {
      name: names.staticWebApp
      location: location
      sku: {
        name: 'Standard'
        tier: 'Standard'
      }
      repositoryUrl: staticWebAppRepositoryUrl
      branch: staticWebAppBranch
      build: {
        appLocation: '/'
        apiLocation: ''
        outputLocation: 'dist'
      }
      tags: globalTags
    }
    repositoryToken: staticWebAppRepositoryToken
  }
}

// Azure Cosmos DB account
module cosmosAccount './modules/cosmos-account.bicep' = {
  params: {
    config: {
      name: names.cosmosAccount
      kind: 'GlobalDocumentDB'
      publicNetworkAccess: 'Enabled'
      enableFreeTier: false
      enableAnalyticalStorage: false
      enableServerless: true
      defaultConsistencyLevel: 'Session'
      maxStalenessPrefix: 100000
      maxIntervalInSeconds: 5
      locations: [
        {
          locationName: location
          failoverPriority: 0
          isZoneRedundant: false
        }
        {
          locationName: secondaryLocation
          failoverPriority: 1
          isZoneRedundant: false
        }
      ]
      tags: globalTags
    }
  }
}

// Azure Container Registry
module containerRegistry './modules/container-registry.bicep' = {
  params: {
    config: {
      name: names.containerRegistry
      location: location
      sku: 'Standard'
      adminUserEnabled: false
      retentionPolicyInDays: 7
      tags: globalTags
    }
  }
}

// Azure AI Foundry account
module aiFoundryAccount './modules/ai-foundry-account.bicep' = {
  params: {
    config: {
      name: names.aiFoundryAccount
      location: location
      skuName: 'S0'
      publicNetworkAccess: 'Enabled'
      disableLocalAuth: true
      tags: globalTags
    }
  }
}

// Azure AI Foundry project
module aiFoundryProject './modules/ai-foundry-project.bicep' = {
  params: {
    accountName: names.aiFoundryAccount
    accountLocation: location
    config: {
      name: names.aiFoundryProject
      displayName: 'Code Evaluator Project'
      description: 'AI Foundry project powering automated code evaluations.'
      tags: globalTags
    }
  }
}

output backendAppServiceId string = appService.outputs.id
output staticWebAppHost string = staticWebApp.outputs.defaultHostname
output cosmosAccountEndpoint string = cosmosAccount.outputs.endpoint
output containerRegistryLogin string = containerRegistry.outputs.loginServer
output aiFoundryEndpoint string = aiFoundryAccount.outputs.endpoint
output userAssignedIdentityClientId string = managedIdentity.outputs.clientId
output aiFoundryProjectId string = aiFoundryProject.outputs.id
