import { useEffect, useRef, useState } from 'react'

export default function SearchBar({
  value,
  onChange,
  suggestions = [],
  onPick,
  placeholder = 'Busca por título o artista…',
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const boxRef = useRef(null)

  useEffect(() => {
    const close = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const show = open && value.trim() !== '' && suggestions.length > 0

  function pick(song) {
    onChange(song.title)
    setOpen(false)
    setActive(-1)
    onPick?.(song)
  }

  function onKeyDown(e) {
    if (!show) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      pick(suggestions[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="searchbar" ref={boxRef}>
      <input
        type="search"
        className="searchbar-input"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        aria-label="Buscar canciones"
        aria-expanded={show}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {show && (
        <ul className="searchbar-list" role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'is-active' : ''}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(s)
              }}
              onMouseEnter={() => setActive(i)}
            >
              <strong>{s.title}</strong>
              <span>{s.artist}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}