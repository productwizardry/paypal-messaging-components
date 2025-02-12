import objectEntries from 'core-js-pure/stable/object/entries';
import { request, getActiveTags, ppDebug, createState, isStorageFresh, getDeviceID } from '../../utils';

const Message = function({ markup, meta, parentStyles, warnings }) {
    const { onClick, onReady, onHover, onMarkup, onProps, resize, deviceID: parentDeviceID } = window.xprops;
    const dimensionsRef = { current: { width: 0, height: 0 } };

    const [props, setProps] = createState({
        amount: window.xprops.amount ?? null,
        currency: window.xprops.currency ?? null,
        buyerCountry: window.xprops.buyerCountry ?? null,
        ignoreCache: window.xprops.ignoreCache ?? null,
        style: JSON.stringify(window.xprops.style),
        offer: window.xprops.offer ?? null,
        payerId: window.xprops.payerId ?? null,
        clientId: window.xprops.clientId ?? null,
        merchantId: window.xprops.merchantId ?? null
    });

    const [serverData, setServerData] = createState({
        metaMessageRequestId: meta.messageRequestId ?? null,
        parentStyles,
        warnings,
        markup
    });

    const handleClick = () => {
        if (typeof onClick === 'function') {
            onClick({ meta });
        }
    };

    const handleHover = () => {
        if (typeof onHover === 'function') {
            onHover({ meta });
        }
    };

    // if there is a button reuse that instead of making a new one
    const button = document.createElement('button');

    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', 'PayPal Pay Later Message');

    button.addEventListener('click', handleClick);
    button.addEventListener('mouseover', handleHover);
    button.addEventListener('focus', handleHover);

    button.style.display = 'block';
    button.style.background = 'transparent';
    button.style.padding = 0;
    button.style.border = 'none';
    button.style.outline = 'none';
    button.style.textAlign = window.xprops.style?.text?.align || 'left';
    button.style.fontFamily = 'inherit';
    button.style.fontSize = 'inherit';
    button.innerHTML = markup ?? '';

    onReady({
        meta,
        activeTags: getActiveTags(button),
        // Utility will create iframe deviceID if it doesn't exist.
        deviceID: isStorageFresh() ? parentDeviceID : getDeviceID()
    });

    onMarkup({ meta, styles: parentStyles, warnings });

    window.addEventListener('focus', () => {
        button.focus();
    });

    if (typeof onProps === 'function') {
        onProps(xprops => {
            const shouldRerender = Object.keys(props).some(key =>
                typeof props[key] !== 'object'
                    ? props[key] !== xprops[key]
                    : JSON.stringify(props[key]) !== JSON.stringify(xprops[key])
            );

            if (shouldRerender) {
                const {
                    amount,
                    currency,
                    buyerCountry,
                    ignoreCache,
                    offer,
                    payerId,
                    clientId,
                    merchantId,
                    version,
                    env,
                    features,
                    stageTag,
                    style
                } = xprops;

                setProps({
                    amount,
                    currency,
                    buyerCountry,
                    ignoreCache,
                    style: JSON.stringify(style),
                    offer,
                    payerId,
                    clientId,
                    merchantId
                });

                const query = objectEntries({
                    message_request_id: meta.messageRequestId,
                    amount,
                    currency,
                    buyer_country: buyerCountry,
                    ignore_cache: ignoreCache,
                    style,
                    credit_type: offer,
                    payer_id: payerId,
                    client_id: clientId,
                    merchant_id: merchantId,
                    features,
                    version,
                    env,
                    stageTag
                })
                    .filter(([, val]) => Boolean(val))
                    .reduce(
                        (acc, [key, val]) =>
                            `${acc}&${key}=${encodeURIComponent(typeof val === 'object' ? JSON.stringify(val) : val)}`,
                        ''
                    )
                    .slice(1);

                ppDebug('Updating message with new props...', { inZoid: true });

                request('GET', `${window.location.origin}/credit-presentment/renderMessage?${query}`).then(
                    ({ data }) => {
                        button.innerHTML = data.markup ?? markup;
                        const buttonWidth = button.offsetWidth;
                        const buttonHeight = button.offsetHeight;
                        // Zoid will not fire a resize event if the markup has the same dimensions meaning the render event
                        // in the overflow observer will not fire. This forces the resize event to fire for every render
                        // so that the render complete logs will always fire
                        if (
                            dimensionsRef.current.width === buttonWidth &&
                            dimensionsRef.current.height === buttonHeight
                        ) {
                            // resizes the iframe
                            resize({ width: buttonWidth, height: buttonHeight });
                        } else {
                            dimensionsRef.current = { width: buttonWidth, height: buttonHeight };
                        }

                        if (typeof onReady === 'function') {
                            if (
                                serverData.metaMessageRequestId !==
                                (data.meta.messageRequestId ?? meta.messageRequestId)
                            ) {
                                onReady({
                                    meta: data.meta ?? meta,
                                    activeTags: getActiveTags(button),
                                    // If storage state is brand new, use the parent deviceID, otherwise use child
                                    deviceID: isStorageFresh() ? parentDeviceID : getDeviceID()
                                });
                            }
                        }

                        if (typeof onMarkup === 'function') {
                            if (
                                serverData.parentStyles !== (data.parentStyles ?? parentStyles) ||
                                serverData.warnings !== (data.warnings ?? warnings) ||
                                serverData.markup !== (data.markup ?? markup)
                            ) {
                                // resizes the parent message div
                                onMarkup({
                                    meta: data.meta ?? meta,
                                    styles: data.parentStyles ?? parentStyles,
                                    warnings: data.warnings ?? warnings
                                });
                            }
                        }

                        setServerData({
                            metaMessageRequestId: data.meta.messageRequestId ?? meta.messageRequestId,
                            parentStyles: data.parentStyles ?? parentStyles,
                            warnings: data.warnings ?? warnings,
                            markup: data.markup ?? markup
                        });
                    }
                );
            }
        });
    }

    return button;
};

export default Message;
