
export const translateX = async (string, to = 'en') => {
    if (process.env.NODE_ENV === 'production') throw 'cannot translate static files in production';

    const r = await fetch('http://localhost:2739/translate', {
        body: JSON.stringify({ string, to }),
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        keepalive: false
    });

    const { result, status } = await r.json();
    if (status !== 'success') throw 'unsuccessful response';
    return result;
}