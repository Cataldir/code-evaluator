@description('Key/value pair used for configuring platform features on the App Service.')
type NameValuePair = {
  name: string
  value: string
}

@description('Identity configuration for the App Service.')
type IdentityConfig = {
  type: 'None' | 'SystemAssigned' | 'UserAssigned' | 'SystemAssigned, UserAssigned'
  userAssignedIdentities: object
}

@description('Settings for the App Service instance.')
type AppServiceConfig = {
  name: string
  kind: string
  serverFarmId: string
  httpsOnly: bool
  alwaysOn: bool
  linuxFxVersion: string
  windowsFxVersion: string
  appSettings: NameValuePair[]
  identity: IdentityConfig
  tags: object
}

@description('Azure region in which the App Service will be deployed.')
param location string

@description('Configuration values for the App Service.')
param config AppServiceConfig

resource site 'Microsoft.Web/sites@2023-12-01' = {
  name: config.name
  location: location
  kind: config.kind
  tags: config.tags
  identity: config.identity.type == 'None'
    ? null
    : {
        type: config.identity.type
        userAssignedIdentities: config.identity.userAssignedIdentities
      }
  properties: {
    serverFarmId: config.serverFarmId
    httpsOnly: config.httpsOnly
    siteConfig: empty(config.windowsFxVersion)
      ? {
          alwaysOn: config.alwaysOn
          ftpsState: 'Disabled'
          minTlsVersion: '1.2'
          vnetRouteAllEnabled: true
          linuxFxVersion: config.linuxFxVersion
          appSettings: config.appSettings
        }
      : union({
          alwaysOn: config.alwaysOn
          ftpsState: 'Disabled'
          minTlsVersion: '1.2'
          vnetRouteAllEnabled: true
          linuxFxVersion: config.linuxFxVersion
          appSettings: config.appSettings
        }, {
          windowsFxVersion: config.windowsFxVersion
        })
  }
}

output id string = site.id
