import React from 'react';
import './Tooltip.scss';

/**
 * A Tooltip component to be used with the useTooltip hook
 */
const Tooltip = ({
  setPopperElement,
  setArrowElement,
  styles,
  attributes,
  pinned,
  visible,
  children,
  ...props
}) => {
  return (
    <div
      className="Tooltip"
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
      data-show={pinned || visible}
      {...props}
    >
      {children}
      <div className="TooltipArrow arrow" ref={setArrowElement} style={styles.arrow} />
    </div>
  );
};

export default Tooltip;
