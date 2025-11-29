import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { Colors } from '@this_app_root/src/utils/values';
import { LockedStickyTopModals } from '@this_app_root/src/utils/scope';
import listeners, { EVENT_NAMES } from '@this_app_root/src/utils/listeners';
import { useIsFocused } from '@react-navigation/native';
import { SnapSheetModal } from 'react-native-snap-sheet';
import { useDarkMode } from '../theme_helper';

/**
 * @typedef {object} SnapSheetModalExtraProps
 * @property {string} [modalName]
 * @property {any} [navigationGesture]
 * @property {[string, string]} [modalBackGround]
 */

/**
 * @type {React.FC<React.ComponentProps<typeof import('react-native-snap-sheet').SnapSheetModal> & SnapSheetModalExtraProps>}
 */
const AppModal = forwardRef(({
  onStateChanged,
  children,
  disabled,
  navigationGesture,
  modalName,
  modalBackGround = [Colors.white, Colors.modalBlack],
  centered,
  style,
  ...restProps
}, ref) => {
  const isDarkMode = useDarkMode();

  const [isOpen, setOpen] = useState(false);

  const isFocused = modalName || useIsFocused();

  const getGesture = () => typeof navigationGesture === 'function' ? navigationGesture() : navigationGesture;

  const toggleGestureEnabled = (enabled) => {
    if (navigationGesture) {
      getGesture().setOptions({ gestureEnabled: !!enabled });
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
          if (modalName) LockedStickyTopModals[modalName] = false;
          toggleGestureEnabled(true);
        }
      }
    }
  }, [isOpen, !!disabled, isFocused]);

  const modalStyle = useMemo(() => ({
    ...centered ? {} : {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      // overflow: 'hidden'
    },
    ...modalBackGround ? { backgroundColor: modalBackGround[isDarkMode ? 1 : 0] } : {},
    ...style,
  }), [isDarkMode, ...modalBackGround || []]);

  return (
    <SnapSheetModal
      fillScreen={true}
      {...restProps}
      ref={ref}
      disabled={disabled}
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