import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { View, useWindowDimensions } from "react-native";
import { Colors } from '@/src/utils/values';
import { LockedStickyTopModals } from '@/src/utils/scope';
import listeners, { EVENT_NAMES } from '@/src/utils/listeners';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { SnapSheetModal } from 'react-native-snap-sheet';
import { useDarkMode } from '../theme_helper';

/**
 * @typedef {object} SnapSheetModalExtraProps
 * @property {string} [modalName]
 * @property {number | ((dim: import("react-native").ScaledSize) => number) | [import("react-native").ScaledSize, Array<>]} [modalHeight]
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
  modalHeight,
  ...restProps
}, ref) => {
  const isDarkMode = useDarkMode();

  const [isOpen, setOpen] = useState(false);

  const isFocused = modalName || useIsFocused();
  const navigation = !modalName && useNavigation();

  if (typeof modalHeight === 'function') {
    const sizing = useWindowDimensions();

    modalHeight = useMemo(() => modalHeight(sizing), [sizing]);
  } else if (Array.isArray(modalHeight)) {
    const sizing = useWindowDimensions();

    modalHeight = useMemo(() => modalHeight[0](sizing), [sizing, ...modalHeight[1]]);
  }

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
      {...(restProps.fillScreen && !modalName && !isFocused) ? { containerStyle: fillScreenStyle } : {}}
      ref={ref}
      disabled={disabled}
      disableBackHandler={disableBackHandler || !isFocused}
      backdropColor={isDarkMode ? 'rgba(0, 0, 0, 0.7)' : undefined}
      style={modalStyle}
      centered={centered}
      handleColor={isDarkMode ? Colors.gray : Colors.borderColor}
      modalHeight={modalHeight}
      onStateChanged={s => {
        setOpen(s !== 'closed');
        onStateChanged?.(s);
      }}>
      {children}
    </SnapSheetModal>
  );
});

const fillScreenStyle = { opacity: 0, zIndex: -99, elevation: 0 };

export default AppModal;

export const PlainModalBG = [Colors.appBackgroundColor, Colors.black];
export const MaxModalWidth = 750;

/**
 * @type {AppModal}
 */
export const ModalScreen = ({ modalRef, onClosed, autoOpen = true, ...restProps }) => {
  const navigation = useNavigation();

  useEffect(() => {
    if (autoOpen)
      requestIdleCallback(() => {
        modalRef.current.open();
      }, { timeout: 70 });
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

export const MODAL_HANDLER_HEIGHT = 19;