import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Popup from "reactjs-popup";

export default forwardRef(({ trigger, children, disablePropagation, ...rest }, ref) => {
    const [mount, setMount] = useState();

    const menuRef = useRef();

    useImperativeHandle(ref, () => ({
        close: () => menuRef.current.close(),
        open: () => menuRef.current.open(),
        toggle: () => menuRef.current.toggle()
    }));

    useEffect(() => {
        setMount(true);
    }, []);

    if (mount)
        return (
            <Popup
                ref={menuRef}
                {...rest}
                trigger={trigger}>
                <div onClick={() => {
                    if (!disablePropagation) menuRef.current.close();
                }}>
                    {children}
                </div>
            </Popup>
        );

    return trigger;
});