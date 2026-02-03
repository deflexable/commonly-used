import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { Colors } from '@this_app_root/src/utils/values';
import { LockedStickyTopModals } from '@this_app_root/src/utils/scope';
import listeners, { EVENT_NAMES } from '@this_app_root/src/utils/listeners';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { SnapSheetModal } from 'react-native-snap-sheet';
import { useDarkMode } from '../theme_helper';
import { View } from "react-native";

/**
 * @typedef {object} SnapSheetModalExtraProps
 * @property {string} [modalName]
 * @property {[string, string] | undefined} [modalBackGround]
 */

/**
 * @type {React.FC<React.ComponentProps<typeof import('react-native-snap-sheet').SnapSheetModal> & SnapSheetModalExtraProps>}
 */
const AppModal = forwardRef(({
  onStateChanged,
  children,
  disabled,
  modalName,
  modalBackGround,
  centered,
  style,
  disableBackHandler,
  ...restProps
}, ref) => {
  const isDarkMode = useDarkMode();

  const [isOpen, setOpen] = useState(false);

  const isFocused = modalName || useIsFocused();
  const navigation = !modalName && useNavigation();

  const toggleGestureEnabled = (enabled) => {
    if (navigation) {
      navigation.setOptions({ gestureEnabled: !!enabled && undefined });
    } else if (modalName) {
      listeners.dispatch(EVENT_NAMES.lockedModalListener);
    }
  }

  useEffect(() => {
    if (isOpen && isFocused) {
      if (disabled) {
        if (modalName) LockedStickyTopModals[modalName] = true;
        toggleGestureEnabled(false);
      }

      return () => {
        if (disabled) {
          if (modalName && Object.hasOwn(LockedStickyTopModals, modalName)) {
            delete LockedStickyTopModals[modalName];
          }
          toggleGestureEnabled(true);
        }
      }
    }
  }, [isOpen, !!disabled, isFocused]);

  if (!centered && modalBackGround === undefined)
    modalBackGround = [Colors.white, Colors.modalBlack];

  const modalStyle = useMemo(() => ({
    ...centered ? {} : {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      width: '100%',
      maxWidth: MaxModalWidth,
      alignSelf: 'center'
      // overflow: 'hidden'
    },
    ...modalBackGround ? { backgroundColor: modalBackGround[isDarkMode ? 1 : 0] } : {},
    ...style,
  }), [isDarkMode, `${modalBackGround}`, style]);

  return (
    <SnapSheetModal
      {...restProps}
      {...(restProps.fillScreen && !modalName && !isFocused) ? { containerStyle: { opacity: 0, zIndex: -99, elevation: 0 } } : {}}
      ref={ref}
      disabled={disabled}
      disableBackHandler={disableBackHandler || !isFocused}
      style={modalStyle}
      centered={centered}
      handleColor={isDarkMode ? Colors.gray : Colors.borderColor}
      onStateChanged={s => {
        setOpen(s !== 'closed');
        onStateChanged?.(s);
      }}>
      {children}
    </SnapSheetModal>
  );
});

export default AppModal;

export const PlainModalBG = [Colors.appBackgroundColor, Colors.black];
export const MaxModalWidth = 750;

/**
 * @type {AppModal}
 */
export const ModalScreen = ({ modalRef, onClosed, ...restProps }) => {
  const navigation = useNavigation();

  useEffect(() => {
    modalRef.current.open();
  }, []);

  return (
    <View style={styling.flexer}>
      <AppModal
        {...restProps}
        ref={modalRef}
        onClosed={() => {
          navigation.goBack();
          onClosed?.();
        }} />
    </View>
  );
}

const styling = {
  flexer: { flex: 1 }
};