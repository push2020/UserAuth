// import { useState } from "react";
// import "./Tooltip.scss";
// import { ic_tooltip } from "../../utils/iconSvg";

// const Tooltip = ({ message, children, disable = "" }) => {
//   const [visible, setVisible] = useState(false);

//   return (
//     <div className={`tooltip ${disable}`}>
//       {visible && message && (
//         <div className="tooltip__message">
//           <div className="tooltip__ictip">{ic_tooltip}</div>
//           {message && <span>{message}</span>}
//         </div>
//       )}
//       <div
//         className="tooltip__pointer"
//         onMouseEnter={() => setVisible(true)}
//         onMouseLeave={() => setVisible(false)}
//       >
//         {children}
//       </div>
//     </div>
//   );
// };

// export default Tooltip;

import { useFloating, offset, flip, shift } from "@floating-ui/react";
import { useState } from "react";
import { ic_tooltip } from "../../utils/iconSvg";
import "./Tooltip.scss";

const Tooltip = ({ message, children, disable = "" }) => {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles } = useFloating({
    open,
    placement: "top",
    middleware: [offset(8), flip(), shift()],
  });

  return (
    <div className={`tooltip ${disable}`}>
      <div
        ref={refs.setReference}
        className="tooltip__pointer"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {children}
      </div>

      {open && message && (
        <div
          ref={refs.setFloating}
          className="tooltip__message"
          style={floatingStyles}
        >
          <div className="tooltip__ictip">{ic_tooltip}</div>
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
