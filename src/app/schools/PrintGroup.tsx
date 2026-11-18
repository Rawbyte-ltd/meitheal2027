"use client";

// Prints one part of the schools page: sets body[data-print] for the duration of the print dialog,
// and globals.css hides every section that belongs to the other group.
export default function PrintGroup({ group, label }: { group: "teachers" | "parents"; label: string }) {
  function go() {
    const done = () => { document.body.removeAttribute("data-print"); window.removeEventListener("afterprint", done); };
    document.body.setAttribute("data-print", group);
    window.addEventListener("afterprint", done);
    window.print();
  }
  return <button className="btn" type="button" onClick={go}>{label}</button>;
}
