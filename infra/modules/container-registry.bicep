@description('Configuration for the Azure Container Registry instance.')
type ContainerRegistryConfig = {
  name: string
  location: string
  sku: 'Basic' | 'Standard' | 'Premium'
  adminUserEnabled: bool
  retentionPolicyInDays: int
  tags: object
}

@description('Settings for the Azure Container Registry.')
param config ContainerRegistryConfig

resource registry 'Microsoft.ContainerRegistry/registries@2023-06-01-preview' = {
  name: config.name
  location: config.location
  tags: config.tags
  sku: {
    name: config.sku
  }
  properties: {
    adminUserEnabled: config.adminUserEnabled
    policies: {
      retentionPolicy: {
        days: config.retentionPolicyInDays
        status: config.retentionPolicyInDays > 0 ? 'Enabled' : 'Disabled'
      }
    }
  }
}

output id string = registry.id
output loginServer string = registry.properties.loginServer
