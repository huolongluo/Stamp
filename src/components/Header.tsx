import Link from "next/link";

export function Header() {
  return (
    <header className="site-header wrap">
      <Link className="brand" href="/">Stamp</Link>
      <nav className="nav">
        <Link href="/phone?play=1">Phone</Link>
        <Link href="/how">Rules</Link>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer wrap">
      <span>Shenzhen to Lagos · one stamp</span>
      <span>This folder is Stamp.</span>
    </footer>
  );
}
