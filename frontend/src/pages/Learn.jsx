import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Heart,
  Info,
  Users,
  Quote,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Learn = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [items, setItems] = useState([
    {
      id: "a1",
      type: "article",
      title: "Understanding Viral Load",
      category: "health",
      content:
        "Viral load is the amount of HIV in your blood. When you take your medication daily, the viral load can become undetectable.",
      icon: <ActivityIcon />,
    },
    {
      id: "a2",
      type: "article",
      title: "Strength in Faith",
      category: "spiritual",
      content:
        "Isaiah 40:31 - But those who hope in the Lord will renew their strength. They will soar on wings like eagles.",
      icon: <HeartIcon />,
    },
    {
      id: "a3",
      type: "article",
      title: "Managing Side Effects",
      category: "health",
      content:
        "Common side effects include nausea and fatigue. Most side effects go away after a few weeks as your body adjusts.",
      icon: <PillIcon />,
    },
    {
      id: "a4",
      type: "article",
      title: "Community Support",
      category: "lifestyle",
      content:
        "You are not alone. Joining a support group can help you navigate challenges and share experiences.",
      icon: <UsersIcon />,
    },
  ]);

  // Fetch quotes from API
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const res = await api.get("learn/home-quotes/?mode=all");
        const quotes = res.data.map((q) => ({
          id: `quote-${q.id}`,
          type: "quote",
          title: q.author || "Unknown",
          category: q.category?.toLowerCase().trim() || "unknown", // normalize category
          content: q.text,
          icon: <QuoteIcon />,
        }));
        setItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newQuotes = quotes.filter((q) => !existingIds.has(q.id));
          return [...prev, ...newQuotes];
        });
      } catch (error) {
        console.error("Error fetching quotes", error);
      }
    };
    fetchQuotes();
  }, []);

  // Compute unique categories dynamically
  const categories = useMemo(
    () => ["all", ...Array.from(new Set(items.map((item) => item.category)))],
    [items],
  );

  // Filter items based on active category
  const filteredItems = useMemo(
    () =>
      activeCategory === "all"
        ? items
        : items.filter((item) => item.category === activeCategory),
    [items, activeCategory],
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 p-6 border-b border-neutral-200 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-neutral-100 dark:bg-neutral-800 "
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-2xl font-bold">Learn & Grow</h1>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2  text-sm font-medium whitespace-nowrap capitalize transition ${
                activeCategory === cat
                  ? "bg-black text-white shadow-lg"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white dark:bg-neutral-900 p-6  shadow-sm border border-neutral-100 hover:shadow-md transition flex flex-col justify-between h-full ${
              item.type === "quote" ? "border-l-4 border-l-yellow-400" : ""
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`px-2 py-1  text-xs font-bold uppercase tracking-wider ${
                    item.category === "health" || item.category === "physical"
                      ? "bg-blue-100 text-blue-800"
                      : item.category === "spiritual"
                        ? "bg-purple-100 text-purple-800"
                        : item.category === "mental"
                          ? "bg-yellow-100 text-yellow-800"
                          : item.category === "emotional"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                  }`}
                >
                  {item.category}
                </span>
                {item.icon}
              </div>
              {item.type === "quote" ? (
                <>
                  <p className="text-lg italic text-neutral-700 dark:text-neutral-300 mb-2">
                    "{item.content}"
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                    — {item.title}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {item.content}
                  </p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Icons
const ActivityIcon = () => (
  <div className="p-2 bg-blue-50  text-blue-600">
    <Info className="w-5 h-5" />
  </div>
);
const HeartIcon = () => (
  <div className="p-2 bg-purple-50  text-purple-600">
    <Heart className="w-5 h-5" />
  </div>
);
const PillIcon = () => (
  <div className="p-2 bg-red-50  text-red-600">
    <BookOpen className="w-5 h-5" />
  </div>
);
const UsersIcon = () => (
  <div className="p-2 bg-green-50  text-green-600">
    <Users className="w-5 h-5" />
  </div>
);
const QuoteIcon = () => (
  <div className="p-2 bg-yellow-50  text-yellow-600">
    <Quote className="w-5 h-5" />
  </div>
);

export default Learn;
