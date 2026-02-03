import { useMemo } from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { Colors } from '@this_app_root/src/utils/values';
import { optimizeImage } from './../page_helper';

export default function ({
  borderColor = Colors.themeColor,
  borderWidth = 1,
  style,
  containerStyle = {},
  size = 50,
  src,
  vip,
  onPress,
  reduceQuality = true
}) {

  const conStyle = useMemo(() => {
    return [{ width: size, height: size }, containerStyle];
  }, [size, containerStyle]);

  const imgStyle = useMemo(() => {
    return [
      { backgroundColor: 'gray' },
      ...Array.isArray(style) ? style : [style],
      {
        borderColor,
        borderWidth,
        width: '100%',
        height: '100%',
        borderRadius: 100
      },
      (vip && !borderWidth) ? { borderWidth: 1 } : undefined
    ];
  }, [style, borderWidth, vip, borderColor]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      style={conStyle}>
      <Image
        style={imgStyle}
        source={{
          uri: reduceQuality
            ? optimizeImage(src, reduceQuality === true ? 90 : reduceQuality)
            : src
        }}
      />
    </TouchableOpacity>
  );
};