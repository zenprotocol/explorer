import { useState, useCallback } from 'react';
import { usePopper } from 'react-popper';

/**
 * A Tooltip component
 */
export default function useTooltip({ placement = 'top', pinned } = {}) {
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const [visible, setVisible] = useState(false);

  const { attributes, styles, update: _update } = usePopper(referenceElement, popperElement, {
    modifiers: [
      { name: 'arrow', options: { element: arrowElement, padding: 6 } },
      {
        name: 'offset',
        options: {
          offset: [0, 8],
        },
      },
    ],
    strategy: 'fixed',
    placement,
  });

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);
  // a safe update
  const update = useCallback(() => typeof _update === 'function' && _update(), [_update]);

  const showAndUpdate = useCallback(() => {
    show();
    setTimeout(update, 0);
  }, [show, update]);

  return {
    tooltipProps: { pinned, styles, attributes, setArrowElement, setPopperElement, visible },
    show,
    hide,
    update,
    showAndUpdate,
    ref: setReferenceElement,
    visible,
  };
}
