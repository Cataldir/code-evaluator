@description('Configuration for the App Service plan hosting compute.')
type AppServicePlanConfig = {
  name: string
  sku: {
    name: string
    tier: string
    capacity: int
  }
  kind: string
  zoneRedundant: bool
  perSiteScaling: bool
  reserved: bool
  tags: object
}

@description('Location for the App Service plan.')
param location string

@description('Settings for the App Service plan.')
param config AppServicePlanConfig

resource serverFarm 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: config.name
  location: location
  kind: config.kind
  tags: config.tags
  sku: config.sku
  properties: {
    perSiteScaling: config.perSiteScaling
    reserved: config.reserved
    maximumElasticWorkerCount: 1
    isSpot: false
    isXenon: false
    hyperV: false
    zoneRedundant: config.zoneRedundant
  }
}

output id string = serverFarm.id
