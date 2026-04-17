import "../styles/CategoryBar.css";

const CATEGORIES = [
  { id: "general", label: "For You" },
  { id: "world", label: "World" },
  { id: "nation", label: "Nation" },
  { id: "business", label: "Business" },
  { id: "technology", label: "Tech" },
  { id: "entertainment", label: "Entertainment" },
  { id: "sports", label: "Sports" },
  { id: "health", label: "Health" },
  { id: "science", label: "Science" },
];

export default function CategoryBar({ active, onChange }) {
  return (
    <div className="category-bar">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          className={`category-pill ${active === cat.id ? "active" : ""}`}
          onClick={() => onChange(cat.id)}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
