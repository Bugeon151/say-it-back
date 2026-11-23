import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './state';
import { APP_NAME } from './config';
import Home from './screens/Home';
import Setup from './screens/Setup';
import Talk from './screens/Talk';
import Words from './screens/Words';
import Practice from './screens/Practice';
import Progress from './screens/Progress';
import Book from './screens/Book';
import Tour from './screens/Tour';
import Bench from './screens/Bench';

const routes: Record<string, () => JSX.Element | null> = {
  '/': Home, '/setup': Setup, '/talk': Talk, '/words': Words, '/practice': Practice, '/progress': Progress, '/book': Book, '/tour': Tour, '/bench': Bench,
};
const path = () => window.location.hash.replace(/^#/, '') || '/';

function Shell() {
  const [p, setP] = useState(path);
  const { data, ready } = useStore();
  useEffect(() => {
    const on = () => { setP(path()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const Screen = routes[p] ?? Home;
  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.querySelector('main')?.focus(); }}>Skip to content</a>
      <header className="top">
        <a className="brand" href="#/">{APP_NAME}</a>
        {data && (
          <nav aria-label="Main">
            {data.sample && <span className="tag sample">Sample family</span>}
            <a href="#/talk" aria-current={p === '/talk' ? 'page' : undefined}>Talk</a>
            <a href="#/progress" aria-current={p === '/progress' ? 'page' : undefined}>Progress</a>
            <a href="#/book" aria-current={p === '/book' ? 'page' : undefined}>Storybook</a>
          </nav>
        )}
      </header>
      <div id="main" tabIndex={-1}>{ready ? <Screen /> : null}</div>
    </>
  );
}

export default function App() {
  return <StoreProvider><Shell /></StoreProvider>;
}
