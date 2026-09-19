"use client";

import { useEffect, useState } from "react";

/**
 * Time-based greeting, hydration-safe: renders a neutral string on the server
 * and refines to morning/afternoon/evening after mount (user's local clock).
 */
export function Greeting({ name }: { name: string }) {
  const [text, setText] = useState("Welcome back");

  useEffect(() => {
    const h = new Date().getHours();
    setText(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  return (
    <h1 className="text-2xl font-extrabold tracking-tight text-body sm:text-3xl">
      {text}, {name}
    </h1>
  );
}
