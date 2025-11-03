@description('Metadata for the Azure AI Foundry project.')
type AIFoundryProjectConfig = {
  name: string
  displayName: string
  description: string
  tags: object
}

@description('Name of the parent Azure AI Foundry account.')
param accountName string

@description('Region of the Azure AI Foundry account (projects inherit the same region).')
param accountLocation string

@description('Configuration for the Azure AI Foundry project.')
param config AIFoundryProjectConfig

resource account 'Microsoft.CognitiveServices/accounts@2024-10-01' existing = {
  name: accountName
}

resource project 'Microsoft.CognitiveServices/accounts/projects@2025-06-01' = {
  name: config.name
  location: accountLocation
  parent: account
  tags: config.tags
  properties: {
    displayName: config.displayName
    description: config.description
  }
}

output id string = project.id
