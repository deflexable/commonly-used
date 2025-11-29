import React from 'react';
import { StackActions } from '@react-navigation/native';

/**
 * @type {React.Ref<import('@react-navigation/native').NavigationContainerRef<ReactNavigation.RootParamList>>}
 */
const navigationReference = React.createRef();

const navigate = (name, params) => navigationReference.current?.navigate(name, params);

const push = (name, params) => navigationReference.current?.push(name, params);

const resetAndPush = (name, params) => navigationReference.current?.reset({
  index: 0,
  routes: [{ name, params }]
});

const popScreen = (n) => {
  const popAction = StackActions.pop(n);
  navigationReference.current?.dispatch(popAction);
};

const goBack = () => navigationReference.current.goBack();

const currentScreen = () => navigationReference.current?.getCurrentRoute().name;

const replace = (name, params) => navigationReference.current.dispatch(StackActions.replace(name, params));

export default {
  navigationReference,
  navigate,
  resetAndPush,
  popScreen,
  goBack,
  currentScreen,
  push,
  replace
};