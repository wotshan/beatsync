import React, { useEffect, useRef, useState } from "react";
import styles from "./GlassCarousel.module.css";

const CARDS = [
  { title: "Prototype UI", desc: "Glassmorphism panels and blur effects" },
  { title: "Responsive", desc: "Adapts to small and large screens" },
  { title: "Accessible", desc: "Keyboard + reduced motion support" },
];

export default function GlassCarousel() {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % CARDS.length);
    }, 4000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className={styles.container}>
      <button
        className={styles.nav}
        aria-label="Previous"
        onClick={() => setIndex((i) => (i - 1 + CARDS.length) % CARDS.length)}
      >
        ‹
      </button>

      <div className={styles.viewport}>
        {CARDS.map((c, i) => (
          <div
            key={i}
            className={`${styles.card} ${i === index ? styles.active : ""}`}
            aria-hidden={i !== index}
          >
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>

      <button
        className={styles.nav}
        aria-label="Next"
        onClick={() => setIndex((i) => (i + 1) % CARDS.length)}
      >
        ›
      </button>
    </div>
  );
}
