declare namespace _default {
    export { navigationReference };
    export { navigate };
    export { resetAndPush };
    export { popScreen };
    export { goBack };
    export { currentScreen };
    export { push };
    export { replace };
}
export default _default;
/**
 * @type {React.Ref<import('@react-navigation/native').NavigationContainerRef<ReactNavigation.RootParamList>>}
 */
declare const navigationReference: React.Ref<any>;
declare function navigate(name: any, params: any): any;
declare function resetAndPush(name: any, params: any): any;
declare function popScreen(n: any): void;
declare function goBack(): any;
declare function currentScreen(): any;
declare function push(name: any, params: any): any;
declare function replace(name: any, params: any): any;
import React from 'react';
