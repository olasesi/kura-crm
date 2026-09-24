export const typeDefs = `#graphql
  type User {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    role: String!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
    contacts: [Contact!]
  }

  type Contact {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    phone: String
    company: String
    createdBy: ID
    creator: User
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    user: User!
    accessToken: String!
    refreshToken: String!
  }

  type MfaSetupResult {
    secret: String!
    uri: String!
    qrCode: String!
  }

  type TokenResult {
    accessToken: String!
    refreshToken: String!
  }

  union LoginResult = AuthPayload | MfaRequired

  type MfaRequired {
    mfaRequired: Boolean!
    mfaToken: String!
  }

  type PaginatedContacts {
    data: [Contact!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type PaginatedUsers {
    data: [User!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type Webhook {
    id: ID!
    userId: ID!
    url: String!
    events: [String!]!
    enabled: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type SettingEntry {
    key: String!
    value: String
  }

  type SettingGroupMeta {
    group: String!
    description: String!
    scope: String!
    sensitive: Boolean!
  }

  input SettingInput {
    key: String!
    value: String!
  }

  type Role {
    id: ID
    name: String!
    description: String!
    permissions: [String!]!
    isSystem: Boolean!
    isActive: Boolean!
    createdAt: String
    updatedAt: String
  }

  type PermissionModule {
    module: String!
    label: String!
    permissions: [String!]!
  }

  type PaginatedRoles {
    data: [Role!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  type Query {
    me: User
    user(id: ID!): User
    users(page: Int, limit: Int): PaginatedUsers!
    contact(id: ID!): Contact
    contacts(page: Int, limit: Int): PaginatedContacts!
    webhooks: [Webhook!]!
    settingGroups: [SettingGroupMeta!]!
    settings(group: String!): [SettingEntry!]!
    mySettings(group: String!): [SettingEntry!]!
    roles(page: Int, limit: Int): PaginatedRoles!
    role(ref: String!): Role
    permissionCatalog: [PermissionModule!]!
  }

  type Mutation {
    register(firstName: String!, lastName: String!, email: String!, password: String!, recaptchaToken: String): AuthPayload!
    login(email: String!, password: String!, recaptchaToken: String): LoginResult!
    refreshToken(token: String!): AuthPayload!
    logout: Boolean!
    mfaSetup: MfaSetupResult!
    mfaVerify(code: String!): Boolean!
    mfaDisable(password: String!): Boolean!
    mfaChallenge(mfaToken: String!, code: String!): TokenResult!
    createContact(firstName: String!, lastName: String!, email: String!, phone: String, company: String): Contact!
    updateContact(id: ID!, firstName: String, lastName: String, email: String, phone: String, company: String): Contact!
    deleteContact(id: ID!): Boolean!
    adminCreateUser(firstName: String!, lastName: String!, email: String!, role: String, roleName: String, password: String): User!
    updateUser(id: ID!, firstName: String, lastName: String, email: String, role: String): User!
    setUserActive(id: ID!, isActive: Boolean!): User!
    assignUserRole(id: ID!, role: String!): User!
    resetUserPassword(id: ID!, newPassword: String!): Boolean!
    deleteUser(id: ID!): Boolean!
    changePassword(currentPassword: String!, newPassword: String!): Boolean!
    webhookSubscribe(url: String!, events: [String!]!, secret: String): Webhook!
    webhookUnsubscribe(id: ID!): Boolean!
    webhookUpdate(id: ID!, url: String, events: [String!], enabled: Boolean): Webhook!
    updateSettings(group: String!, input: [SettingInput!]!): [SettingEntry!]!
    updateMySettings(group: String!, input: [SettingInput!]!): [SettingEntry!]!
    resetSettings(group: String!): Boolean!
    createRole(name: String!, description: String, permissions: [String!]!, isActive: Boolean): Role!
    updateRole(ref: String!, description: String, permissions: [String!], isActive: Boolean): Role!
    deleteRole(ref: String!): Boolean!
  }
`;
