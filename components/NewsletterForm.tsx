"use client";

export default function NewsletterForm() {
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <input
        type="email"
        placeholder="ইমেইল"
        className="flex-1 min-w-0 rounded-lg px-3 py-2 text-gray-900 text-sm"
      />
      <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 rounded-lg">
        Send
      </button>
    </form>
  );
}