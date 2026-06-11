/**
 * In-app terminal. Type real commands (cd, ls, pwd, git status, ...). `cd` into
 * any folder on your machine and ArchLab immediately maps it onto the canvas.
 */

import { useEffect, useRef, useState } from 'react';
import type { TerminalState } from '../state/useArchLab.js';

interface TerminalProps {
  terminal: TerminalState;
  onCommand: (line: string) => void;
}

/** Shorten a long absolute path for the prompt (keep it readable). */
function shortCwd(cwd: string): string {
  const home = '/Users/';
  if (cwd.startsWith(home)) {
    const parts = cwd.split('/');
    return '~/' + parts.slice(3).join('/');
  }
  return cwd;
}

export function Terminal({ terminal, onCommand }: TerminalProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIndex, setHistIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep the latest output in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [terminal.lines]);

  const submit = () => {
    const line = input.trim();
    if (!line) return;
    onCommand(line);
    setHistory((h) => [...h, line]);
    setHistIndex(null);
    setInput('');
  };

  // Up/down arrow recalls command history.
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const next = histIndex === null ? history.length - 1 : Math.max(0, histIndex - 1);
      setHistIndex(next);
      setInput(history[next]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIndex === null) return;
      const next = histIndex + 1;
      if (next >= history.length) {
        setHistIndex(null);
        setInput('');
      } else {
        setHistIndex(next);
        setInput(history[next]);
      }
    }
  };

  return (
    <div className="terminal" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-scroll" ref={scrollRef}>
        <div className="term-line term-system">
          ArchLab terminal — `cd` into any folder to map it. Try: cd ~/Desktop &amp;&amp; ls
        </div>
        {terminal.lines.map((l, i) => (
          <div key={i} className={`term-line term-${l.stream}`}>
            {l.text}
          </div>
        ))}
      </div>
      <div className="terminal-input-row">
        <span className="term-prompt">{shortCwd(terminal.cwd)} ❯</span>
        <input
          ref={inputRef}
          className="terminal-input"
          value={input}
          spellCheck={false}
          autoComplete="off"
          placeholder="cd /path/to/any/project"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}
