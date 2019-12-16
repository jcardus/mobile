/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateSubscriptions = `subscription OnCreateSubscriptions(
  $id: ID
  $subscription: String
  $email: String
  $userid: Int
) {
  onCreateSubscriptions(
    id: $id
    subscription: $subscription
    email: $email
    userid: $userid
  ) {
    id
    subscription
    email
    userid
  }
}
`;
export const onUpdateSubscriptions = `subscription OnUpdateSubscriptions(
  $id: ID
  $subscription: String
  $email: String
  $userid: Int
) {
  onUpdateSubscriptions(
    id: $id
    subscription: $subscription
    email: $email
    userid: $userid
  ) {
    id
    subscription
    email
    userid
  }
}
`;
export const onDeleteSubscriptions = `subscription OnDeleteSubscriptions(
  $id: ID
  $subscription: String
  $email: String
  $userid: Int
) {
  onDeleteSubscriptions(
    id: $id
    subscription: $subscription
    email: $email
    userid: $userid
  ) {
    id
    subscription
    email
    userid
  }
}
`;
export const onCreateSubs = `subscription OnCreateSubs($id: ID, $subscription: String, $email: String) {
  onCreateSubs(id: $id, subscription: $subscription, email: $email) {
    id
    subscription
    email
  }
}
`;
export const onUpdateSubs = `subscription OnUpdateSubs($id: ID, $subscription: String, $email: String) {
  onUpdateSubs(id: $id, subscription: $subscription, email: $email) {
    id
    subscription
    email
  }
}
`;
export const onDeleteSubs = `subscription OnDeleteSubs($id: ID, $subscription: String, $email: String) {
  onDeleteSubs(id: $id, subscription: $subscription, email: $email) {
    id
    subscription
    email
  }
}
`;
export const onCreateWebSubs = `subscription OnCreateWebSubs($id: ID, $subscription: String, $email: String) {
  onCreateWebSubs(id: $id, subscription: $subscription, email: $email) {
    id
    subscription
    email
  }
}
`;
export const onUpdateWebSubs = `subscription OnUpdateWebSubs($id: ID, $subscription: String, $email: String) {
  onUpdateWebSubs(id: $id, subscription: $subscription, email: $email) {
    id
    subscription
    email
  }
}
`;
export const onDeleteWebSubs = `subscription OnDeleteWebSubs($id: ID, $subscription: String, $email: String) {
  onDeleteWebSubs(id: $id, subscription: $subscription, email: $email) {
    id
    subscription
    email
  }
}
`;
