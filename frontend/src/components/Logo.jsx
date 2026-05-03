// Logo component using the VM logo PNG
export default function Logo({ className = "w-9 h-9", variant = "default" }) {
  // The logo works on both light and dark backgrounds
  // Place logo.png in the frontend/public folder
  
  return (
    <img 
      src="/logo.png"
      alt="Vyapar Margadarshan Logo" 
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
