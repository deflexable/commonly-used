import { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

export default function (props) {
    const isFocused = useIsFocused();

    const [n, setN] = useState(0);

    useEffect(() => {
        if (isFocused) setN(n + 1);
    }, [!isFocused]);

    return <StatusBar {...props} key={`${n}`} />;
}