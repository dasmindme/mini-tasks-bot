export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <div className="app-glow app-glow--one" />
      <div className="app-glow app-glow--two" />
      {children}
    </div>
  )
}