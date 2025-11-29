import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { themeStyle, usePrefferedSettings, useStyle } from '../page_helper';
import { Colors } from '@this_app_root/src/utils/values';
import { useTranslation } from '@this_app_root/src/locale';
import TextView from './TextView';
import { useIsOnline } from '../client_server';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ({
  customMessage,
  style,
  statusHeight,
  makeStatusBarStyle,
  onBannerToggle,
  disable,
  forceShow,
  renderStatusTint
}) {
  const { styles } = useStyle(bannerStyle);
  const { top: topSpacing } = useSafeAreaInsets();
  if (statusHeight === undefined) statusHeight = topSpacing;

  const settings = usePrefferedSettings();
  const isConnected = useIsOnline();
  const bannerVisible = !settings?.hide_net && !isConnected && typeof isConnected === 'boolean';
  const { translations } = useTranslation();

  useEffect(() => {
    onBannerToggle?.(!!bannerVisible);
  }, [bannerVisible]);

  const bannerConStyle = useMemo(() => {
    return [styles.main, { paddingTop: statusHeight + 10 }, style];
  }, [styles.main, statusHeight, style]);

  const bannerPlaceholderStyle = useMemo(() => {
    return [{ height: statusHeight }, styles.statusBar, makeStatusBarStyle, style];
  }, [statusHeight, styles.statusBar, makeStatusBarStyle, style]);

  if ((bannerVisible && !disable) || forceShow)
    return (
      <View style={bannerConStyle}>
        {renderStatusTint?.(true)}
        <TextView style={styles.noInternetConnectionText}>
          {customMessage ? customMessage : translations.server_is_unreachable}
        </TextView>
      </View>
    );

  return <>
    {renderStatusTint?.()}
    <View style={bannerPlaceholderStyle} />
  </>;
}

const bannerStyle = {
  main: {
    backgroundColor: themeStyle(Colors.themeColor, 'rgb(53, 53, 53)'),
    width: '100%',
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: 'center'
  },

  noInternetConnectionText: {
    color: Colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 13,
    marginHorizontal: 15
  },

  statusBar: {
    // backgroundColor: themeStyle(Colors.white, Colors.dark)
  }
};