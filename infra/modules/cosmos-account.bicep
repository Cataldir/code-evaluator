@description('Location entry for the Cosmos DB account.')
type CosmosLocation = {
  locationName: string
  failoverPriority: int
  isZoneRedundant: bool
}

@description('Configuration for the Cosmos DB database account.')
type CosmosAccountConfig = {
  name: string
  kind: string
  publicNetworkAccess: 'Enabled' | 'Disabled'
  enableFreeTier: bool
  enableAnalyticalStorage: bool
  enableServerless: bool
  defaultConsistencyLevel: 'Eventual' | 'Session' | 'BoundedStaleness' | 'Strong' | 'ConsistentPrefix'
  maxStalenessPrefix: int
  maxIntervalInSeconds: int
  locations: CosmosLocation[]
  tags: object
}

@description('Cosmos DB account configuration.')
param config CosmosAccountConfig

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: config.name
  kind: config.kind
  location: config.locations[0].locationName
  tags: config.tags
  properties: {
    databaseAccountOfferType: 'Standard'
    enableAnalyticalStorage: config.enableAnalyticalStorage
    enableFreeTier: config.enableFreeTier
    publicNetworkAccess: config.publicNetworkAccess
    capabilities: config.enableServerless ? [
      {
        name: 'EnableServerless'
      }
    ] : []
    consistencyPolicy: {
      defaultConsistencyLevel: config.defaultConsistencyLevel
      maxIntervalInSeconds: config.maxIntervalInSeconds
      maxStalenessPrefix: config.maxStalenessPrefix
    }
    locations: [
      for location in config.locations: {
        locationName: location.locationName
        failoverPriority: location.failoverPriority
        isZoneRedundant: location.isZoneRedundant
      }
    ]
  }
}

output id string = cosmosAccount.id
output endpoint string = cosmosAccount.properties.documentEndpoint
