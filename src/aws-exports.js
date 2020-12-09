import { getPartnerData } from '@/utils/partner'

const ampConfig = {
    aws_project_region: 'us-east-1',
    aws_cognito_identity_pool_id: 'us-east-1:63d476f8-7f0f-4c4c-9051-24e5ef63cf17',
    aws_cognito_region: 'us-east-1',
    aws_user_pools_id: 'us-east-1_XEJ1DMDIJ',
    aws_user_pools_web_client_id: getPartnerData().cognitoClientId,
    oauth: {
        domain: 'auth.fleetmap.io',
        scope: [
            'phone',
            'email',
            'openid',
            'profile',
            'aws.cognito.signin.user.admin'
        ],
        responseType: 'code'
    },
    federationTarget: 'COGNITO_USER_POOLS',
    aws_mobile_analytics_app_id: 'd0e262fc9a03412288d362dbc836501b',
    aws_mobile_analytics_app_region: 'us-east-1'
};

export default ampConfig;
