// ── MODAL OVERLAY — the fixed full-screen dim backdrop + centered scrollable
// card shared by every full-screen modal (meal detail, recipe library, event
// detail). Click the backdrop to close; a click inside the card is swallowed
// so it doesn't bubble up and close the modal. Lives in its own leaf file
// (rather than shared.jsx) so both calendar.jsx and family.jsx can import it
// without a circular dependency — shared.jsx already imports from calendar.jsx.
function ModalOverlay({onClose,maxWidth=520,maxHeight="85vh",bg="rgba(0,0,0,0.85)",padding=16,innerStyle,children}){
  return(<div style={{position:"fixed",inset:0,background:bg,zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding}} onClick={onClose}>
    <div style={{maxWidth,width:"100%",maxHeight,overflowY:"auto",...innerStyle}} onClick={e=>e.stopPropagation()}>
      {children}
    </div>
  </div>);
}

export { ModalOverlay };
