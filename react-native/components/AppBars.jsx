import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { useMemo, useState } from 'react';
import { themeStyle, useStyle } from '../page_helper';
import { Colors } from '@this_app_root/src/utils/values';
import NoInternetBanner from './NoInternetBanner';

export const AppTitleBar = function ({
  leading,
  title,
  trailing,
  backgroundColor,
  center,
  style,
  tabHeight,
  hideBanner,
  statusTint
}) {
  const { styles } = useStyle(appTitleBarStyle);
  const [leftWidth, setLeftWidth] = useState();
  const [rightWidth, setRightWidth] = useState();

  const isDarkMode = styles.containerBG.backgroundColor === Colors.dark;

  const sidingStyle = useMemo(() => {
    return { width: Math.max(leftWidth, rightWidth) };
  }, [leftWidth, rightWidth]);

  const renderSideView = (view, pos) => (
    <View style={
      center &&
      (
        [leftWidth, rightWidth].some(v => v === undefined)
          ? tabbarSidingStyle[pos]
          : sidingStyle
      )}>
      {view ? <View style={styles.leadingDefault}>{view}</View> : null}
    </View>
  );

  const renderVirtualSideView = (view, setLayoutWidth) => center ? (
    <View style={virtualSideViewStyle}>
      <View
        onLayout={e => {
          setLayoutWidth(e.nativeEvent.layout.width);
        }}>
        {view ? <View style={styles.leadingDefault}>{view}</View> : null}
      </View>
    </View>
  ) : null;

  const isTinted = statusTint === true && Platform.OS !== 'android';

  const tabbarStyle = useMemo(() => {
    return {
      ...isTinted ? styles.containerBGTint : styles.containerBG,
      ...backgroundColor ? { backgroundColor } : {}
    };
  }, [backgroundColor, styles.containerBG, isTinted]);

  const tabbarContStyle = useMemo(() => {
    return tabHeight ? [styles.container, { height: tabHeight }] : styles.container;
  }, [tabHeight, styles.container]);

  const tabbarTitleStyle = useMemo(() => {
    return center ? [styles.titleDefault, center && { alignItems: 'center' }] : styles.titleDefault;
  }, [styles.titleDefault, center]);

  const renderStatusTint = (bannerVisible) => {
    const shouldLightup = bannerVisible ? !isDarkMode : isDarkMode;

    return (
      statusTint === false ? null :
        statusTint === true ?
          <StatusBar barStyle={(Platform.OS === 'ios' || shouldLightup) ? 'light-content' : "dark-content"} /> :
          <StatusBar barStyle={shouldLightup ? 'light-content' : 'dark-content'} />
    );
  }

  return (
    <View style={style}>

      <View style={tabbarStyle}>
        {hideBanner ?
          renderStatusTint() :
          <NoInternetBanner
            statusHeight={isTinted ? 10 : undefined}
            renderStatusTint={renderStatusTint} />}

        <View style={tabbarContStyle}>
          {renderSideView(leading, 0)}
          <View style={tabbarTitleStyle}>{title}</View>
          {renderSideView(trailing, 1)}
        </View>
      </View>

      {renderVirtualSideView(leading, setLeftWidth)}
      {renderVirtualSideView(trailing, setRightWidth)}
    </View>
  );
};

const tabbarSidingStyle = [
  { position: 'absolute', left: 0 },
  { position: 'absolute', right: 0 }
];

const virtualSideViewStyle = {
  position: 'absolute',
  zIndex: -99,
  opacity: 0
};

const appTitleBarStyle = StyleSheet.create({
  containerBG: {
    backgroundColor: themeStyle(Colors.white, Colors.dark)
  },

  containerBGTint: {
    backgroundColor: themeStyle(Colors.white, Colors.lightDark)
  },

  container: {
    width: '100%',
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center'
  },

  leadingDefault: {
    justifyContent: 'center'
  },

  titleDefault: {
    flex: 1,
    marginHorizontal: 14,
    justifyContent: 'center'
  }
});

export const commonAppBarStyle = {
  flexer: { flex: 1 },

  main: {
    flex: 1,
    backgroundColor: themeStyle(Colors.appBackgroundColor, Colors.black),
  },

  mainThick: {
    flex: 1,
    backgroundColor: themeStyle(Colors.white, Colors.dark),
  },

  screenTitle: {
    fontSize: 17,
    fontWeight: 'bold'
  },

  screenTitleDes: {
    color: Colors.gray,
    fontSize: 13,
    marginTop: 2
  },

  titleBarIcon: {
    margin: 10,
    width: 20,
    height: 20,
    tintColor: themeStyle(Colors.dark, Colors.white)
  },

  tabbarBtnLeft: { paddingLeft: 10 },

  tabbarBtnRight: { paddingRight: 10 }
};