import { useState, useEffect } from 'react'

const words = ['smart', 'school', 'smart', 'school']

export default function TypeWriter() {
  const [wordIndex, setWordIndex] = useState(0)
  const [text, setText] = useState('class')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentWord = words[wordIndex]
    const nextWord = words[(wordIndex + 1) % words.length]

    // figure out the shared starting characters between current and next word
    let commonLength = 0
    for (let i = 0; i < Math.min(currentWord.length, nextWord.length); i++) {
      if (currentWord[i] === nextWord[i]) commonLength++
      else break
    }

    const timeout = setTimeout(() => {
      if (isDeleting) {
        // erase until we reach the common part (e.g. 'c' in class/cool)
        if (text.length > commonLength) {
          setText(text.slice(0, -1))
        } else {
          setIsDeleting(false)
          setWordIndex((prev) => (prev + 1) % words.length)
        }
      } else {
        // type the next word
        if (text.length < currentWord.length) {
          setText(currentWord.slice(0, text.length + 1))
        } else {
          // pause at full word before deleting
          setTimeout(() => setIsDeleting(true), 1500)
        }
      }
    }, isDeleting ? 90 : 120) // deleting is faster than typing

    return () => clearTimeout(timeout)
  }, [text, isDeleting, wordIndex])

  return (
    <span>
      {text}
      <span className="animate-pulse"></span> {/*| blinking cursor */}
    </span>
  )
}