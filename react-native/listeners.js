import SubscriptionListener from 'subscription-listener';

export const EVENT_NAMES = {
    systemLanguage: 'systemLanguage',
    userConfig: 'userConfig',
    themeListener: 'themeListener',
    lockedModalListener: 'lockedModalListener',
    dialogContext: 'dialogContext',
    pageTransMessageModalListener: 'pageTransMessageModalListener'
};

export default new SubscriptionListener();