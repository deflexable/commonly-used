
export default function ({ handleClass, handleId, conStyle, contStyle }) {

    return (
        <div className={`general-modal-handle${handleClass ? ' ' + handleClass : ''}`}
            id={handleId}
            style={conStyle}>
            <div style={contStyle} />
        </div>
    )
}