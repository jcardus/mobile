/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getSubscriptions = `query GetSubscriptions($id: ID!, $email: String!) {
  getSubscriptions(id: $id, email: $email) {
    id
    subscription
    email
    userid
  }
}
`;
export const listSubscriptions = `query ListSubscriptions(
  $filter: TableSubscriptionsFilterInput
  $limit: Int
  $nextToken: String
) {
  listSubscriptions(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      subscription
      email
      userid
    }
    nextToken
  }
}
`;
export const querySubscriptionsByIdSubscriptionIndex = `query QuerySubscriptionsByIdSubscriptionIndex(
  $userid: Int!
  $first: Int
  $after: String
) {
  querySubscriptionsByIdSubscriptionIndex(
    userid: $userid
    first: $first
    after: $after
  ) {
    items {
      id
      subscription
      email
      userid
    }
    nextToken
  }
}
`;
export const getSubs = `query GetSubs($id: ID!, $email: String!) {
  getSubs(id: $id, email: $email) {
    id
    subscription
    email
  }
}
`;
export const listSubs = `query ListSubs($filter: TableSubsFilterInput, $limit: Int, $nextToken: String) {
  listSubs(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      subscription
      email
    }
    nextToken
  }
}
`;
export const getWebSubs = `query GetWebSubs($id: ID!, $subscription: String!) {
  getWebSubs(id: $id, subscription: $subscription) {
    id
    subscription
    email
  }
}
`;
export const listWebSubs = `query ListWebSubs(
  $filter: TableWebSubsFilterInput
  $limit: Int
  $nextToken: String
) {
  listWebSubs(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      subscription
      email
    }
    nextToken
  }
}
`;
export const queryWebSubsByIdSubscriptionIndex = `query QueryWebSubsByIdSubscriptionIndex(
  $email: String!
  $first: Int
  $after: String
) {
  queryWebSubsByIdSubscriptionIndex(
    email: $email
    first: $first
    after: $after
  ) {
    items {
      id
      subscription
      email
    }
    nextToken
  }
}
`;
