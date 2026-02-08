import { useEffect, useRef, useState } from "react";
import PopupModal from "../PopupModal/PopupModal";
import UserPhoto from "../UserPhoto/UserPhoto";
import { useLastLoaderData } from "../../nav";
import { mentionRegex } from "../../cleanser";
import { downScaleImage, joinPath } from "../../../common/methods";
import { ENV } from "../../server_variables.js";

function getCaretNode() {
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
        var range = selection.getRangeAt(0);
        if (range.collapsed) return [range.commonAncestorContainer, range.startOffset];
    }
    return null;
}

const placeCaretAfterNode = (node) => {
    const selection = window.getSelection();
    const range = document.createRange();

    // Set the range after the node
    range.setStartAfter(node);
    range.setEndAfter(node);

    // Clear any existing selections and apply the new range
    selection.removeAllRanges();
    selection.addRange(range);
};


const insertTextAtCaret = (text) => {
    const selection = window.getSelection();

    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    // Create a text node with the replacement content
    const textNode = document.createTextNode(text);

    // Insert the new content at the caret position
    range.insertNode(textNode);

    // Move the caret position to the end of the newly inserted content
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);

    // Reapply the range to ensure the caret is updated
    selection.removeAllRanges();
    selection.addRange(range);
};

const sanitizeHtml = (text) => {
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.innerText;
};

