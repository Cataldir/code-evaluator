@description('Configuration for the user-assigned managed identity.')
type UserAssignedIdentityConfig = {
  name: string
  location: string
  tags: object
}

@description('Managed identity settings.')
param config UserAssignedIdentityConfig

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: config.name
  location: config.location
  tags: config.tags
}

output id string = identity.id
output clientId string = identity.properties.clientId
output principalId string = identity.properties.principalId
