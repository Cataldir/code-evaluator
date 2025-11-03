@description('Configuration for the Azure AI Foundry account.')
type AIFoundryAccountConfig = {
  name: string
  location: string
  skuName: string
  publicNetworkAccess: 'Enabled' | 'Disabled'
  disableLocalAuth: bool
  tags: object
}

@description('Settings used to provision the Azure AI Foundry account.')
param config AIFoundryAccountConfig

resource aiAccount 'Microsoft.CognitiveServices/accounts@2024-10-01' = {
  name: config.name
  location: config.location
  kind: 'AIServices'
  sku: {
    name: config.skuName
  }
  tags: config.tags
  properties: {
    publicNetworkAccess: config.publicNetworkAccess
    disableLocalAuth: config.disableLocalAuth
  }
}

output id string = aiAccount.id
output endpoint string = aiAccount.properties.endpoint