export default function ({ innerStyle, onMentionUser, inputID, children, searchUser, WEB_BASE_URL }) {
    const { geo } = useLastLoaderData();

    if (!WEB_BASE_URL) WEB_BASE_URL = ENV.WEB_BASE_URL;

    const [users, setUsers] = useState([]),
        [open, setOpen] = useState(false);

    const lastRef = useRef(0),
        popupRef = useRef(),
        hideMentionForNow = useRef(false);

    const hideMention = () => {
        setOpen(false);
        setUsers([]);
        ++lastRef.current;
    }

    const searchMention = async (s) => {
        console.log('searching mention:', s);
        setUsers([]);

        const ref = ++lastRef.current,
            q = await searchUser({
                search: `@${s}`,
                limit: 5,
                enforceMe: true,
                city: geo?.city,
                country: geo?.country
            });

        if (ref !== lastRef.current) return;
        setUsers(q.data.filter((_, i) => i < 7));
        setOpen(true);
    }

    const thisMentionRegex = () => mentionRegex(WEB_BASE_URL);

    useEffect(() => {

        const onselectx = () => {
            const elem = document.getElementById(inputID);

            if (!document.activeElement.isSameNode(elem)) return;
            if (hideMentionForNow.current) return;
            const [caretNode, caretOffset] = getCaretNode();
            let isMention;

            const doSearch = (search, dom) => {
                if (search) {
                    isMention = true;
                    searchMention(search);
                }
            }

            const deepSearch = (childNodes = elem.childNodes) => {

                childNodes.forEach(thisNode => {
                    if (thisNode.isSameNode(caretNode)) {
                        if (caretNode.nodeType === Node.TEXT_NODE) {
                            const nodeValue = thisNode.nodeValue;

                            if (nodeValue) {
                                if (thisNode.parentElement.outerHTML?.match?.(thisMentionRegex())) {
                                    doSearch(
                                        thisNode.parentElement.outerHTML.match(thisMentionRegex())[1],
                                        thisNode.parentNode
                                    );
                                } else {
                                    let start, end;

                                    for (let i = (caretOffset - 1); i >= 0; i--) {
                                        if (
                                            (!nodeValue[i]?.trim?.() || !i) &&
                                            nodeValue.substring(i).trim().startsWith('@')
                                        ) {
                                            start = nodeValue.substring(i).indexOf('@') + i;
                                            break;
                                        }
                                    }

                                    for (let i = (caretOffset - 1); i < nodeValue.length; i++) {
                                        if (!nodeValue[i]?.trim?.() || i === nodeValue.length - 1) {
                                            end = i;
                                            break;
                                        }
                                    }

                                    if (
                                        Number.isInteger(start) &&
                                        Number.isInteger(end)
                                    ) {
                                        doSearch(nodeValue.substring(start + 1, end + 1), thisNode);
                                    }
                                }
                            }
                        } else if (
                            thisNode.nodeType === Node.ELEMENT_NODE &&
                            thisNode.outerHTML?.match?.(thisMentionRegex())
                        ) {
                            doSearch(thisNode.outerHTML.match(thisMentionRegex())[1], thisNode);
                        }
                    } else deepSearch(thisNode.childNodes);
                });
            };

            deepSearch();
            if (!isMention) hideMention();
        };

        const onPaste = event => {
            const elem = document.getElementById(inputID);
            if (elem && elem.contains(event.target)) {
                event.preventDefault();

                // Get the pasted content from the clipboard
                const pastedData = (event.clipboardData || window.clipboardData).getData('text');
                if (pastedData) insertTextAtCaret(sanitizeHtml(pastedData));
            }
        }

        document.addEventListener('paste', onPaste);
        document.addEventListener('selectionchange', onselectx);
        return () => {
            document.removeEventListener('selectionchange', onselectx);
            document.removeEventListener('paste', onPaste);
        };
    }, []);

    const dispatchMention = (mention) => {
        const [caretNode, caretOffset] = getCaretNode(),
            elem = document.getElementById(inputID),
            aTag = document.createElement('a');

        aTag.href = joinPath(WEB_BASE_URL, `/@${mention}`);
        aTag.innerHTML = `@${mention}`;

        const mentionifyNode = (childNodes = elem.childNodes) => {
            childNodes.forEach(thisNode => {
                if (thisNode.isSameNode(caretNode)) {
                    if (caretNode.nodeType === Node.TEXT_NODE) {
                        const nodeValue = thisNode.nodeValue;

                        if (nodeValue) {
                            if (thisNode.parentElement.outerHTML?.match?.(thisMentionRegex())) {
                                thisNode.replaceWith(aTag);
                            } else {
                                const div = document.createElement('div');
                                let start, end;

                                for (let i = (caretOffset - 1); i >= 0; i--) {
                                    if (
                                        (!nodeValue[i]?.trim?.() || !i) &&
                                        nodeValue.substring(i).trim().startsWith('@')
                                    ) {
                                        start = nodeValue.substring(i).indexOf('@') + i;
                                        break;
                                    }
                                }

                                for (let i = (caretOffset - 1); i < nodeValue.length; i++) {
                                    if (!nodeValue[i]?.trim?.() || i === nodeValue.length - 1) {
                                        end = i;
                                        break;
                                    }
                                }

                                if (
                                    Number.isInteger(start) &&
                                    Number.isInteger(end)
                                ) {
                                    div.append(nodeValue.substring(0, start), aTag, nodeValue.substring(end, nodeValue.length - 1));
                                    thisNode.replaceWith(...[...div.childNodes]);
                                }
                            }
                        }
                    } else if (
                        thisNode.nodeType === Node.ELEMENT_NODE &&
                        thisNode.outerHTML?.match?.(thisMentionRegex())
                    ) {
                        thisNode.replaceWith(aTag);
                    }
                } else if (thisNode?.childNodes) {
                    mentionifyNode(thisNode.childNodes);
                }
            });
        }

        mentionifyNode();

        hideMentionForNow.current = true;
        setTimeout(() => {
            hideMentionForNow.current = false;
        }, 300);
        setTimeout(() => {
            elem.focus();
            placeCaretAfterNode(aTag);
        }, 70);
        onMentionUser(elem.innerHTML, mention);
    }

    return (
        <PopupModal
            contentStyle={{
                border: 'none',
                padding: 0,
                borderRadius: 0,
                backgroundColor: 'transparent'
            }}
            arrow={false}
            open={open}
            position={'top left'}
            keepTooltipInside={'body'}
            // onClose={() => {
            //     hideMention();
            // }}
            // offsetX={offset[0]}
            // offsetY={offset[1]}
            trigger={children}>
            <div className="menu_theme_toggle mention-float-popup-con"
                style={innerStyle}
                ref={popupRef}>
                {(users || []).map((item, index) =>
                    <div className="mention-float-user-btn button-behaviour"
                        key={item._id}
                        style={{
                            marginTop: index ? undefined : 3,
                            marginBottom: index === users.length - 1 ? 3 : undefined
                        }}
                        onClick={() => {
                            dispatchMention(item.at);
                            hideMention();
                        }}>
                        <UserPhoto
                            size={25}
                            src={downScaleImage(item.photo)}
                            vip={item.vip} />

                        <div style={{ marginLeft: 5, flex: 1, minWidth: 0 }}>
                            <b className="mention-float-user-name clamp-text">
                                {item.name}
                            </b>
                            <small className="mention-float-user-at clamp-text">
                                {`@${item.at}`}
                            </small>
                        </div>
                    </div>
                )}
            </div>
        </PopupModal>
    );
};